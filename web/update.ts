import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const providersDir = join(root, "providers");
const flcPath = join(root, "flc.json");
const readmePath = join(root, "README.md");
const modelsDevUrl = "https://models.dev/api.json";

const RATE_UNITS: [keyof RateLimits, string][] = [
    ["rps", "RPS"], ["tps", "TPS"],
    ["rpm", "RPM"], ["tpm", "TPM"],
    ["rph", "RPH"], ["tph", "TPH"],
    ["rpd", "RPD"], ["tpd", "TPD"],
    ["rpmo", "RP/Mo"], ["tpmo", "TP/Mo"],
];

function limitsText(limits: RateLimits, lang: "zh" | "en" = "en") {
    const parts = RATE_UNITS
        .filter(([key]) => limits[key] != null)
        .map(([key, label]) => `${label} ${limits[key]}`);
    const extra = lang === "zh"
        ? limits.ex_limits_zh ?? limits.ex_limits_en
        : limits.ex_limits_en ?? limits.ex_limits_zh;
    if (extra) parts.push(extra);
    else if (parts.length === 0) parts.push(lang === "zh" ? "未知" : "Unknown");
    return parts.join(" | ");
}

async function loadEnv() {
    const env: Record<string, string> = {};
    let text = "";
    try {
        text = await readFile(join(root, ".env"), "utf8");
    } catch {
        return env;
    }
    for (const line of text.split(/\r?\n/)) {
        if (!line.trim() || line.trimStart().startsWith("#")) continue;
        const eq = line.indexOf("=");
        if (eq < 0) continue;
        env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    }
    return env;
}

function toIds(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
        .map(item => typeof item === "string" ? item : (item as { id?: unknown })?.id)
        .filter((id): id is string => typeof id === "string" && id.length > 0);
}

function applyRegex(ids: string[], pattern?: string) {
    if (!pattern) return ids;
    const re = new RegExp(pattern);
    return ids.filter(id => re.test(id));
}

function uniqueSorted(ids: string[]) {
    return [...new Set(ids)].sort((a, b) => a.localeCompare(b, "en", { numeric: true, sensitivity: "base" }));
}

let modelsDevPromise: Promise<Record<string, any>> | null = null;
function getModelsDev() {
    modelsDevPromise ??= fetch(modelsDevUrl).then(res => {
        if (!res.ok) throw new Error(`models.dev returned ${res.status}`);
        return res.json() as Promise<Record<string, any>>;
    });
    return modelsDevPromise;
}

async function fromModelsDev(provider: ProviderFileType, models: ModelsToGet & { type: "modelsdev" }) {
    const all = await getModelsDev();
    const re = new RegExp(models.provider_name_regex_match, "i");
    const ids: string[] = [];

    for (const [key, entry] of Object.entries(all)) {
        if (!re.test(key) && !re.test(entry?.name ?? "")) continue;
        for (const [id, model] of Object.entries<any>(entry.models ?? {})) {
            const input: string[] = model?.modalities?.input ?? [];
            const output: string[] = model?.modalities?.output ?? [];
            if (!input.includes("text") || !output.includes("text")) continue;
            if (model?.type && model.type !== "chat") continue;
            // 免费判定必须有明确的 0 价，缺失 cost 的不算免费（多为路由/元模型）
            if (models.prize_io_0 && !(model?.cost?.input === 0 && model?.cost?.output === 0)) continue;
            if (models.model_id_regex_match && !new RegExp(models.model_id_regex_match).test(id)) continue;
            if (models.model_id_regex_exclude && new RegExp(models.model_id_regex_exclude).test(id)) continue;
            ids.push(id);
        }
    }

    return uniqueSorted(ids);
}

async function fromApi(provider: ProviderFileType, models: ModelsToGet & { type: "apiget" }, env: Record<string, string>) {
    const key = env[models.keyref] ?? process.env[models.keyref];
    if (!key) throw new Error(`missing env ${models.keyref}`);
    if (!provider.api && !models.custom_model_fetch_url) throw new Error("missing api url");

    const url = models.custom_model_fetch_url || `${(provider.api as string).replace(/\/+$/, "")}/models`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    const body: any = await res.json();
    let value: unknown = body;
    if (models.eval) {
        value = new Function("r", `return (${models.eval})`)(body);
    } else if (!Array.isArray(body)) {
        value = body?.data ?? body?.models ?? [];
    }

    return uniqueSorted(applyRegex(toIds(value), models.model_id_regex_match));
}

async function resolveProvider(provider: ProviderFileType, env: Record<string, string>): Promise<FlcjsonType[number]> {
    const models = provider.models;
    let groups: ModelsGroup[];

    if (Array.isArray(models)) {
        groups = models;
    } else if (models.type === "modelsdev") {
        groups = [{ ratelimits: models.ratelimits, ids: await fromModelsDev(provider, models), ellipsis: false }];
    } else {
        groups = [{ ratelimits: models.ratelimits, ids: await fromApi(provider, models, env), ellipsis: false }];
    }

    groups = groups
        .map(group => ({ ...group, ids: uniqueSorted(group.ids) }))
        .filter(group => group.ids.length > 0);
    if (groups.length === 0) throw new Error("no models matched");

    const { models: _models, ...base } = provider;
    return { ...base, models: groups };
}

function readmeBlock(provider: FlcjsonType[number]) {
    const api = provider.api
        ? /[{}]/.test(provider.api) ? `\`${provider.api}\`` : `[${provider.api}](${provider.api})`
        : "-";
    const tip = [provider.ex_tip_zh, provider.ex_tip_en].filter((tip, index, tips) => tip && tips.indexOf(tip) === index).join(" / ");
    const lines = [
        `### [${provider.name}](${provider.website})`,
        "",
        `- **API:** ${api}`,
    ];

    provider.models.forEach((group, index) => {
        if (index > 0) lines.push("");
        lines.push(`- **Rate Limits:** ${limitsText(group.ratelimits, "en")}`);
        if (index === 0 && tip) lines.push(`- **Tip:** ${tip}`);
        lines.push("- **Models:**");
        for (const id of group.ids) lines.push(`  - \`${id}\``);
        if (group.ellipsis) lines.push("  - ...");
    });

    return lines.join("\n");
}

async function updateReadme(providers: FlcjsonType) {
    const start = "<!-- AUTOGEN_START -->";
    const end = "<!-- AUTOGEN_END -->";
    const current = await readFile(readmePath, "utf8");
    if (!current.includes(start) || !current.includes(end)) {
        throw new Error("README.md is missing AUTOGEN markers");
    }
    const block = `${start}\n\n${providers.map(readmeBlock).join("\n\n")}\n\n${end}`;
    const next = current.replace(/<!-- AUTOGEN_START -->[\s\S]*?<!-- AUTOGEN_END -->/, block);
    if (next === current) return;
    await writeFile(readmePath, next, "utf8");
}

async function main() {
    const env = await loadEnv();
    const files = (await readdir(providersDir)).filter(file => file.endsWith(".json"));

    const settled = await Promise.allSettled(files.map(async file => {
        const provider = JSON.parse(await readFile(join(providersDir, file), "utf8")) as ProviderFileType;
        if (provider.disabled) throw new Error("disabled");
        return resolveProvider(provider, env);
    }));

    const providers: FlcjsonType = [];
    settled.forEach((result, index) => {
        const file = files[index]!;
        if (result.status === "fulfilled") {
            providers.push(result.value);
            console.log(`[ok] ${file}: ${result.value.models.reduce((sum, group) => sum + group.ids.length, 0)} models`);
        } else {
            console.warn(`[skip] ${file}: ${result.reason instanceof Error ? result.reason.message : result.reason}`);
        }
    });

    if (providers.length === 0) throw new Error("no providers resolved; keeping existing flc.json and README.md");
    providers.sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
    await writeFile(flcPath, `${JSON.stringify(providers, null, 2)}\n`, "utf8");
    await updateReadme(providers);
    console.log(`Wrote ${providers.length} providers to flc.json and README.md`);
}

await main();

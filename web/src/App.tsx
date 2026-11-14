import { M3eAppBar } from "@m3e/react/app-bar";
import { M3eIconButton } from "@m3e/react/icon-button";
import { M3eIcon } from "@m3e/react/icon";
import { useEffect, useMemo, useRef, useState } from "react";
import { M3eDrawerContainer, M3eDrawerToggle } from "@m3e/react/drawer-container";
import { M3eNavMenu, M3eNavMenuItemGroup, M3eNavMenuItem } from "@m3e/react/nav-menu";
import { M3eHeading } from "@m3e/react/heading";
import { M3eDivider } from "@m3e/react/divider";
import { M3eSearchBar } from "@m3e/react/search";
import { M3eCard } from "@m3e/react/card";
import { M3eButtonGroup } from "@m3e/react/button-group";
import { M3eAssistChip } from "@m3e/react/chips";
import { M3eTooltip } from "@m3e/react/tooltip";
import flcJson from "../../flc.json";

const providers = flcJson as FlcjsonType;

const RATE_UNITS: [keyof RateLimits, string][] = [
    ["rps", "RPS"], ["tps", "TPS"],
    ["rpm", "RPM"], ["tpm", "TPM"],
    ["rph", "RPH"], ["tph", "TPH"],
    ["rpd", "RPD"], ["tpd", "TPD"],
    ["rpmo", "RP/Mo"], ["tpmo", "TP/Mo"],
];

function limitsText(limits: RateLimits, isZh: boolean) {
    const parts = RATE_UNITS
        .filter(([key]) => limits[key] != null)
        .map(([key, label]) => `${label} ${limits[key]}`);
    const extra = isZh
        ? limits.ex_limits_zh ?? limits.ex_limits_en
        : limits.ex_limits_en ?? limits.ex_limits_zh;
    if (extra) parts.push(extra);
    else if (parts.length === 0) parts.push(isZh ? "未知" : "Unknown");
    return parts.join(" | ");
}

function tokens(text: string, unicode: boolean) {
    return text
        .toLowerCase()
        .split(/[\s-]+/)
        .map(token => token.replace(unicode ? /[^\p{L}\p{N}.]/gu : /[^a-z0-9.]/g, ""))
        .filter(Boolean);
}

function containsAll(haystack: string[], needles: string[]) {
    return needles.every(needle => haystack.some(item => item.includes(needle)));
}

function ProviderCard({ provider, index, isZh, needles }: { provider: FlcjsonType[number]; index: number; isZh: boolean; needles: string[] }) {
    const copy = (text: string) => navigator.clipboard.writeText(text);
    const tip = isZh
        ? provider.ex_tip_zh ?? provider.ex_tip_en
        : provider.ex_tip_en ?? provider.ex_tip_zh;

    return <M3eCard id={`provider-${index}`} className="scroll-mt-20">
        <div className="p-4 gap-1">
            <div className="flex flex-row justify-between gap-3 items-center">
                <div className="flex flex-col justify-between min-w-0 flex-1">
                    <M3eHeading variant="headline" size="medium">
                        {provider.name}
                    </M3eHeading>
                    <M3eHeading variant="label" size="large" className="truncate text-(--md-sys-color-on-surface-variant)">{provider.api}</M3eHeading>
                    {tip && <M3eHeading variant="label" size="medium" className="truncate text-(--md-sys-color-outline)">{tip}</M3eHeading>}
                </div>
                <M3eButtonGroup>
                    <M3eIconButton href={provider.website} target="_blank" variant="tonal" id={`open-${index}`}>
                        <M3eIcon name="open_in_new" />
                    </M3eIconButton>
                    <M3eTooltip htmlFor={`open-${index}`}>{isZh ? '打开网站' : 'Open Website'}</M3eTooltip>
                    <M3eIconButton onClick={() => provider.api && copy(provider.api)} id={`copy-${index}`}>
                        <M3eIcon name="content_copy" />
                    </M3eIconButton>
                    <M3eTooltip htmlFor={`copy-${index}`}>BaseURL</M3eTooltip>
                </M3eButtonGroup>
            </div>
            {provider.models.map((group, groupIndex) => (
                <div key={groupIndex} className="flex flex-col gap-1">
                    <M3eDivider className="mt-2 mb-2"/>
                    <M3eHeading variant="label" size="large" className="truncate text-(--md-sys-color-on-surface-variant)">
                        {`${isZh ? (group.ratelimits.shared ? '共享限制' : '非共享限制') : (group.ratelimits.shared ? 'Shared limits' : 'Non-shared limits')}: ${limitsText(group.ratelimits, isZh)}`}
                    </M3eHeading>
                    <div>
                        {group.ids.map(id => (
                            <M3eAssistChip key={id} className="mr-1 mb-1" onClick={() => copy(id)}>
                                <M3eIcon slot="icon" name={needles.length > 0 && containsAll(tokens(id, false), needles) ? "check" : "neurology"}></M3eIcon>{id}
                            </M3eAssistChip>
                        ))}
                        {group.ellipsis && <M3eAssistChip className="mr-1 mb-1">...</M3eAssistChip>}
                    </div>
                </div>
            ))}
        </div>
    </M3eCard>;
}

export function App() {
    const [isZh, setLang] = useState(false);
    const [query, setQuery] = useState("");
    const [active, setActive] = useState(0);
    const appBarRef = useRef<any>(null);
    const drawerRef = useRef<any>(null);

    useEffect(() => {
        const appBar = appBarRef.current;
        const drawer = drawerRef.current;
        if (!appBar || !drawer) return;
        const content = drawer.shadowRoot?.querySelector(".content") as HTMLElement | null;
        if (content && typeof appBar.attach === "function") {
            appBar.attach(content);
        }
    }, []);

    useEffect(()=>{
        if(localStorage.getItem('flc-lang')){
            setLang(localStorage.getItem('flc-lang') === 'zh');
            return;
        };
        setLang(navigator.language.includes('zh'));
    },[]);

    const needles = useMemo(() => tokens(query, true), [query]);

    const visible = useMemo(() => {
        return providers
            .map((provider, index) => ({ provider, index }))
            .filter(({ provider }) => !provider.disabled)
            .filter(({ provider }) => {
                if (needles.length === 0) return true;
                if (containsAll(tokens(provider.name, true), needles)) return true;
                return provider.models.some(group =>
                    group.ids.some(id => containsAll(tokens(id, false), needles))
                );
            });
    }, [needles]);

    useEffect(() => {
        const drawer = drawerRef.current;
        const scroller = drawer?.shadowRoot?.querySelector(".content") as HTMLElement | null;
        const target: HTMLElement | Window = scroller ?? window;
        const update = () => {
            let current = visible[0]?.index ?? 0;
            for (const { index } of visible) {
                const card = document.getElementById(`provider-${index}`);
                if (card && card.getBoundingClientRect().top <= 120) current = index;
            }
            setActive(current);
        };
        update();
        target.addEventListener("scroll", update, { passive: true });
        return () => target.removeEventListener("scroll", update);
    }, [visible]);

    return <M3eDrawerContainer ref={drawerRef} start-mode="auto" className="h-full">
        <div slot="start" id="toc-drawer">
            <M3eNavMenu>
                <M3eNavMenuItemGroup>
                    <M3eHeading slot="label" variant="label">{isZh ? '目录' : 'Table of Contents'}</M3eHeading>
                    {visible.map(({ provider, index }) => (
                        <M3eNavMenuItem key={`${provider.name}-${index}`} selected={index === active} onClick={() => {
                            document.getElementById(`provider-${index}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}>
                            <span slot="label">{provider.name}</span>
                        </M3eNavMenuItem>
                    ))}
                </M3eNavMenuItemGroup>
            </M3eNavMenu>
        </div>

        <M3eAppBar ref={appBarRef} size="large" scroll-behavior="compress" style={{ position: "sticky", top: 0, zIndex: 2 }}>
            <M3eIconButton slot="leading" toggle>
                <M3eIcon name="left_panel_open"/>
                <M3eIcon slot="selected" name="left_panel_close" />
                <M3eDrawerToggle htmlFor="toc-drawer"/>
            </M3eIconButton>
            <span slot="title">Free-LLM-Collection Web</span>
            <span slot="subtitle">{isZh ? '免费大模型API合集' : 'Free GPT-like Language Model(LLM) API Collection'}</span>
            <M3eIconButton slot="trailing" onClick={()=>{
                setLang(!isZh);
                localStorage.setItem('flc-lang', isZh ? 'en' : 'zh');
            }}>
                <M3eIcon name="translate" />
            </M3eIconButton>
            <M3eIconButton slot="trailing" href="https://github.com/for-the-zero/Free-LLM-Collection" target="_blank">
                <M3eIcon name="pull_request" />
            </M3eIconButton>
        </M3eAppBar>

        <div className="p-4 flex flex-col gap-4">
            <div className="whitespace-pre-wrap">
                {isZh 
                    ? [
                        '这是一个由',
                        <a href="https://ftz.is-a.dev/" target="_blank">for_the_zero</a>,
                        '收集的免费大模型API合集，旨在寻找可以免费使用大模型API的渠道\n',
                        '入选要求为：\n',
                        '1. 长期可免费使用\n',
                        '2. 非一次性额度\n',
                        '3. 速率限制可刷新\n',
                        '4. 无需信用卡等验证\n',
                        '5. 无需AFF\n',
                        '可通过Issue/PR进行投稿，允许个人公益站/中转站投稿'
                    ]
                    : [
                        'This is a collection of free GPT-like Language Model(LLM) API, aiming to find a way to use free GPT-like LLM API.\n',
                        'Requirements:\n',
                        '1. Long-term free use\n',
                        '2. Non-one-time quota\n',
                        '3. Rate limit refreshable\n',
                        '4. No need for credit card verification\n',
                        '5. No need for AFF\n',
                        'You can submit your contribution via Issue/PR, allowing for personal non-profit sites/intermediaries to submit.'
                    ]}
            </div>

            <M3eDivider/>

            <M3eSearchBar clearable onClear={() => setQuery("")}>
                <M3eIcon name="search" slot="leading" />
                <input slot="input" placeholder="Search..." onChange={(event) => setQuery(event.target.value)} />
            </M3eSearchBar>

            <div className="columns-1 sm:columns-2 gap-4 *:mb-4 *:break-inside-avoid *:block">
                {visible.map(({ provider, index }) => (
                    <ProviderCard key={`${provider.name}-${index}`} provider={provider} index={index} isZh={isZh} needles={needles} />
                ))}
            </div>
        </div>
    </M3eDrawerContainer>;
};

export default App;

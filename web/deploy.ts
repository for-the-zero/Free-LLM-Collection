const root = `${import.meta.dir}/..`;

await Bun.$`bun run update`.cwd(import.meta.dir);
await Bun.$`bun run build`.cwd(import.meta.dir);

await Bun.$`git -C ${root} add -A`;
const staged = await Bun.$`git -C ${root} diff --cached --quiet`.nothrow();
if (staged.exitCode !== 0) {
    const time = new Date().toISOString().replace("T", " ").slice(0, 19);
    await Bun.$`git -C ${root} commit -m ${`Updated: ${time}`}`;
}
await Bun.$`git -C ${root} push`;

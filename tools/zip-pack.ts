import { execFileSync } from "node:child_process";
import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { join } from "node:path";

/**
 * 把 dist 下的 SorterBE-<version>.mcpack 再打一个中文文件名的 zip。
 *
 * GitHub 会过滤 Release 资源名里的中文（Sorter自动整理-1.5.0.mcpack → Sorter.-1.5.0.mcpack），
 * 所以外层 zip 用 ASCII 名，里面保留中文名。
 */

const dist = "dist";
const tmp = join(dist, ".zip-tmp");

const packs = (await readdir(dist)).filter((file) => /^SorterBE-.+\.mcpack$/.test(file));
if (packs.length === 0) {
	throw new Error("dist 下没有找到 SorterBE-*.mcpack，请先运行 bun run pack");
}

await rm(tmp, { recursive: true, force: true });
await mkdir(tmp, { recursive: true });

const zips: string[] = [];
try {
	for (const pack of packs) {
		const version = pack.replace(/^SorterBE-/, "").replace(/\.mcpack$/, "");
		const inner = `Sorter自动整理-${version}.mcpack`;
		const zip = join(dist, `SorterBE-${version}-cn.zip`);

		await cp(join(dist, pack), join(tmp, inner));
		await rm(zip, { force: true });
		execFileSync("zip", ["-q", "-j", zip, join(tmp, inner)]);
		zips.push(zip);
	}
} finally {
	await rm(tmp, { recursive: true, force: true });
}

console.log(`已生成：\n${zips.join("\n")}`);

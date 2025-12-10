import fs from "fs";
import readline from "readline";

type Item = {
	v: number;
	ID: string;
	[key: string]: any;
};

interface BedrockData {
	enums: {
		block: Record<string, string>;
		item: Record<string, string>;
	};
}

// ----- 工具 -----
function question(text: string) {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	return new Promise<string>((resolve) =>
		rl.question(text, (ans) => {
			rl.close();
			resolve(ans.trim());
		})
	);
}

async function getBedrockIds() {
	const raw = await fetch("https://idlist.projectxero.top/data/beta/vanilla.json");
	const data: BedrockData = await raw.json();
	const ids = new Set<string>();
	for (const key in data.enums.item) ids.add(key);
	for (const key in data.enums.block) ids.add(key);
	console.log(`从远程读取 ${ids.size} 个基岩版 id`);
	return ids;
}

async function getAllJavaItems() {
	const raw = await fetch("https://mcid.lingningyu.cn/use_mcid/json/cList.BAI.json");
	const data: Item[] = await raw.json();
	return data;
}

// ----- 主流程 -----
async function main() {
	const all = await getAllJavaItems();

	// 提取所有版本号 v
	const versions = [...new Set(all.map((i) => i.v))].sort((a, b) => b - a);

	// 取最新10个
	const latest10 = versions.slice(0, 10);

	console.log("\n最新版本列表（取前10个）：");
	latest10.forEach((v) => console.log(" -", v));

	const input = await question("\n请输入要处理的版本号: ");
	const version = Number(input);

	if (!version || !versions.includes(version)) {
		console.log("❌ 输入版本号无效");
		return;
	}

	console.log(`\n正在提取版本 ${version} 的 ID ...`);

	const bedrockIds = await getBedrockIds();

	const output: string[] = [];

	for (const item of all) {
		if (item.v !== version || !item.ID) continue;
		const id = item.ID.split(".", 2)[1];
		if (!id) continue;

		if (bedrockIds.has(id)) output.push(`"${id}",`);
		else output.push(`"${id}" [not found]`);
	}

	fs.writeFileSync("output.txt", output.join("\n"), "utf-8");

	console.log(`\n✨ 完成！共写入 ${output.length} 个 ID 到 output.txt`);
}

main();

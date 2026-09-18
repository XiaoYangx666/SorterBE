/**
 * SorterBE 物品表更新工具
 *
 * 在项目根目录执行（Node 22.18+ / 23+ 可直接运行 .ts）：
 *
 *   1. 更新本地 id 字典（tools/vanilla.json，index.html 会自动加载）
 *      node tools/update.ts dict [--channel beta|release]
 *
 *   2. 找出某个版本新增的物品（相对上次同步版本）
 *      node tools/update.ts new [--to 1.26.60] [--from 1.26.50] [--channel beta]
 *      - 结果写入 tools/new_items.json
 *      - 然后打开 tools/index.html，把新物品拖进分组，导出覆盖 tools/project.json
 *
 *   3. 生成分类表并追加时间序表（在改完 project.json 之后执行）
 *      node tools/update.ts apply --version 1.26.60
 *      - 重新生成 src/tables/categorized.ts
 *      - 把 default.ts 里还没有的物品按 //26.60新增 追加
 *      - 更新 tools/update-state.json 记录已同步版本
 *
 *   4. 一致性检查
 *      node tools/update.ts check [--fix]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");

const P = {
	project: path.join(here, "project.json"),
	vanilla: path.join(here, "vanilla.json"),
	newItems: path.join(here, "new_items.json"),
	state: path.join(here, "update-state.json"),
	categorized: path.join(ROOT, "src", "tables", "categorized.ts"),
	defaultTable: path.join(ROOT, "src", "tables", "default.ts"),
};

const NPM_META = "https://registry.npmjs.org/@minecraft/vanilla-data";
const DICT_URL = (channel) =>
	`https://idlist.projectxero.top/data/${channel}/vanilla.json`;
const CDN_BASE = [
	(v) => `https://cdn.jsdelivr.net/npm/@minecraft/vanilla-data@${v}/lib`,
	(v) => `https://unpkg.com/@minecraft/vanilla-data@${v}/lib`,
];

/** 技术性重复 id，不需要放进整理表 */
const TECHNICAL = [
	/double_slab$/,
	/standing_sign$/,
	/wall_sign$/,
	/wall_hanging_sign$/,
];

// ---------------------------------------------------------------- 基础工具

function readJson(file) {
	return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
	fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

async function fetchText(url) {
	const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
	if (!res.ok) throw new Error(`${res.status} ${res.statusText} ${url}`);
	return res.text();
}

function extractIds(dts) {
	const set = new Set();
	for (const m of dts.matchAll(/"minecraft:([a-z0-9_]+)"/g)) set.add(m[1]);
	return set;
}

async function fetchVanilla(version) {
	let lastError;
	for (const base of CDN_BASE) {
		try {
			const [item, block] = await Promise.all([
				fetchText(`${base(version)}/mojang-item.d.ts`),
				fetchText(`${base(version)}/mojang-block.d.ts`),
			]);
			return { items: extractIds(item), blocks: extractIds(block) };
		} catch (err) {
			lastError = err;
		}
	}
	throw new Error(`无法获取 @minecraft/vanilla-data@${version}: ${lastError}`);
}

async function fetchDict(channel) {
	const raw = await fetchText(DICT_URL(channel));
	return JSON.parse(raw);
}

async function latestVanillaVersion() {
	const meta = JSON.parse(await fetchText(NPM_META));
	return meta["dist-tags"].latest;
}

function getState() {
	if (!fs.existsSync(P.state)) return { supported: "1.26.33" };
	return readJson(P.state);
}

function setState(state) {
	writeJson(P.state, state);
}

// ---------------------------------------------------------------- project

function walkProject(nodes, visit) {
	for (const node of nodes) {
		visit(node);
		if (node.type === "group") walkProject(node.children || [], visit);
	}
}

function loadProject(info = true) {
	let tree = [];
	if (fs.existsSync(P.project)) {
		tree = readJson(P.project);
	} else if (info) {
		throw new Error(`找不到 ${P.project}`);
	}
	const ids = [];
	walkProject(tree, (node) => {
		if (node.type === "item") ids.push(node.id);
	});
	return { tree, ids, set: new Set(ids) };
}

/** 按 index.html 导出的格式生成 categorized.ts */
function generateCategorized(tree) {
	let out = "export const ids: string[] = [\n";
	let first = true;
	const emit = (nodes) => {
		for (const node of nodes) {
			if (node.type === "group") {
				if (!first) out += "\n";
				out += `\t// === ${node.name} ===\n`;
				first = false;
				emit(node.children || []);
			} else {
				out += `\t"${node.id}",\n`;
				first = false;
			}
		}
	};
	emit(tree);
	return out + "];\n";
}

function readQuotedIds(file) {
	const text = fs.readFileSync(file, "utf8");
	return [...text.matchAll(/"([a-z0-9_]+)",/g)].map((m) => m[1]);
}

// ---------------------------------------------------------------- 输出

function log(msg) {
	console.log(msg);
}

function section(title) {
	console.log(`\n\x1b[36m${title}\x1b[0m`);
}

// ---------------------------------------------------------------- 命令

async function cmdDict(args) {
	const channel = args.channel || "beta";
	section(`更新字典 (${channel})`);
	const dict = await fetchDict(channel);
	writeJson(P.vanilla, dict);
	const blocks = Object.keys(dict.enums?.block || {}).length;
	const items = Object.keys(dict.enums?.item || {}).length;
	log(`✔ tools/vanilla.json 已更新：${blocks} 方块 / ${items} 物品`);
}

async function cmdNew(args) {
	const state = getState();
	const from = args.from || state.supported;
	const to = args.to || (await latestVanillaVersion());
	const channel = args.channel || "beta";

	section(`查找新增物品  ${from} -> ${to} (${channel})`);
	if (from === to) {
		log("起始版本和目标版本相同，无需更新。可用 --from 指定起始版本。");
		return;
	}

	const [oldData, newData, dict] = await Promise.all([
		fetchVanilla(from),
		fetchVanilla(to),
		fetchDict(channel),
	]);

	const oldSet = new Set([...oldData.items, ...oldData.blocks]);
	const newSet = new Set([...newData.items, ...newData.blocks]);
	const dictBlock = dict.enums?.block || {};
	const dictItem = dict.enums?.item || {};
	const nameOf = (id) => dictItem[id] || dictBlock[id] || id;
	const kindOf = (id) => (dictItem[id] ? "item" : "block");

	const added = [...newSet].filter((id) => !oldSet.has(id));
	const available = added.filter((id) => dictItem[id] || dictBlock[id]);
	const technical = available.filter((id) => TECHNICAL.some((re) => re.test(id)));
	const real = available.filter((id) => !technical.includes(id));

	const project = loadProject().set;
	const fresh = real.filter((id) => !project.has(id));
	const already = real.filter((id) => project.has(id));

	const result = fresh.map((id) => ({ id, name: nameOf(id), kind: kindOf(id) }));
	writeJson(P.newItems, result);

	log(`新增 id 总数：${added.length}`);
	log(`其中基岩版可用：${available.length}（技术性过滤 ${technical.length}）`);
	log(`已存在分类表：${already.length}`);
	log(`待分类新物品：${fresh.length}  -> 写入 tools/new_items.json`);
	if (already.length) log(`  已完成：${already.join(", ")}`);
	if (technical.length) log(`  已跳过技术性 id：${technical.join(", ")}`);
	if (fresh.length) {
		section("待分类物品");
		for (const { id, name } of result) log(`  ${name}  (${id})`);
		log(
			`\n下一步：打开 tools/index.html，把以上物品拖进分组后导出覆盖 tools/project.json，再执行：\n  node tools/update.ts apply --version ${to}`
		);
	}

	// 检查字典中已不存在 / 改名的 id
	const renamed = [...project].filter((id) => !dictItem[id] && !dictBlock[id]);
	if (renamed.length) {
		section("警告：以下 id 不在最新字典中（可能已改名或移除）");
		for (const id of renamed) log(`  ${id}`);
	}
}

function cmdApply(args) {
	const version = args.version;
	if (!version) {
		log("缺少 --version，例如：node tools/update.ts apply --version 1.26.60");
		process.exit(1);
	}
	const label = args.label || version.replace(/^1\./, "");

	section(`生成表 (${label})`);
	const { tree, ids } = loadProject();
	const generated = generateCategorized(tree);
	fs.writeFileSync(P.categorized, generated);
	log(`✔ src/tables/categorized.ts 已生成（${ids.length} 个 id）`);

	// default.ts 追加：只追加 new_items.json 里的新物品
	const defaultSet = new Set(readQuotedIds(P.defaultTable));
	const projectSet = new Set(ids);
	const missing = ids.filter((id) => !defaultSet.has(id));
	const hasNewList = fs.existsSync(P.newItems);
	const newItems = hasNewList ? readJson(P.newItems).map((x) => x.id) : [];

	const toAppend = hasNewList
		? newItems.filter((id) => missing.includes(id))
		: missing;
	const historical = hasNewList
		? missing.filter((id) => !newItems.includes(id))
		: [];

	if (toAppend.length) {
		const block =
			`\t//${label}新增\n` + toAppend.map((id) => `\t"${id}",\n`).join("");
		const text = fs.readFileSync(P.defaultTable, "utf8");
		if (!text.endsWith("];\n")) throw new Error("default.ts 结尾格式异常");
		fs.writeFileSync(P.defaultTable, text.slice(0, -3) + block + "];\n");
		log(`✔ src/tables/default.ts 追加 ${toAppend.length} 项（//${label}新增）`);
	} else {
		log("没有需要追加的新物品");
	}
	if (historical.length) {
		log(
			`! default.ts 还有 ${historical.length} 个历史缺失项（未自动追加）：${historical.join(", ")}`
		);
	}

	// 未归类提醒
	if (hasNewList) {
		const pending = newItems.filter((id) => !projectSet.has(id));
		if (pending.length) {
			section("警告：以下新物品还未加入 tools/project.json");
			log("  " + pending.join(", "));
		}
	}

	const state = getState();
	state.supported = version;
	setState(state);
	log(`✔ 已同步版本记录：${version}`);
}

function cmdCheck(args) {
	section("一致性检查");
	let ok = true;

	// 1. categorized.ts 与 project.json 是否一致
	const { tree, ids } = loadProject();
	const generated = generateCategorized(tree);
	const current = fs.readFileSync(P.categorized, "utf8");
	if (generated === current) {
		log("✔ categorized.ts 与 project.json 一致");
	} else {
		ok = false;
		log("✘ categorized.ts 与 project.json 不一致");
		if (args.fix) {
			fs.writeFileSync(P.categorized, generated);
			log("  -> 已用 --fix 重新生成");
		} else {
			log("  -> 执行 node tools/update.ts check --fix 自动修复");
		}
	}

	// 2. 重复 id
	const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
	if (dup.length) {
		ok = false;
		log(`✘ project.json 存在重复 id：${[...new Set(dup)].join(", ")}`);
	} else {
		log("✔ project.json 无重复 id");
	}

	// 3. default.ts 缺失 / 多余
	const defaultIds = readQuotedIds(P.defaultTable);
	const defaultSet = new Set(defaultIds);
	const missing = ids.filter((id) => !defaultSet.has(id));
	if (missing.length) {
		log(`✘ default.ts 缺少 ${missing.length} 项：${missing.join(", ")}`);
		log("  -> 新物品执行 apply 会自动追加；历史缺失项请手动确认顺序位置");
	} else {
		log("✔ default.ts 包含全部物品");
	}

	// 4. 字典校验
	if (fs.existsSync(P.vanilla)) {
		const dict = readJson(P.vanilla);
		const dictItem = dict.enums?.item || {};
		const dictBlock = dict.enums?.block || {};
		const unknown = ids.filter((id) => !dictItem[id] && !dictBlock[id]);
		if (unknown.length) {
			log(`✘ ${unknown.length} 个 id 不在 tools/vanilla.json 中：${unknown.join(", ")}`);
		} else {
			log("✔ 全部 id 都在本地字典中");
		}
	} else {
		log("! 未找到 tools/vanilla.json，先执行 node tools/update.ts dict");
	}

	// 5. 新物品是否都已归类
	if (fs.existsSync(P.newItems)) {
		const pending = readJson(P.newItems)
			.map((x) => x.id)
			.filter((id) => !new Set(ids).has(id));
		if (pending.length) {
			log(`! tools/new_items.json 中还有 ${pending.length} 项未归类`);
		}
	}

	if (!ok && !args.fix) process.exitCode = 1;
}

// ---------------------------------------------------------------- CLI

function parseArgs(argv) {
	const args = { _: [] };
	for (let i = 0; i < argv.length; i++) {
		const token = argv[i];
		if (token.startsWith("--")) {
			const key = token.slice(2);
			const next = argv[i + 1];
			if (next && !next.startsWith("--")) {
				args[key] = next;
				i++;
			} else {
				args[key] = true;
			}
		} else {
			args._.push(token);
		}
	}
	return args;
}

function printHelp() {
	console.log(`SorterBE 物品表更新工具

  node tools/update.ts dict  [--channel beta|release]
  node tools/update.ts new   [--to <版本>] [--from <版本>] [--channel beta|release]
  node tools/update.ts apply --version <版本> [--label <标签>]
  node tools/update.ts check [--fix]
`);
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	const command = args._[0] || "help";
	switch (command) {
		case "dict":
			await cmdDict(args);
			break;
		case "new":
			await cmdNew(args);
			break;
		case "apply":
			cmdApply(args);
			break;
		case "check":
			cmdCheck(args);
			break;
		default:
			printHelp();
	}
}

main().catch((err) => {
	console.error(`\n\x1b[31m✘ ${err?.message || err}\x1b[0m`);
	process.exit(1);
});

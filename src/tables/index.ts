import { world } from "@minecraft/server";
import { getAllPlayers } from "sapi-pro/func";
import { sorter_ordertable } from "../config";
import { LangText } from "sapi-pro";
import { UILang } from "../lang";

interface orderTable {
	name: LangText;
	buildMap: () => Promise<Map<string, number>>;
	idMap?: Map<string, number>;
	description: LangText;
}

function buildMap(ids: string[]) {
	const map = new Map<string, number>();
	ids.forEach((id, idx) => {
		map.set(id, idx);
	});
	return map;
}

export const orderTables: orderTable[] = [
	{
		name: UILang.table.time,
		description: UILang.table.time_desc,
		buildMap: async () => {
			const ids = (await import("./default")).ids;
			return buildMap(ids);
		},
	},
	{
		name: UILang.table.group,
		description: UILang.table.group_desc,
		buildMap: async () => {
			const ids = (await import("./categorized")).ids;
			return buildMap(ids);
		},
	},
];

export async function getOrderTableIdMap(index: number) {
	const table = orderTables[index];
	if (!table) {
		throw new Error(`id为${index}的物品排序列表不存在`);
	}
	//有则返回
	if (table.idMap) return table.idMap;
	//没有则加载
	try {
		table.idMap = await table.buildMap();
		return table.idMap;
	} catch (err) {
		throw new Error("id表加载失败", { cause: err });
	}
}

//预加载用到的idMap
world.afterEvents.worldLoad.subscribe(() => {
	const tableIds: number[] = [];
	getAllPlayers().forEach((p) => {
		const tableid = sorter_ordertable.get(p);
		if (tableid && !tableIds.includes(tableid)) {
			tableIds.push(tableid);
		}
	});
	for (let id of tableIds) {
		getOrderTableIdMap(id);
	}
});

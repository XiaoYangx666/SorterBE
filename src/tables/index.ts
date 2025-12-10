import { world } from "@minecraft/server";
import { getAllPlayers } from "sapi-pro/scripts/func";
import { sorter_ordertable } from "../db";

interface orderTable {
	name: string;
	buildMap: () => Promise<Map<string, number>>;
	idMap?: Map<string, number>;
	description: string;
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
		name: "物品发布顺序表",
		description: "根据物品的发布版本为排序依据，出现早的物品更靠前",
		buildMap: async () => {
			const ids = (await import("./default")).ids;
			return buildMap(ids);
		},
	},
	{
		name: "物品分类顺序表",
		description: "根据物品作用分类后的id表，如武器和装备、工具、食物、作物",
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

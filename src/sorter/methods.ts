import { Container, ItemStack, Player } from "@minecraft/server";
import { LangText } from "sapi-pro";
import { sorter_ordertable } from "../config";
import { UILang } from "../lang";
import { getOrderTableIdMap } from "../tables";
import { compareMap } from "./compare";
import { ContaienrTypeData, SlotInfo } from "./sort";

//---通用比较方法---
type CompareFuncBuilder = (player: Player) => Promise<CompareFunc> | CompareFunc;
interface CompareMethod {
	name: LangText;
	func: CompareFuncBuilder;
}
export type CompareFunc = (a: ItemStack, b: ItemStack) => number;

function compareByName(a: ItemStack, b: ItemStack) {
	let first = a.nameTag || a.typeId;
	let second = b.nameTag || b.typeId;
	if (first > second) {
		return 1;
	} else if (first == second) {
		//尝试特殊比较
		const compareFunc = compareMap[first.split(":")[1]];
		if (compareFunc) return compareFunc(a, b);
		return 0;
	} else {
		return -1;
	}
}

async function buildIdCompareFunc(player: Player) {
	const tableId = sorter_ordertable.get(player) ?? 0;
	const idMap = await getOrderTableIdMap(tableId);
	return (a: ItemStack, b: ItemStack) => {
		const aId = a.typeId.split(":")[1];
		const bId = b.typeId.split(":")[1];
		let first = idMap.get(aId) ?? 3000;
		let second = idMap.get(bId) ?? 3000;
		if (first == second) {
			if (first == 3000) return compareByName(a, b);
			if (compareMap[aId]) return compareMap[aId](a, b);
		}
		return first - second;
	};
}

export const sortMethods: CompareMethod[] = [
	{ name: UILang.method.byTable, func: buildIdCompareFunc },
	{ name: UILang.method.byName, func: () => compareByName },
];

//---整理方向---
interface SortDir {
	name: string;
	func: SortDirfunc;
}
type SortDirfunc = (
	container: Container,
	itemArray: ItemStack[],
	slots: SlotInfo[],
	type: ContaienrTypeData
) => void;

const putInZ: SortDirfunc = (container, itemArray, slots, type) => {
	const min = type.minSlot;
	for (let i = min, j = 0; i < slots.length; i++) {
		if (slots[i].available === false) continue;
		container.setItem(i, undefined);
		if (j < itemArray.length) {
			container.setItem(i, itemArray[j++]);
		}
	}
};

const putInN: SortDirfunc = (container, itemArray, slots, type) => {
	const cols = type.cols;
	const min = type.minSlot;
	const rows = Math.floor(((type.size ?? container.size) - min) / cols);

	let c = 0;
	for (let i = 0; i < cols; i++) {
		for (let row = 0; row < rows; row++) {
			const idx = i + row * cols + min;
			if (!slots[idx].available) continue;
			// world.sendMessage(idx.toString());
			container.setItem(idx, undefined);
			if (c < itemArray.length) {
				container.setItem(idx, itemArray[c++]);
			}
		}
	}
};
//0 1 2 3 4
//  5 6 7 8
export const sortDirs: SortDir[] = [
	{ name: "Z", func: putInZ },
	{ name: "N", func: putInN },
];

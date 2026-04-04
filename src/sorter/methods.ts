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

function isSame(slot: SlotInfo, item: ItemStack | undefined) {
	const previous = slot.item;
	return (
		(previous == undefined && item == undefined) ||
		(previous != undefined &&
			item != undefined &&
			slot.amount === item.amount &&
			previous.isStackableWith(item))
	);
}

const putWithIterator = (
	container: Container,
	itemArray: ItemStack[],
	slots: SlotInfo[],
	iterator: () => Iterable<number>
) => {
	let j = 0;

	for (const idx of iterator()) {
		const slot = slots[idx];
		const item: ItemStack | undefined = itemArray[j];

		// 跳过锁定
		if (slot.available === false) continue;

		// 跳过完全相同
		if (isSame(slot, item)) {
			j++;
			continue;
		}

		container.setItem(idx, undefined);

		if (j < itemArray.length) {
			container.setItem(idx, item);
			j++;
		}
	}
};

const putInZ: SortDirfunc = (container, itemArray, slots, type) => {
	const min = type.minSlot;

	putWithIterator(container, itemArray, slots, function* () {
		for (let i = min; i < slots.length; i++) {
			yield i;
		}
	});
};

const putInN: SortDirfunc = (container, itemArray, slots, type) => {
	const cols = type.cols;
	const min = type.minSlot;
	const size = type.size ?? container.size;
	const rows = Math.floor((size - min) / cols);

	putWithIterator(container, itemArray, slots, function* () {
		for (let i = 0; i < cols; i++) {
			for (let row = 0; row < rows; row++) {
				yield i + row * cols + min;
			}
		}
	});
};

export const sortDirs: SortDir[] = [
	{ name: "Z", func: putInZ },
	{ name: "N", func: putInN },
];

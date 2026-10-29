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
	/**槽位遍历顺序；读取与放置必须用同一顺序，否则相同排序键的物品每次整理都会互换位置 */
	order: SortOrder;
	func: SortDirfunc;
}
type SortOrder = (type: ContaienrTypeData, size: number) => Iterable<number>;
type SortDirfunc = (
	container: Container,
	itemArray: ItemStack[],
	slots: SlotInfo[],
	type: ContaienrTypeData
) => void;

function isSame(slot: SlotInfo, item: ItemStack | undefined) {
	// 物品对象来自同一次读取，未移动时引用相同；合并会改写数量，用读取时的快照兜住。
	// 不能用 isStackableWith：它对不可堆叠物品永远返回 false，会把工具/盔甲等每轮都重写。
	return slot.item === item && slot.amount === item?.amount;
}

const putWithIterator = (
	container: Container,
	itemArray: ItemStack[],
	slots: SlotInfo[],
	iterator: Iterable<number>
) => {
	let j = 0;

	for (const idx of iterator) {
		const slot = slots[idx];
		const item: ItemStack | undefined = itemArray[j];

		// 跳过锁定
		if (slot.available === false) continue;

		// 跳过完全相同
		if (isSame(slot, item)) {
			j++;
			continue;
		}

		// 保留双写：直接覆盖会出现物品卡住、玩家无法操作的问题（实机验证），不能省成一次写入
		container.setItem(idx, undefined);

		if (j < itemArray.length) {
			container.setItem(idx, item);
			j++;
		}
	}
};

const zOrder: SortOrder = function* (type, size) {
	for (let i = type.minSlot; i < size; i++) {
		yield i;
	}
};

const nOrder: SortOrder = function* (type, size) {
	const { cols, minSlot } = type;
	const rows = Math.floor((size - minSlot) / cols);
	for (let col = 0; col < cols; col++) {
		for (let row = 0; row < rows; row++) {
			yield col + row * cols + minSlot;
		}
	}
};

const putInZ: SortDirfunc = (container, itemArray, slots, type) => {
	putWithIterator(container, itemArray, slots, zOrder(type, slots.length));
};

const putInN: SortDirfunc = (container, itemArray, slots, type) => {
	const size = type.size ?? container.size;
	putWithIterator(container, itemArray, slots, nOrder(type, size));
};

export const sortDirs: SortDir[] = [
	{ name: "Z", order: zOrder, func: putInZ },
	{ name: "N", order: nOrder, func: putInN },
];

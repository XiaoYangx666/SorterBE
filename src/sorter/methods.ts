import { Container, ItemComponentTypes, ItemStack, Player } from "@minecraft/server";
import { sorter_ordertable } from "../db";
import { getOrderTableIdMap } from "../tables";
import { ContaienrTypeData } from "./sort";

//---特殊比较方法---
const cleanId = (id: string) => id.replace(/:(long_|strong_)+/, ":");
//药水比较
const comparePotion = (a: ItemStack, b: ItemStack) => {
	const aPotion = a.getComponent(ItemComponentTypes.Potion);
	const bPotion = b.getComponent(ItemComponentTypes.Potion);
	if (!aPotion || !bPotion) return 0;

	const aId = cleanId(aPotion.potionEffectType.id);
	const bId = cleanId(bPotion.potionEffectType.id);
	if (aId !== bId) return aId > bId ? 1 : -1;

	// 比较投递方式
	if (aPotion.potionDeliveryType.id !== bPotion.potionDeliveryType.id) {
		return aPotion.potionDeliveryType.id > bPotion.potionDeliveryType.id ? 1 : -1;
	}

	// 同种类 + 同 deliveryType → 比较效果
	const aTicks = aPotion.potionEffectType.durationTicks ?? 0;
	const bTicks = bPotion.potionEffectType.durationTicks ?? 0;
	const aStrong = aPotion.potionEffectType.id.includes("strong");
	const bStrong = bPotion.potionEffectType.id.includes("strong");

	if (aStrong !== bStrong) return aStrong ? 1 : -1;
	if (aTicks !== bTicks) return aTicks > bTicks ? 1 : -1;

	return 0;
};

//特殊比较方法记录(物品id，函数)
export const Compares: Record<string, Function> = {
	potion: comparePotion,
};

//---通用比较方法---
type CompareFuncBuilder = (player: Player) => Promise<Comparefunc> | Comparefunc;
export type Comparefunc = (a: ItemStack, b: ItemStack) => number;

function compareByName(a: ItemStack, b: ItemStack) {
	let first = a.nameTag || a.typeId;
	let second = b.nameTag || b.typeId;
	if (first > second) {
		return 1;
	} else if (first == second) {
		if (Compares[first.split(":")[1]]) return Compares[first.split(":")[1]](a, b);
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
			if (Compares[aId]) return Compares[aId](a, b);
		}
		return first - second;
	};
}

export const sortMethods: Record<string, CompareFuncBuilder> = {
	"按ID表顺序整理(默认)": buildIdCompareFunc,
	按字母顺序整理: () => compareByName,
};

//---整理方向---
type SortDirfunc = (container: Container, itemArray: ItemStack[], slots: boolean[], type: ContaienrTypeData) => void;

const putInZ: SortDirfunc = (container, itemArray, slots, type) => {
	const min = type.minSlot;
	for (let i = min, j = 0; i < slots.length; i++) {
		if (slots[i] === false) continue;
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
			if (!slots[idx]) continue;
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
export const sortDirs: Record<string, SortDirfunc> = { Z字形: putInZ, N字形: putInN };

import { Block, Container, Entity, EntityComponentTypes, ItemLockMode, ItemStack, Player } from "@minecraft/server";
import { sortDirs, sortMethods } from "./methods";
import { sorter_dir, sorter_method } from "./sorterUI";

export interface ContaienrTypeData {
	minSlot: number;
	cols: number;
	size?: number;
}

/**各种容器类型 */
export const ContainerTypes = {
	common: { minSlot: 0, cols: 9 },
	player: { minSlot: 9, cols: 9 },
	hopper: { minSlot: 0, cols: 5 },
	packAnimal: { minSlot: 1, cols: 5 },
} as const;
export type ContainerTypes = keyof typeof ContainerTypes;

// 整理函数
export async function sortContainer(
	container: Container | undefined,
	type: ContaienrTypeData = ContainerTypes.common,
	sortMethod: number = 0,
	sortDir: number = 0
) {
	if (!container) return;
	let itemArray: ItemStack[] = [];
	let availableSlots: boolean[] = new Array(type.size ?? container.size);
	for (let slot = type.minSlot; slot < container.size; slot++) {
		let item = container.getItem(slot);
		availableSlots[slot] = false;
		//跳过被锁定物品
		if (item?.lockMode === ItemLockMode.slot) continue;
		availableSlots[slot] = true; //设置为可用栏位
		if (item) {
			itemArray.push(item);
		}
	}
	try {
		//使用对应的排序方法
		itemArray.sort(Object.values(sortMethods)[sortMethod]);
		//合并
		const result: ItemStack[] = [];
		for (let i = 0; i < itemArray.length; i++) {
			const topitem = result[result.length - 1];
			const item = itemArray[i];
			if (
				topitem &&
				topitem.typeId == item.typeId &&
				topitem.isStackableWith(item) &&
				topitem.amount < topitem.maxAmount
			) {
				//可以合并
				if (topitem.amount + item.amount <= topitem.maxAmount) {
					topitem.amount += item.amount;
				} else {
					item.amount = topitem.amount + item.amount - topitem.maxAmount;
					topitem.amount = topitem.maxAmount;
					result.push(item);
				}
			} else {
				result.push(item);
			}
		}
		//调用对应的放置方法
		Object.values(sortDirs)[sortDir](container, result, availableSlots, type);
	} catch (e) {
		console.error(e);
	}
}

/**根据玩家配置进行整理 */
export async function sortByPlayerSettings(
	container: Container | undefined,
	player: Player,
	type: ContaienrTypeData
): Promise<void> {
	if (!container) return;
	const sort_method = sorter_method.get(player) || 0;
	const sort_dir = sorter_dir.get(player) || 0;

	return sortContainer(container, type, sort_method, sort_dir);
}

//自动整理实体白名单
export const packAnimals = ["llama", "donkey", "mule"];
export const entityWhiteList = ["hopper_minecart", "chest_minecart", "chest_boat", ...packAnimals];

export function getEntityContainerType(entity: Entity): ContaienrTypeData {
	const id = entity.typeId.split(":")[1];
	if (entity.typeId === "minecraft:player") {
		return ContainerTypes.player;
	}
	if (id === "hopper_minecart") {
		return ContainerTypes.hopper;
	}
	if (packAnimals.includes(id)) {
		if (id === "llama") {
			const strengh = entity.getComponent(EntityComponentTypes.Strength)?.value ?? 1;
			return {
				minSlot: 1,
				cols: strengh,
				size: strengh * 3 + 1,
			};
		} else {
			return ContainerTypes.packAnimal;
		}
	}
	return ContainerTypes.common;
}

export function getBlockContainerType(block: Block) {
	const id = block.typeId.split(":")[1];
	if (id === "hopper") {
		return ContainerTypes.hopper;
	}
	return ContainerTypes.common;
}

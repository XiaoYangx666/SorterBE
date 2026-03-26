import {
	Block,
	Container,
	Entity,
	EntityComponentTypes,
	ItemLockMode,
	ItemStack,
	Player,
} from "@minecraft/server";
import { LangText, translator } from "sapi-pro";
import { globalConfig, sorter_dir, sorter_method } from "../config";
import { BundleIds, ShulkerBoxIds } from "../constants";
import { logger } from "../ext";
import { MessageLang } from "../lang";
import { sortDirs, sortMethods } from "./methods";

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
	player: Player
) {
	if (!container) return;
	//获取玩家的整理配置
	const methodIdx = sorter_method.get(player) ?? 0;
	const dirIdx = sorter_dir.get(player) ?? 0;

	const method = sortMethods[methodIdx];
	if (!method) {
		return player.sendMessage("无法获取排序方法");
	}
	//构造物品数组和可用槽位数组
	let itemArray: ItemStack[] = [];
	let availableSlots: boolean[] = new Array(type.size ?? container.size);

	for (let slot = type.minSlot; slot < container.size; slot++) {
		let item = container.getItem(slot);
		availableSlots[slot] = false;
		if (item) {
			//跳过被锁定物品
			if (item.lockMode === ItemLockMode.slot) continue;
			//跳过潜影盒
			if (globalConfig.skipShulkerBox && ShulkerBoxIds.has(item.typeId)) {
				continue;
			}
			//跳过收纳袋
			if (globalConfig.skipBundle && BundleIds.has(item?.typeId)) {
				continue;
			}

			//未跳过，则添加到物品数组
			itemArray.push(item);
		}
		//设置为可用栏位
		availableSlots[slot] = true;
	}

	try {
		//使用对应的排序方法
		const func = await method.func(player);
		itemArray.sort(func);
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
		sortDirs[dirIdx].func(container, result, availableSlots, type);
	} catch (e) {
		if (e instanceof Error) {
			const t = translator.createFor(player);
			player.sendMessage(t("整理错误: ", MessageLang.sortError) + e.message);
		}
		logger.error("整理出错", e);
	}
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

export function mes(
	player: Player,
	text: LangText,
	params?: Record<string, string | number | LangText>
) {
	const t = translator.createPureFor(player);
	player.sendMessage((t(MessageLang.prefix) as string) + t(text, params));
}

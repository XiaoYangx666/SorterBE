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
import { profiler } from "./profiler";

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

export interface SlotInfo {
	slot: number;
	item?: ItemStack;
	amount?: number;
	available: boolean;
}

/**
 * 整理container，返回整理时间
 * @param container 容器
 * @param type 容器类型
 * @param player 目标玩家
 * @returns 整理用时(ms)
 */
export async function sortContainer(
	container: Container | undefined,
	type: ContaienrTypeData = ContainerTypes.common,
	player: Player
) {
	if (!container) return 0;
	const start = Date.now();
	//获取玩家的整理配置
	const methodIdx = sorter_method.get(player) ?? 0;
	const dirIdx = sorter_dir.get(player) ?? 0;

	const method = sortMethods[methodIdx];
	if (!method) {
		player.sendMessage("无法获取排序方法");
		return 0;
	}
	//构造物品数组和可用槽位数组
	const size = type.size ?? container.size;
	const slots: SlotInfo[] = new Array(size);
	const itemArray: ItemStack[] = [];

	for (let i = type.minSlot; i < size; i++) {
		const containerSlot = container.getSlot(i);
		const slot: SlotInfo = {
			slot: i,
			available: false,
		};
		slots[i] = slot;
		if (containerSlot.hasItem()) {
			//跳过潜影盒|收纳袋
			if (
				(globalConfig.skipShulkerBox && ShulkerBoxIds.has(containerSlot.typeId)) ||
				(globalConfig.skipBundle && BundleIds.has(containerSlot.typeId))
			) {
				continue;
			}
			const item = containerSlot.getItem();
			if (!item) continue;
			//跳过被锁定物品
			if (item.lockMode === ItemLockMode.slot) continue;

			//未跳过，则添加到物品数组
			itemArray.push(item);
			slot.item = item;
			slot.amount = item.amount;
		}
		//设置为可用栏位
		slot.available = true;
	}

	try {
		//使用对应的排序方法
		const func = await method.func(player);
		itemArray.sort(func);
		//合并
		let last: ItemStack | undefined;
		const result: ItemStack[] = [];
		for (let i = 0; i < itemArray.length; i++) {
			const item = itemArray[i];
			if (
				last &&
				last.typeId == item.typeId &&
				last.isStackableWith(item) &&
				last.amount < last.maxAmount
			) {
				const total = last.amount + item.amount;
				//可以合并
				if (total <= last.maxAmount) {
					last.amount = total;
				} else {
					item.amount = total - last.maxAmount;
					last.amount = last.maxAmount;
					result.push(item);
					last = item;
				}
			} else {
				result.push(item);
				last = item;
			}
		}

		const finalItem = [];
		//跳过未改变的物品
		for (let i = 0, j = type.minSlot; i < result.length && j < size; j++) {
			if (!slots[j].available) continue;

			const to = result[i];
			const from = slots[j];
			if (
				from?.item?.typeId == to.typeId &&
				from.amount === to.amount &&
				from.item.isStackableWith(to)
			) {
				slots[j].available = false;
			} else {
				finalItem.push(result[i]);
			}
			i++;
		}

		//调用对应的放置方法
		sortDirs[dirIdx].func(container, finalItem, slots, type);
	} catch (e) {
		if (e instanceof Error) {
			const t = translator.createFor(player);
			player.sendMessage(t("整理错误: ", MessageLang.sortError) + e.message);
		}
		logger.error("整理出错", e);
	}
	const end = Date.now();
	profiler.record(player.id, start, end);
	return end - start;
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

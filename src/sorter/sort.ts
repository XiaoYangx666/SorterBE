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
	/**该容器无法使用 ContainerSlot，只能按索引读取（如末影箱） */
	byIndex?: boolean;
}

/**各种容器类型 */
export const ContainerTypes = {
	common: { minSlot: 0, cols: 9 },
	player: { minSlot: 9, cols: 9 },
	hopper: { minSlot: 0, cols: 5 },
	packAnimal: { minSlot: 1, cols: 5 },
	// 末影箱是虚拟容器，BDS 返回的 ContainerSlot 引用全部无效，只能按索引读取
	enderChest: { minSlot: 0, cols: 9, size: 27, byIndex: true },
} as const;
export type ContainerTypes = keyof typeof ContainerTypes;

export interface SlotInfo {
	slot: number;
	item?: ItemStack;
	amount?: number;
	available: boolean;
}

interface SlotReadResult {
	item?: ItemStack;
	/**槽位被跳过（潜影盒|收纳袋），整理时保持不可用 */
	skip?: boolean;
}

function shouldSkipItem(typeId: string) {
	return (
		(globalConfig.skipShulkerBox && ShulkerBoxIds.has(typeId)) ||
		(globalConfig.skipBundle && BundleIds.has(typeId))
	);
}

/**
 * 读取一个容器槽位。
 *
 * 末影箱等虚拟容器返回的 ContainerSlot 引用全部无效，访问 hasItem()/typeId
 * 会抛 InvalidContainerSlotError（"The container slot is either empty or is no longer loaded."），
 * 这类容器（byIndex）直接用 Container.getItem 按索引读取。
 * 其余容器走 ContainerSlot 快路径，跳过潜影盒|收纳袋时不必创建完整物品副本；
 * 引用失效或访问抛错时同样退回按索引读取。
 */
function readSlot(container: Container, index: number, byIndex = false): SlotReadResult {
	if (!byIndex) {
		const containerSlot = container.getSlot(index);
		if (containerSlot.isValid) {
			try {
				if (!containerSlot.hasItem()) return {};
				if (shouldSkipItem(containerSlot.typeId)) return { skip: true };
				const item = containerSlot.getItem();
				return item ? { item } : {};
			} catch {
				//槽位引用不可用，退回按索引读取
			}
		}
	}

	const item = container.getItem(index);
	if (!item) return {};
	if (shouldSkipItem(item.typeId)) return { skip: true };
	return { item };
}

/**
 * 合并相同物品的堆叠。
 *
 * 按处理顺序维护每种 typeId 尚未满堆的候选，新物品会依次填满前面所有兼容的候选，
 * 因此相同物品即使被其他物品隔开也能合并。是否兼容交给原生 isStackableWith 判断，
 * 名称、lore 等数据不同的物品不会合并。返回值保持稳定排序，只是数量更紧凑。
 * @param itemArray 已排序的物品数组（会被就地修改数量）
 * @returns 合并后的物品数组
 */
export function mergeStacks(itemArray: ItemStack[]): ItemStack[] {
	const result: ItemStack[] = [];
	const pending = new Map<string, ItemStack[]>();

	for (const item of itemArray) {
		let remaining = item.amount;
		//不可堆叠物品没有候选，直接放入结果
		const candidates = item.maxAmount > 1 ? pending.get(item.typeId) : undefined;

		if (candidates) {
			//候选池只保留未满堆的物品，填满后立即移除，避免后续反复扫描
			for (let i = 0; i < candidates.length && remaining > 0; ) {
				const target = candidates[i];
				if (!target.isStackableWith(item)) {
					i++;
					continue;
				}

				const moved = Math.min(remaining, target.maxAmount - target.amount);
				target.amount += moved;
				remaining -= moved;
				//填满的候选不会再被合并，直接移出候选池
				if (target.amount >= target.maxAmount) {
					candidates.splice(i, 1);
				} else {
					i++;
				}
			}
		}

		if (remaining === 0) continue;

		item.amount = remaining;
		result.push(item);
		if (remaining < item.maxAmount) {
			if (candidates) {
				candidates.push(item);
			} else {
				pending.set(item.typeId, [item]);
			}
		}
	}

	return result;
}

/**
 * 整理container，返回整理用时
 * @param container 容器
 * @param type 容器类型
 * @param player 目标玩家
 * @returns 整理用时(ms)；未执行或失败时返回 undefined
 */
export async function sortContainer(
	container: Container | undefined,
	type: ContaienrTypeData = ContainerTypes.common,
	player: Player
): Promise<number | undefined> {
	if (!container) return undefined;
	let start = Date.now();
	try {
		// 计分板读取与排序方法校验也可能失败，需要统一异常保护。
		const methodIdx = sorter_method.get(player) ?? 0;
		const dirIdx = sorter_dir.get(player) ?? 0;
		const method = sortMethods[methodIdx];
		if (!method) {
			player.sendMessage("无法获取排序方法");
			return undefined;
		}
		const dir = sortDirs[dirIdx];
		if (!dir) {
			player.sendMessage("无法获取整理方向");
			return undefined;
		}
		// 先完成异步准备（排序表懒加载），再连续读取、排序、合并、写回。
		// 如果在读取容器之后才 await，会中途让出执行权，期间的背包改动会让快照过期，
		// 并发整理时也可能互相覆盖。
		const func = await method.func(player);
		start = Date.now();

		//构造物品数组和可用槽位数组
		const size = type.size ?? container.size;
		const slots: SlotInfo[] = new Array(size);
		const itemArray: ItemStack[] = [];

		// 读取顺序必须与放置顺序一致，否则排序键相同的物品会在每次整理时互换位置
		for (const i of dir.order(type, size)) {
			const slot: SlotInfo = {
				slot: i,
				available: false,
			};
			slots[i] = slot;

			const read = readSlot(container, i, type.byIndex);
			//跳过潜影盒|收纳袋：保持不可用，整理时不会移入或移出
			if (read.skip) continue;
			if (read.item) {
				//跳过被锁定物品
				if (read.item.lockMode === ItemLockMode.slot) continue;

				//未跳过，则添加到物品数组
				itemArray.push(read.item);
				slot.item = read.item;
				slot.amount = read.item.amount;
			}
			//设置为可用栏位
			slot.available = true;
		}

		//使用对应的排序方法
		itemArray.sort(func);
		//合并
		const result = mergeStacks(itemArray);

		//调用对应的放置方法
		dir.func(container, result, slots, type);

		return Date.now() - start;
	} catch (e) {
		try {
			if (e instanceof Error) {
				const t = translator.createFor(player);
				player.sendMessage(t("整理错误: ", MessageLang.sortError) + e.message);
			}
		} catch (msgError) {
			// 玩家已离线等情况下提示可能失败，不能让它变成未处理的异步异常
			logger.error("发送整理错误提示失败", msgError);
		}
		logger.error("整理出错", e);
		return undefined;
	} finally {
		try {
			profiler.record(player.id, start, Date.now());
		} catch (e) {
			logger.error("记录整理性能数据失败", e);
		}
	}
}

//自动整理实体白名单
export const packAnimals = ["llama", "donkey", "mule"];
export const entityWhiteList = ["hopper_minecart", "chest_minecart", "chest_boat", ...packAnimals];

/**获取玩家的末影箱容器 */
export function getEnderChestContainer(player: Player): Container | undefined {
	try {
		return player.getComponent(EntityComponentTypes.EnderInventory)?.container;
	} catch {
		return undefined;
	}
}

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

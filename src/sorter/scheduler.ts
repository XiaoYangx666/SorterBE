import {
	EntityComponentTypes,
	Player,
	PlayerInventoryType,
	type PlayerInventoryItemChangeAfterEvent,
} from "@minecraft/server";
import { intervalBus } from "sapi-pro/Event";
import { getAllPlayers } from "sapi-pro/func";
import { globalConfig, sorter_autoback } from "../config";
import { logger } from "../ext";
import { ContainerTypes, sortContainer } from "./sort";

export class SorterScheduler {
	// 存储下一次整理的时间戳 (ms)
	private readonly nextSortTimeMap: Map<string, number> = new Map();
	// 存储最后一次手动操作的时间戳 (ms)
	private readonly lastActionTimeMap: Map<string, number> = new Map();

	start() {
		intervalBus.subscribesec((_, now) => this.tick(now));
		intervalBus.subscribemin(() => this.cleanOfflinePlayers());
	}

	/**
	 * 清理不再在线的玩家数据，防止 Map 溢出
	 */
	private cleanOfflinePlayers() {
		const onlineIds = new Set(getAllPlayers().map((p) => p.id));

		for (const id of this.nextSortTimeMap.keys()) {
			if (!onlineIds.has(id)) {
				this.nextSortTimeMap.delete(id);
			}
		}
		for (const id of this.lastActionTimeMap.keys()) {
			if (!onlineIds.has(id)) {
				this.lastActionTimeMap.delete(id);
			}
		}
	}

	/**
	 * 核心调度逻辑，每秒执行一次
	 * @param now 当前时间戳(ms)，由调用方传入，不能用计划时间代替
	 */
	private tick(now: number) {
		for (const p of getAllPlayers()) {
			// 检查自动整理开关
			if (!sorter_autoback.get(p)) {
				this.nextSortTimeMap.delete(p.id);
				continue;
			}

			const nextTime = this.nextSortTimeMap.get(p.id);

			// 如果没有预定时间，则初始化一个
			if (nextTime === undefined) {
				this.scheduleNext(p.id, now);
				continue;
			}

			// 到达预定时间，尝试执行整理
			if (now >= nextTime) {
				this.tryRunSort(p, now);
			}
		}
	}

	/**
	 * 尝试执行整理
	 */
	private tryRunSort(player: Player, now: number) {
		const config = globalConfig;

		// A. 指针检查：如果玩家手里正抓着物品，推迟 5 秒
		const cursorItem = player.getComponent(EntityComponentTypes.CursorInventory)?.item;
		if (cursorItem) {
			this.postpone(player.id, now, 5);
			return;
		}

		// B. 冷却检查：距离最后一次手动操作必须超过 cooldown 秒
		const lastAction = this.lastActionTimeMap.get(player.id) ?? 0;
		const cooldownMs = (config.actionCooldown || 5) * 1000;
		if (now - lastAction < cooldownMs) {
			// 冷却结束的时间就是下次整理时间，避免从当前时间再等一个完整冷却
			this.nextSortTimeMap.set(player.id, lastAction + cooldownMs);
			return;
		}

		// C. 执行逻辑
		const container = player.getComponent(EntityComponentTypes.Inventory)?.container;
		if (container) {
			// 固定时间窗口无法识别事件来源，会吞掉玩家刚整理完时的真实操作。
			// 将自身写入也视为背包活动不会引发连续整理，因为调度使用长周期。
			void sortContainer(container, ContainerTypes.player, player).catch((error) => {
				logger.error("自动整理背包发生未处理异常", error);
			});
		}

		// D. 从当前时间规划下一次长周期整理
		// 不能用旧的计划时间，否则卡顿/时间跳跃后会一直处于“已到期”状态而连续整理
		this.scheduleNext(player.id, now);
	}

	/**
	 * 外部接口：玩家背包物品变化事件。
	 * 主背包和快捷栏的变更都视为活动（包括脚本引起的变化），
	 * 以免依赖时间窗口误吞玩家真实操作。
	 */
	public onPlayerInventoryChange(t: PlayerInventoryItemChangeAfterEvent) {
		if (!t.player) return;
		if (
			t.inventoryType !== PlayerInventoryType.Inventory &&
			t.inventoryType !== PlayerInventoryType.Hotbar
		) {
			return;
		}
		this.onPlayerAction(t.player);
	}

	/**
	 * 外部接口：当玩家手动操作背包时调用
	 */
	public onPlayerAction(player: Player) {
		this.lastActionTimeMap.set(player.id, Date.now());
	}

	/** 设置下一次常规整理时间 */
	private scheduleNext(playerId: string, now: number) {
		const interval = globalConfig.interval * 1000 || 60000;
		this.nextSortTimeMap.set(playerId, now + interval);
	}

	/** 推迟下一次整理时间 */
	private postpone(playerId: string, now: number, seconds: number) {
		this.nextSortTimeMap.set(playerId, now + seconds * 1000);
	}
}

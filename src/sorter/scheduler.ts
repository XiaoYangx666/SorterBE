import {
	EntityComponentTypes,
	Player,
	PlayerInventoryType,
	type PlayerInventoryItemChangeAfterEvent,
} from "@minecraft/server";
import { intervalBus } from "sapi-pro/Event";
import { getAllPlayers } from "sapi-pro/func";
import { globalConfig, sorter_autoback } from "../config";
import { ContainerTypes, sortContainer } from "./sort";

export class SorterScheduler {
	/** 自身写入后，这段时间内的背包事件不记为玩家操作（ms） */
	private static readonly SELF_UPDATE_WINDOW_MS = 200;

	// 存储下一次整理的时间戳 (ms)
	private readonly nextSortTimeMap: Map<string, number> = new Map();
	// 存储最后一次手动操作的时间戳 (ms)
	private readonly lastActionTimeMap: Map<string, number> = new Map();
	// 自身写入的保护窗口结束时间 (ms)
	private readonly selfUpdateUntilMap: Map<string, number> = new Map();

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
		for (const id of this.selfUpdateUntilMap.keys()) {
			if (!onlineIds.has(id)) {
				this.selfUpdateUntilMap.delete(id);
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
			// 本次写入会触发背包变更事件，提前告知调度器，避免把自身写入当成玩家操作
			this.onSelfUpdate(player);
			void sortContainer(container, ContainerTypes.player, player).finally(() => {
				// 排序表懒加载可能较慢，写入事件也可能在异步整理返回后才派发，
				// 整理完成时再续一次保护窗口
				this.onSelfUpdate(player);
			});
		}

		// D. 从当前时间规划下一次长周期整理
		// 不能用旧的计划时间，否则卡顿/时间跳跃后会一直处于“已到期”状态而连续整理
		this.scheduleNext(player.id, now);
	}

	/**
	 * 整理自身即将写入背包，忽略随后短时间内的背包变更事件
	 */
	public onSelfUpdate(player: Player) {
		this.selfUpdateUntilMap.set(
			player.id,
			Date.now() + SorterScheduler.SELF_UPDATE_WINDOW_MS
		);
	}

	/**
	 * 外部接口：玩家背包物品变化事件。
	 * 主背包和快捷栏的增删都属于玩家操作；自动整理只写主背包，
	 * 自身写入由 onSelfUpdate 的保护窗口过滤。
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
		const now = Date.now();
		const until = this.selfUpdateUntilMap.get(player.id);
		// 自身写入产生的变更不算玩家操作
		if (until !== undefined && now < until) return;

		this.selfUpdateUntilMap.delete(player.id);
		this.lastActionTimeMap.set(player.id, now);
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

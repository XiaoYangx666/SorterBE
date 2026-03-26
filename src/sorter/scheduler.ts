import { EntityComponentTypes, ItemStack, Player, system, world } from "@minecraft/server";
import { intervalBus } from "sapi-pro/Event";
import { getAllPlayers, getPlayerById } from "sapi-pro/func";
import { globalConfig, sorter_autoback } from "../config";
import { ContainerTypes, sortContainer } from "./sort";

export class SorterScheduler {
	// 存储下一次整理的时间戳 (ms)
	private readonly nextSortTimeMap: Map<string, number> = new Map();
	// 存储最后一次手动操作的时间戳 (ms)
	private readonly lastActionTimeMap: Map<string, number> = new Map();
	// 存储最后一次物品改变
	private readonly lastItemMap: Map<string, { item: string | undefined; tick: number }> =
		new Map();

	constructor() {}

	start() {
		intervalBus.subscribesec((_, cursec) => this.tick(cursec));
		intervalBus.subscribemin(() => this.cleanOfflinePlayers());
	}

	/**
	 * 清理不再在线的玩家数据，防止 Map 溢出
	 */
	private cleanOfflinePlayers() {
		const onlinePlayers = getAllPlayers();
		const onlineIds = new Set(onlinePlayers.map((p) => p.id));

		// 遍历 nextSortTickMap 的所有 Key
		for (const id of this.nextSortTimeMap.keys()) {
			if (!onlineIds.has(id)) {
				this.nextSortTimeMap.delete(id);
				this.lastActionTimeMap.delete(id);
			}
		}

		for (const id of this.lastItemMap.keys()) {
			if (!onlineIds.has(id)) {
				this.lastItemMap.delete(id);
			}
		}

		// 同样检查 lastActionTickMap
		for (const id of this.lastActionTimeMap.keys()) {
			if (!onlineIds.has(id)) {
				this.lastActionTimeMap.delete(id);
			}
		}
	}

	/**
	 * 核心调度逻辑，每秒执行一次
	 */
	private tick(cursec: number) {
		// 遍历在线玩家进行调度
		getAllPlayers().forEach((p) => {
			// 检查自动整理开关
			const autoback = sorter_autoback.get(p);
			if (!autoback) {
				this.nextSortTimeMap.delete(p.id);
				return;
			}

			let nextTime = this.nextSortTimeMap.get(p.id);

			// 如果没有预定时间，则初始化一个
			if (!nextTime) {
				this.scheduleNext(p.id, cursec);
				return;
			}
			// world.sendMessage(`${cursec} ${nextTime} - ${nextTime - cursec}`);

			// 到达预定时间，尝试执行整理
			if (cursec >= nextTime) {
				this.tryRunSort(p, nextTime);
			}
		});
	}

	/**
	 * 尝试执行整理
	 */
	private tryRunSort(player: Player, cursec: number) {
		const config = globalConfig;

		// A. 指针检查：如果玩家手里正抓着物品，推迟 5 秒
		const cursorItem = player.getComponent(EntityComponentTypes.CursorInventory)?.item;
		if (cursorItem) {
			this.postpone(player.id, cursec, 5);
			return;
		}

		// B. 冷却检查：距离最后一次手动操作必须超过 cooldown 秒
		const lastAction = this.lastActionTimeMap.get(player.id) || 0;
		const cooldown = config.actionCooldown || 5;
		// world.sendMessage(`${lastAction} ${cursec} ${cursec - lastAction} ${cooldown * 1000}`);
		if (cursec - lastAction < cooldown * 1000) {
			// 如果还没冷却是不能整理的，继续推迟
			this.postpone(player.id, cursec, cooldown);
			return;
		}

		// C. 执行逻辑
		const container = player.getComponent(EntityComponentTypes.Inventory)?.container;
		if (container) {
			sortContainer(container, ContainerTypes.player, player);
		}
		// player.sendMessage("整理");

		// D. 规划下一次长周期整理
		this.scheduleNext(player.id, cursec);
	}

	/**
	 * 外部接口：当玩家手动操作背包时调用
	 */
	public onPlayerAction(player: Player) {
		// player.sendMessage("操作");
		const cursec = Date.now();
		this.lastActionTimeMap.set(player.id, cursec);
	}

	public onPlayerInvChange(player: Player, before?: ItemStack, item?: ItemStack) {
		if (before == undefined && item == undefined) return;

		const tick = system.currentTick;
		const record = this.lastItemMap.get(player.id);

		if (record?.tick == tick) {
			if (item == undefined && before!.typeId == record.item) {
				this.onPlayerAction(player);
			}
			if (item != undefined && record.item == undefined) {
				this.onPlayerAction(player);
			}
		} else {
			this.lastItemMap.set(player.id, { item: item?.typeId, tick: tick });
		}
	}

	/** 设置下一次常规整理时间 */
	private scheduleNext(playerId: string, cursec: number) {
		const interval = globalConfig.interval * 1000 || 60000;
		this.nextSortTimeMap.set(playerId, cursec + interval);
		// getPlayerById(playerId)?.sendMessage(`next:${cursec + interval}`);
	}

	/** 推迟下一次整理时间 */
	private postpone(playerId: string, cursec: number, seconds: number) {
		this.nextSortTimeMap.set(playerId, cursec + seconds * 1000);
		// getPlayerById(playerId)?.sendMessage(`post:${seconds} ${cursec + seconds}`);
	}
}

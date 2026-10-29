import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import * as actualSort from "../src/sorter/sort";
import { PlayerInventoryType } from "./stubs/minecraft-server";
import { fakePlayer } from "./helpers";

const mocks = {
	players: [] as { id: string }[],
};

mock.module("sapi-pro/func", () => ({
	getAllPlayers: () => mocks.players,
}));

let sortContainer: ReturnType<typeof spyOn>;

const { globalConfig, sorter_autoback } = await import("../src/config");
const { logger } = await import("../src/ext");
const { SorterScheduler } = await import("../src/sorter/scheduler");

type SchedulerInternals = {
	tick(now: number): void;
	nextSortTimeMap: Map<string, number>;
	lastActionTimeMap: Map<string, number>;
};

const internals = (scheduler: SorterScheduler) => scheduler as unknown as SchedulerInternals;
const nextTime = (scheduler: SorterScheduler, id: string) =>
	internals(scheduler).nextSortTimeMap.get(id);
const inventoryChange = (
	player: ReturnType<typeof fakePlayer>,
	inventoryType: string
) =>
	({
		player,
		inventoryType,
		slot: 0,
	}) as never;

function setUpPlayer() {
	const player = fakePlayer();
	sorter_autoback.set(player, 1);
	mocks.players = [player];
	return player;
}

beforeEach(() => {
	sortContainer = spyOn(actualSort, "sortContainer").mockImplementation(async () => 1);
	mocks.players = [];
	Object.assign(globalConfig, {
		skipBundle: false,
		skipShulkerBox: false,
		autoEnderChest: true,
		interval: 60,
		actionCooldown: 10,
		showLoadSuccessMessage: true,
	});
});

afterEach(() => {
	sortContainer.mockRestore();
});

describe("SorterScheduler - 时间基准", () => {
	it("卡顿后不会连续整理，下一次以当前时间为基准", () => {
		const player = setUpPlayer();
		const scheduler = new SorterScheduler();
		const tick = (now: number) => internals(scheduler).tick(now);

		const t0 = 1_000_000;
		tick(t0);
		expect(sortContainer).not.toHaveBeenCalled();
		expect(nextTime(scheduler, player.id)).toBe(t0 + 60_000);

		// 卡顿 10 分钟，计划时间早已过期
		const resumed = t0 + 10 * 60_000;
		tick(resumed);
		expect(sortContainer).toHaveBeenCalledTimes(1);
		expect(nextTime(scheduler, player.id)).toBe(resumed + 60_000);

		// 下一秒不应该再次整理
		tick(resumed + 1_000);
		expect(sortContainer).toHaveBeenCalledTimes(1);
	});

	it("手持物品时从当前时间推迟 5 秒", () => {
		const player = setUpPlayer();
		const scheduler = new SorterScheduler();
		spyOn(player, "getComponent").mockImplementation(((type: string) => {
			if (type === "minecraft:cursor_inventory") return { item: {} };
			return undefined;
		}) as never);

		const now = 2_000_000;
		// 模拟服务器卡顿：计划时间已经落后 3 秒，推迟必须以当前时间为基准
		internals(scheduler).nextSortTimeMap.set(player.id, now - 3_000);
		internals(scheduler).tick(now);

		expect(sortContainer).not.toHaveBeenCalled();
		expect(nextTime(scheduler, player.id)).toBe(now + 5_000);
	});

	it("冷却从最后一次操作起算，不会多等一个完整冷却", () => {
		const player = setUpPlayer();
		const scheduler = new SorterScheduler();

		const now = 3_000_000;
		internals(scheduler).nextSortTimeMap.set(player.id, now);
		internals(scheduler).lastActionTimeMap.set(player.id, now - 5_500);

		internals(scheduler).tick(now);
		expect(sortContainer).not.toHaveBeenCalled();
		// 还剩 4.5 秒冷却，而不是从当前时间再等 10 秒
		expect(nextTime(scheduler, player.id)).toBe(now + 4_500);

		internals(scheduler).tick(now + 4_500);
		expect(sortContainer).toHaveBeenCalledTimes(1);
	});
});

describe("SorterScheduler - 玩家背包事件", () => {
	it("主背包和快捷栏的变更都会重置冷却", () => {
		const player = setUpPlayer();
		const scheduler = new SorterScheduler();
		const now = 5_000_000;
		spyOn(Date, "now").mockReturnValue(now);

		scheduler.onPlayerInventoryChange(inventoryChange(player, PlayerInventoryType.Hotbar));
		expect(internals(scheduler).lastActionTimeMap.get(player.id)).toBe(now);

		spyOn(Date, "now").mockReturnValue(now + 1_000);
		scheduler.onPlayerInventoryChange(inventoryChange(player, PlayerInventoryType.Inventory));
		expect(internals(scheduler).lastActionTimeMap.get(player.id)).toBe(now + 1_000);
	});

	it("非背包类型的变化不重置冷却", () => {
		const player = setUpPlayer();
		const scheduler = new SorterScheduler();
		spyOn(Date, "now").mockReturnValue(5_500_000);

		scheduler.onPlayerInventoryChange(inventoryChange(player, "other"));

		expect(internals(scheduler).lastActionTimeMap.has(player.id)).toBe(false);
	});
});

describe("SorterScheduler - 背包活动与异步异常", () => {
	it("自动整理自身变更不会引发连续重复整理", () => {
		const player = setUpPlayer();
		const scheduler = new SorterScheduler();
		const now = 6_000_000;
		spyOn(Date, "now").mockReturnValue(now);
		sortContainer.mockImplementation(() => {
			// 即使由脚本写入，也视为背包活动；不影响下一轮长周期调度。
			scheduler.onPlayerInventoryChange(
				inventoryChange(player, PlayerInventoryType.Inventory)
			);
			return Promise.resolve(1);
		});

		internals(scheduler).nextSortTimeMap.set(player.id, now);
		internals(scheduler).tick(now);
		expect(sortContainer).toHaveBeenCalledTimes(1);
		expect(internals(scheduler).lastActionTimeMap.get(player.id)).toBe(now);
		expect(nextTime(scheduler, player.id)).toBe(now + 60_000);

		internals(scheduler).tick(now + 1_000);
		expect(sortContainer).toHaveBeenCalledTimes(1);

		// 自身写入只影响冷却，不会阻塞下一轮长周期整理
		internals(scheduler).tick(now + 60_000);
		expect(sortContainer).toHaveBeenCalledTimes(2);
	});

	it("整理刚结束后玩家操作背包，不会被时间窗口吞掉", () => {
		const player = setUpPlayer();
		const scheduler = new SorterScheduler();
		const start = 7_000_000;
		const clock = spyOn(Date, "now").mockReturnValue(start);

		internals(scheduler).nextSortTimeMap.set(player.id, start);
		internals(scheduler).tick(start);
		clock.mockReturnValue(start + 50);
		scheduler.onPlayerInventoryChange(
			inventoryChange(player, PlayerInventoryType.Inventory)
		);
		expect(internals(scheduler).lastActionTimeMap.get(player.id)).toBe(start + 50);
	});

	it("自动整理 Promise 意外拒绝时被捕获并记录", async () => {
		const player = setUpPlayer();
		const scheduler = new SorterScheduler();
		const error = new Error("配置读取失败");
		const log = spyOn(logger, "error").mockImplementation(() => {});
		sortContainer.mockRejectedValueOnce(error);
		const now = 8_000_000;

		internals(scheduler).nextSortTimeMap.set(player.id, now);
		internals(scheduler).tick(now);
		await Promise.resolve();
		await Promise.resolve();
		expect(log).toHaveBeenCalledWith("自动整理背包发生未处理异常", error);
		expect(nextTime(scheduler, player.id)).toBe(now + 60_000);
	});
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerInventoryType } from "./stubs/minecraft-server";

const mocks = vi.hoisted(() => ({
	players: [] as { id: string }[],
	sortContainer: vi.fn(),
}));

vi.mock("sapi-pro/func", () => ({
	getAllPlayers: () => mocks.players,
}));

vi.mock("../src/sorter/sort", () => ({
	ContainerTypes: { player: { minSlot: 9, cols: 9 } },
	sortContainer: mocks.sortContainer,
}));

import { globalConfig, sorter_autoback } from "../src/config";
import { SorterScheduler } from "../src/sorter/scheduler";
import { fakePlayer } from "./helpers";

type SchedulerInternals = {
	tick(now: number): void;
	nextSortTimeMap: Map<string, number>;
	lastActionTimeMap: Map<string, number>;
	selfUpdateUntilMap: Map<string, number>;
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
	mocks.sortContainer.mockReset();
	mocks.sortContainer.mockResolvedValue(1);
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
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe("SorterScheduler - 时间基准", () => {
	it("卡顿后不会连续整理，下一次以当前时间为基准", () => {
		const player = setUpPlayer();
		const scheduler = new SorterScheduler();
		const tick = (now: number) => internals(scheduler).tick(now);

		const t0 = 1_000_000;
		tick(t0);
		expect(mocks.sortContainer).not.toHaveBeenCalled();
		expect(nextTime(scheduler, player.id)).toBe(t0 + 60_000);

		// 卡顿 10 分钟，计划时间早已过期
		const resumed = t0 + 10 * 60_000;
		tick(resumed);
		expect(mocks.sortContainer).toHaveBeenCalledTimes(1);
		expect(nextTime(scheduler, player.id)).toBe(resumed + 60_000);

		// 下一秒不应该再次整理
		tick(resumed + 1_000);
		expect(mocks.sortContainer).toHaveBeenCalledTimes(1);
	});

	it("手持物品时从当前时间推迟 5 秒", () => {
		const player = setUpPlayer();
		const scheduler = new SorterScheduler();
		vi.spyOn(player, "getComponent").mockImplementation(((type: string) => {
			if (type === "minecraft:cursor_inventory") return { item: {} };
			return undefined;
		}) as never);

		const now = 2_000_000;
		// 模拟服务器卡顿：计划时间已经落后 3 秒，推迟必须以当前时间为基准
		internals(scheduler).nextSortTimeMap.set(player.id, now - 3_000);
		internals(scheduler).tick(now);

		expect(mocks.sortContainer).not.toHaveBeenCalled();
		expect(nextTime(scheduler, player.id)).toBe(now + 5_000);
	});

	it("冷却从最后一次操作起算，不会多等一个完整冷却", () => {
		const player = setUpPlayer();
		const scheduler = new SorterScheduler();

		const now = 3_000_000;
		internals(scheduler).nextSortTimeMap.set(player.id, now);
		internals(scheduler).lastActionTimeMap.set(player.id, now - 5_500);

		internals(scheduler).tick(now);
		expect(mocks.sortContainer).not.toHaveBeenCalled();
		// 还剩 4.5 秒冷却，而不是从当前时间再等 10 秒
		expect(nextTime(scheduler, player.id)).toBe(now + 4_500);

		internals(scheduler).tick(now + 4_500);
		expect(mocks.sortContainer).toHaveBeenCalledTimes(1);
	});
});

describe("SorterScheduler - 玩家背包事件", () => {
	it("主背包和快捷栏的变更都会重置冷却", () => {
		const player = setUpPlayer();
		const scheduler = new SorterScheduler();
		const now = 5_000_000;
		vi.spyOn(Date, "now").mockReturnValue(now);

		scheduler.onPlayerInventoryChange(inventoryChange(player, PlayerInventoryType.Hotbar));
		expect(internals(scheduler).lastActionTimeMap.get(player.id)).toBe(now);

		vi.spyOn(Date, "now").mockReturnValue(now + 1_000);
		scheduler.onPlayerInventoryChange(inventoryChange(player, PlayerInventoryType.Inventory));
		expect(internals(scheduler).lastActionTimeMap.get(player.id)).toBe(now + 1_000);
	});

	it("非背包类型的变化不重置冷却", () => {
		const player = setUpPlayer();
		const scheduler = new SorterScheduler();
		vi.spyOn(Date, "now").mockReturnValue(5_500_000);

		scheduler.onPlayerInventoryChange(inventoryChange(player, "other"));

		expect(internals(scheduler).lastActionTimeMap.has(player.id)).toBe(false);
	});
});

describe("SorterScheduler - 自身写入过滤", () => {
	it("整理自身触发的事件不算玩家操作", () => {
		const player = setUpPlayer();
		const scheduler = new SorterScheduler();
		const now = 4_000_000;
		vi.useFakeTimers();
		vi.setSystemTime(now);

		scheduler.onSelfUpdate(player);
		vi.setSystemTime(now + 100);
		scheduler.onPlayerAction(player);
		expect(internals(scheduler).lastActionTimeMap.has(player.id)).toBe(false);

		// 窗口结束后恢复正常
		vi.setSystemTime(now + 1_000);
		scheduler.onPlayerAction(player);
		expect(internals(scheduler).lastActionTimeMap.get(player.id)).toBe(now + 1_000);
	});

	it("自动整理写入不会重置冷却", () => {
		const player = setUpPlayer();
		const scheduler = new SorterScheduler();
		const now = 6_000_000;
		vi.spyOn(Date, "now").mockReturnValue(now);

		mocks.sortContainer.mockImplementation(() => {
			// 模拟 setItem 触发的背包变更事件
			scheduler.onPlayerInventoryChange(
				inventoryChange(player, PlayerInventoryType.Inventory)
			);
			return Promise.resolve(1);
		});

		internals(scheduler).nextSortTimeMap.set(player.id, now);
		internals(scheduler).tick(now);

		expect(mocks.sortContainer).toHaveBeenCalledTimes(1);
		expect(internals(scheduler).lastActionTimeMap.has(player.id)).toBe(false);
		expect(nextTime(scheduler, player.id)).toBe(now + 60_000);
	});

	it("异步准备较慢时，整理完成后的写入事件仍被过滤", async () => {
		const player = setUpPlayer();
		const scheduler = new SorterScheduler();
		const start = 7_000_000;
		const nowSpy = vi.spyOn(Date, "now").mockReturnValue(start);

		let resolveSort!: () => void;
		mocks.sortContainer.mockImplementation(
			() =>
				new Promise<number>((resolve) => {
					resolveSort = () => resolve(1);
				})
		);

		internals(scheduler).nextSortTimeMap.set(player.id, start);
		internals(scheduler).tick(start);
		expect(mocks.sortContainer).toHaveBeenCalledTimes(1);

		// 模拟排序表懒加载超过自身写入保护窗口
		nowSpy.mockReturnValue(start + 1_000);
		resolveSort();
		// 等待 sortContainer 的 finally 回调执行
		await new Promise((resolve) => setTimeout(resolve, 0));

		scheduler.onPlayerInventoryChange(
			inventoryChange(player, PlayerInventoryType.Inventory)
		);
		expect(internals(scheduler).lastActionTimeMap.has(player.id)).toBe(false);
	});
});

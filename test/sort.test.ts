import { beforeEach, describe, expect, it, vi } from "vitest";
import { globalConfig, sorter_dir, sorter_method, sorter_ordertable } from "../src/config";
import { sortMethods } from "../src/sorter/methods";
import { profiler } from "../src/sorter/profiler";
import { ContainerTypes, sortContainer } from "../src/sorter/sort";
import { sortCmdHandler } from "../src/sorter/sortCommand";
import { ids as defaultTable } from "../src/tables/default";
import { FakeContainer, fakePlayer, item, locked } from "./helpers";

type Player = ReturnType<typeof fakePlayer>;

function setSortMode(player: Player, method: number, dir = 0, table = 0) {
	sorter_method.set(player as never, method);
	sorter_dir.set(player as never, dir);
	sorter_ordertable.set(player as never, table);
}

async function sort(container: FakeContainer, type: keyof typeof ContainerTypes, player: Player) {
	return sortContainer(
		container as never,
		ContainerTypes[type],
		player as never
	);
}

beforeEach(() => {
	Object.assign(globalConfig, {
		skipBundle: false,
		skipShulkerBox: false,
		autoEnderChest: true,
		interval: 60,
		actionCooldown: 10,
		showLoadSuccessMessage: true,
	});
});

describe("sortContainer - 按名称排序", () => {
	it("排序并合并同类堆叠", async () => {
		const player = fakePlayer();
		setSortMode(player, 1);
		const container = new FakeContainer(9, [
			item("minecraft:stone", 10),
			undefined,
			item("minecraft:dirt", 3),
			undefined,
			undefined,
			item("minecraft:stone", 5),
		]);

		await sort(container, "common", player);

		expect(container.snapshot()).toEqual([
			"minecraft:dirt x3",
			"minecraft:stone x15",
			null,
			null,
			null,
			null,
			null,
			null,
			null,
		]);
	});

	it("超过最大堆叠时拆分到下一格", async () => {
		const player = fakePlayer();
		setSortMode(player, 1);
		const container = new FakeContainer(9, [
			item("minecraft:stone", 60),
			item("minecraft:stone", 60),
		]);

		await sort(container, "common", player);

		expect(container.snapshot().slice(0, 3)).toEqual([
			"minecraft:stone x64",
			"minecraft:stone x56",
			null,
		]);
	});

	it("不同 nameTag 不合并", async () => {
		const player = fakePlayer();
		setSortMode(player, 1);
		const container = new FakeContainer(9, [
			item("minecraft:stone", 5, { nameTag: "A" }),
			item("minecraft:stone", 5, { nameTag: "B" }),
		]);

		await sort(container, "common", player);

		expect(container.snapshot().slice(0, 2)).toEqual([
			"minecraft:stone x5",
			"minecraft:stone x5",
		]);
	});

	it("按排序表顺序整理", async () => {
		const player = fakePlayer();
		setSortMode(player, 0, 0, 0);
		const container = new FakeContainer(9, [
			item("minecraft:bucket"),
			item("minecraft:stone"),
		]);

		await sort(container, "common", player);

		const stoneFirst = defaultTable.indexOf("stone") < defaultTable.indexOf("bucket");
		expect(container.snapshot().slice(0, 2)).toEqual(
			stoneFirst
				? ["minecraft:stone x1", "minecraft:bucket x1"]
				: ["minecraft:bucket x1", "minecraft:stone x1"]
		);
	});
});

describe("sortContainer - 槽位规则", () => {
	it("锁定槽位的物品原地不动", async () => {
		const player = fakePlayer();
		setSortMode(player, 1);
		const container = new FakeContainer(9, [
			locked("minecraft:stone", 10),
			undefined,
			undefined,
			item("minecraft:dirt", 5),
		]);

		await sort(container, "common", player);

		expect(container.snapshot().slice(0, 4)).toEqual([
			"minecraft:stone x10",
			"minecraft:dirt x5",
			null,
			null,
		]);
	});

	it("背包模式不整理前 9 格（快捷栏/装备）", async () => {
		const player = fakePlayer();
		setSortMode(player, 1);
		const items = Array.from({ length: 36 }, () => undefined as ReturnType<typeof item> | undefined);
		items[0] = item("minecraft:apple", 1);
		items[10] = item("minecraft:stone", 5);
		items[12] = item("minecraft:dirt", 2);
		const container = new FakeContainer(36, items);

		await sort(container, "player", player);

		const snapshot = container.snapshot();
		expect(snapshot[0]).toBe("minecraft:apple x1");
		expect(snapshot.slice(9, 12)).toEqual([
			"minecraft:dirt x2",
			"minecraft:stone x5",
			null,
		]);
	});

	it("N 方向按列填充", async () => {
		const player = fakePlayer();
		setSortMode(player, 1, 1);
		const container = new FakeContainer(18, [
			item("minecraft:stone", 1),
			item("minecraft:dirt", 1),
		]);

		await sort(container, "common", player);

		const snapshot = container.snapshot();
		expect(snapshot[0]).toBe("minecraft:dirt x1");
		expect(snapshot[9]).toBe("minecraft:stone x1");
		expect(snapshot[1]).toBeNull();
		expect(snapshot[10]).toBeNull();
	});

	it("末影箱固定 27 格", async () => {
		const player = fakePlayer();
		setSortMode(player, 1);
		const container = new FakeContainer(27, [
			item("minecraft:stone", 1),
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			item("minecraft:dirt", 1),
		]);

		await sort(container, "enderChest", player);

		const snapshot = container.snapshot();
		expect(snapshot[0]).toBe("minecraft:dirt x1");
		expect(snapshot[1]).toBe("minecraft:stone x1");
		expect(snapshot[26]).toBeNull();
	});
});

describe("sortContainer - 全局配置", () => {
	it("开启跳过后潜影盒不参与整理", async () => {
		globalConfig.skipShulkerBox = true;
		const player = fakePlayer();
		setSortMode(player, 1);
		const container = new FakeContainer(9, [
			item("minecraft:white_shulker_box", 1),
			item("minecraft:stone", 5),
		]);

		await sort(container, "common", player);

		expect(container.snapshot().slice(0, 2)).toEqual([
			"minecraft:white_shulker_box x1",
			"minecraft:stone x5",
		]);
	});

	it("关闭跳过后潜影盒正常参与排序", async () => {
		globalConfig.skipShulkerBox = false;
		const player = fakePlayer();
		setSortMode(player, 1);
		const container = new FakeContainer(9, [
			item("minecraft:white_shulker_box", 1),
			item("minecraft:stone", 5),
		]);

		await sort(container, "common", player);

		expect(container.snapshot().slice(0, 2)).toEqual([
			"minecraft:stone x5",
			"minecraft:white_shulker_box x1",
		]);
	});

	it("跳过的收纳袋保持原位", async () => {
		globalConfig.skipBundle = true;
		const player = fakePlayer();
		setSortMode(player, 1);
		const container = new FakeContainer(9, [
			item("minecraft:bundle", 1),
			undefined,
			item("minecraft:dirt", 1),
		]);

		await sort(container, "common", player);

		expect(container.snapshot()[0]).toBe("minecraft:bundle x1");
		expect(container.snapshot()[1]).toBe("minecraft:dirt x1");
	});

	it("跳过潜影盒/收纳袋时不创建完整物品副本", async () => {
		globalConfig.skipShulkerBox = true;
		globalConfig.skipBundle = true;
		const player = fakePlayer();
		setSortMode(player, 1);
		const container = new FakeContainer(9, [
			item("minecraft:white_shulker_box", 1),
			item("minecraft:bundle", 1),
			item("minecraft:stone", 5),
		]);

		await sort(container, "common", player);

		// 跳过的格子只读了 typeId，不能调用 getItem()
		expect(container.reads[0]).toBe(0);
		expect(container.reads[1]).toBe(0);
		expect(container.reads[2]).toBeGreaterThan(0);
	});
});

describe("sortContainer - 写入优化与双写", () => {
	it("未变化槽位不写入，不可堆叠物品也不会被重写", async () => {
		const player = fakePlayer();
		setSortMode(player, 1);
		const container = new FakeContainer(9, [
			item("minecraft:stone", 5),
			item("minecraft:dirt", 1),
			item("minecraft:diamond_sword", 1, { maxAmount: 1 }),
		]);

		await sort(container, "common", player);
		expect(container.writes).toBeGreaterThan(0);

		const writes = container.writes;
		await sort(container, "common", player);
		expect(container.writes).toBe(writes);
	});

	it("移动物品保持清空+写入的双写顺序", async () => {
		const player = fakePlayer();
		setSortMode(player, 1);
		const container = new FakeContainer(2, [
			item("minecraft:stone", 1),
			item("minecraft:dirt", 1),
		]);

		await sort(container, "common", player);

		// 名称排序：dirt < stone，两格都移动，每格先清空再写入
		expect(container.writeLog).toEqual([
			[0, null],
			[0, "minecraft:dirt"],
			[1, null],
			[1, "minecraft:stone"],
		]);
	});

	it("不可堆叠物品需要移动时仍然会移动", async () => {
		const player = fakePlayer();
		setSortMode(player, 1);
		const container = new FakeContainer(2, [
			item("minecraft:dirt", 1),
			item("minecraft:diamond_sword", 1, { maxAmount: 1 }),
		]);

		await sort(container, "common", player);

		expect(container.snapshot()).toEqual([
			"minecraft:diamond_sword x1",
			"minecraft:dirt x1",
		]);
	});
});

describe("sortContainer - 异常处理", () => {
	it("读取异常时不抛出，返回 undefined 并提示错误", async () => {
		const player = fakePlayer();
		setSortMode(player, 1);
		const container = new FakeContainer(9, [item("minecraft:stone", 1)]);
		vi.spyOn(container, "getSlot").mockImplementation(() => {
			throw new Error("InvalidContainerError");
		});

		await expect(sort(container, "common", player)).resolves.toBeUndefined();
		expect(player.sendMessage).toHaveBeenCalledTimes(1);
	});

	it("写入异常时返回 undefined 并提示错误", async () => {
		const player = fakePlayer();
		setSortMode(player, 1);
		const container = new FakeContainer(2, [
			item("minecraft:stone", 1),
			item("minecraft:dirt", 1),
		]);
		vi.spyOn(container, "setItem").mockImplementation(() => {
			throw new Error("写入失败");
		});

		await expect(sort(container, "common", player)).resolves.toBeUndefined();
		expect(player.sendMessage).toHaveBeenCalledTimes(1);
	});

	it("错误提示发送失败时也不会抛出", async () => {
		const player = fakePlayer();
		setSortMode(player, 1);
		const container = new FakeContainer(9, [item("minecraft:stone", 1)]);
		vi.spyOn(container, "getSlot").mockImplementation(() => {
			throw new Error("InvalidContainerError");
		});
		vi.spyOn(player, "sendMessage").mockImplementation(() => {
			throw new Error("玩家已离线");
		});

		await expect(sort(container, "common", player)).resolves.toBeUndefined();
	});

	it("写入异常时返回 undefined，不提示整理成功", async () => {
		const player = fakePlayer();
		setSortMode(player, 1);
		// 背包里放两个顺序相反的东西，保证会触发写入
		player.inventory.items[9] = item("minecraft:stone", 1);
		player.inventory.items[10] = item("minecraft:dirt", 1);
		vi.spyOn(player.inventory, "setItem").mockImplementation(() => {
			throw new Error("写入失败");
		});

		sortCmdHandler(player as never);
		await new Promise((resolve) => setTimeout(resolve, 20));

		// sortContainer 自己发一条错误提示；没有额外的“整理成功”
		expect(player.sendMessage).toHaveBeenCalledTimes(1);
	});
});

describe("sortContainer - 异步准备与并发", () => {
	it("排序表加载完成后才读取容器，避免使用过期快照", async () => {
		const player = fakePlayer();
		setSortMode(player, 0);
		const original = sortMethods[0].func;
		let release!: () => void;
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		sortMethods[0].func = async () => {
			await gate;
			return (a, b) => a.typeId.localeCompare(b.typeId);
		};

		try {
			const container = new FakeContainer(9, [
				item("minecraft:stone", 1),
				item("minecraft:dirt", 1),
			]);
			const pending = sort(container, "common", player);

			// 模拟懒加载期间玩家把第一格换成了钻石
			container.setItem(0, item("minecraft:diamond", 1));
			release();
			await pending;

			// 旧实现会在 await 前读取快照，随后把 dirt/stone 写回去，覆盖钻石
			expect(container.snapshot().slice(0, 2)).toEqual([
				"minecraft:diamond x1",
				"minecraft:dirt x1",
			]);
		} finally {
			sortMethods[0].func = original;
		}
	});

	it("并发整理按完成顺序读取，不会用旧快照覆盖新数据", async () => {
		const player = fakePlayer();
		setSortMode(player, 1);
		const container = new FakeContainer(9, [
			item("minecraft:stone", 1),
			item("minecraft:dirt", 1),
		]);

		await Promise.all([
			sort(container, "common", player),
			sort(container, "common", player),
		]);

		expect(container.snapshot().slice(0, 2)).toEqual([
			"minecraft:dirt x1",
			"minecraft:stone x1",
		]);
	});
});

describe("sortContainer - 未变化槽位识别", () => {
	it("不可堆叠物品已在正确位置时不重写", async () => {
		const player = fakePlayer();
		setSortMode(player, 1);
		const container = new FakeContainer(3, [
			item("minecraft:diamond_sword", 1, { maxAmount: 1 }),
			item("minecraft:dirt", 1),
		]);

		await sort(container, "common", player);

		expect(container.writes).toBe(0);
	});

	it("空槽位不产生写入", async () => {
		const player = fakePlayer();
		setSortMode(player, 1);
		const container = new FakeContainer(9, [item("minecraft:stone", 1)]);

		await sort(container, "common", player);

		expect(container.writes).toBe(0);
	});

	it("合并时保留名称与 lore，不同数据不合并", async () => {
		const player = fakePlayer();
		setSortMode(player, 1);
		const container = new FakeContainer(9, [
			item("minecraft:stone", 3, { nameTag: "A", lore: ["l1"] }),
			item("minecraft:stone", 2, { nameTag: "A", lore: ["l1"] }),
			item("minecraft:stone", 1, { nameTag: "B", lore: ["l1"] }),
		]);

		await sort(container, "common", player);

		expect(container.items[0]?.amount).toBe(5);
		expect(container.items[0]?.nameTag).toBe("A");
		expect(container.items[0]?.lore).toEqual(["l1"]);
		expect(container.items[1]?.amount).toBe(1);
		expect(container.items[1]?.nameTag).toBe("B");
	});

	it("数量变化的槽位仍会双写更新", async () => {
		const player = fakePlayer();
		setSortMode(player, 1);
		const container = new FakeContainer(2, [
			item("minecraft:stone", 10),
			item("minecraft:stone", 5),
		]);

		await sort(container, "common", player);

		expect(container.snapshot().slice(0, 2)).toEqual([
			"minecraft:stone x15",
			null,
		]);
		expect(container.writeLog).toEqual([
			[0, null],
			[0, "minecraft:stone"],
			[1, null],
		]);
	});
});

describe("sortContainer - 配置读取异常", () => {
	it("读取排序配置失败时返回 undefined，而非 rejected Promise", async () => {
		const player = fakePlayer();
		const container = new FakeContainer(9, [item("minecraft:stone", 1)]);
		const read = vi.spyOn(sorter_method, "get").mockImplementationOnce(() => {
			throw new Error("计分板不可用");
		});
		try {
			await expect(sort(container, "common", player)).resolves.toBeUndefined();
			expect(player.sendMessage).toHaveBeenCalledTimes(1);
			expect(container.writes).toBe(0);
		} finally {
			read.mockRestore();
		}
	});

	it("性能记录失败不影响整理结果", async () => {
		const player = fakePlayer();
		setSortMode(player, 1);
		const container = new FakeContainer(9, [item("minecraft:stone", 1)]);
		const record = vi.spyOn(profiler, "record").mockImplementation(() => {
			throw new Error("记录失败");
		});
		try {
			await expect(sort(container, "common", player)).resolves.toBeTypeOf("number");
		} finally {
			record.mockRestore();
		}
	});
});

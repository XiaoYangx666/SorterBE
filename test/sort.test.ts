import { beforeEach, describe, expect, it } from "vitest";
import { globalConfig, sorter_dir, sorter_method, sorter_ordertable } from "../src/config";
import { ContainerTypes, sortContainer } from "../src/sorter/sort";
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
});

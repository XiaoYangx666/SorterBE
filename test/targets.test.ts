import { beforeEach, describe, expect, it } from "bun:test";
import { sorter_dir, sorter_method } from "../src/config";
import { MessageLang } from "../src/lang";
import {
	ContainerTypes,
	getBlockContainerType,
	getEnderChestContainer,
	getEntityContainerType,
} from "../src/sorter/sort";
import { getSortTarget } from "../src/sorter/sortCommand";
import { fakePlayer } from "./helpers";

type Player = ReturnType<typeof fakePlayer>;

beforeEach(() => {
	sorter_method.set("p1", 1);
	sorter_dir.set("p1", 0);
});

describe("容器类型判定", () => {
	it("玩家背包", () => {
		expect(getEntityContainerType({ typeId: "minecraft:player" } as never)).toEqual(
			ContainerTypes.player
		);
	});

	it("漏斗矿车", () => {
		expect(getEntityContainerType({ typeId: "minecraft:hopper_minecart" } as never)).toEqual(
			ContainerTypes.hopper
		);
	});

	it("驴/骡/羊驼按驮运动物处理", () => {
		const donkey = {
			typeId: "minecraft:donkey",
			getComponent: () => undefined,
		};
		expect(getEntityContainerType(donkey as never)).toEqual(ContainerTypes.packAnimal);
	});

	it("羊驼按力量值计算容量", () => {
		const llama = {
			typeId: "minecraft:llama",
			getComponent: () => ({ value: 3 }),
		};
		expect(getEntityContainerType(llama as never)).toEqual({ minSlot: 1, cols: 3, size: 10 });
	});

	it("漏斗方块用 5 列布局", () => {
		expect(getBlockContainerType({ typeId: "minecraft:hopper" } as never)).toEqual(
			ContainerTypes.hopper
		);
		expect(getBlockContainerType({ typeId: "minecraft:chest" } as never)).toEqual(
			ContainerTypes.common
		);
	});
});

describe("末影箱容器", () => {
	it("从玩家组件读取末影箱", () => {
		const player = fakePlayer();
		expect(getEnderChestContainer(player as never)).toBe(player.enderChest);
	});

	it("组件缺失或抛错时返回 undefined", () => {
		expect(getEnderChestContainer({ getComponent: () => undefined } as never)).toBeUndefined();
		const throwing = {
			getComponent: () => {
				throw new Error("InvalidEntityError");
			},
		};
		expect(getEnderChestContainer(throwing as never)).toBeUndefined();
	});

	it("对准末影箱时整理目标为末影箱而非背包", () => {
		const player = fakePlayer();
		player.getBlockFromViewDirection = () =>
			({
				block: { typeId: "minecraft:ender_chest", location: { x: 0, y: 0, z: 3 } },
			}) as never;

		const target = getSortTarget(player as unknown as Player as never);

		expect(target?.container).toBe(player.enderChest);
		expect(target?.type).toEqual(ContainerTypes.enderChest);
		expect(target?.name).toBe(MessageLang.enderChest);
	});
});

describe("整理目标回退", () => {
	it("没有容器时退回玩家背包", () => {
		const player = fakePlayer();
		const target = getSortTarget(player as never);

		expect(target?.container).toBe(player.inventory);
		expect(target?.dis).toBe(-1);
		expect(target?.type).toEqual(ContainerTypes.player);
		expect(target?.name).toBeUndefined();
	});

	it("对准普通容器时使用方块容器", () => {
		const player = fakePlayer();
		const chest = { size: 27, getSlot: () => ({ hasItem: () => false }), setItem: () => {} };
		player.getBlockFromViewDirection = () =>
			({
				block: {
					typeId: "minecraft:chest",
					location: { x: 0, y: 0, z: 2 },
					getComponent: () => ({ container: chest }),
				},
			}) as never;

		const target = getSortTarget(player as never);

		expect(target?.container).toBe(chest);
		expect(target?.type).toEqual(ContainerTypes.common);
		expect(target?.name).toBeUndefined();
	});

	it("熔炉不作为整理目标", () => {
		const player = fakePlayer();
		player.getBlockFromViewDirection = () =>
			({
				block: {
					typeId: "minecraft:furnace",
					location: { x: 0, y: 0, z: 1 },
					getComponent: () => ({ container: { size: 3 } }),
				},
			}) as never;

		// 熔炉被跳过，退回背包
		expect(getSortTarget(player as never)?.container).toBe(player.inventory);
	});
});

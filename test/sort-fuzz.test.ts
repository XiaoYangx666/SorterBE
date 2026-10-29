import { beforeEach, describe, expect, it, spyOn } from "bun:test";
import { globalConfig, sorter_dir, sorter_method, sorter_ordertable } from "../src/config";
import { ContaienrTypeData, ContainerTypes, sortContainer } from "../src/sorter/sort";
import { FakeContainer, fakePlayer, item } from "./helpers";

type Player = ReturnType<typeof fakePlayer>;
type Stack = ReturnType<typeof item>;

/** 可复现的伪随机数（mulberry32） */
function rng(seed: number) {
	let state = seed;
	return () => {
		state |= 0;
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

interface ContainerSpec {
	name: string;
	type: ContaienrTypeData;
	size: number;
}

/** 全部真实容器尺寸；尺寸必须能被列数整除，否则 N 方向无法覆盖全部槽位 */
const containers: ContainerSpec[] = [
	{ name: "common9", type: ContainerTypes.common, size: 9 },
	{ name: "common27", type: ContainerTypes.common, size: 27 },
	{ name: "common54", type: ContainerTypes.common, size: 54 },
	{ name: "hopper", type: ContainerTypes.hopper, size: 5 },
	{ name: "player", type: ContainerTypes.player, size: 36 },
	{ name: "enderChest", type: ContainerTypes.enderChest, size: 27 },
	{ name: "donkey", type: ContainerTypes.packAnimal, size: 16 },
	{ name: "llama1", type: { minSlot: 1, cols: 1, size: 4 }, size: 4 },
	{ name: "llama2", type: { minSlot: 1, cols: 2, size: 7 }, size: 7 },
	{ name: "llama3", type: { minSlot: 1, cols: 3, size: 10 }, size: 10 },
	{ name: "llama4", type: { minSlot: 1, cols: 4, size: 13 }, size: 13 },
	{ name: "llama5", type: { minSlot: 1, cols: 5, size: 16 }, size: 16 },
];

const potionEffects = [
	"minecraft:swiftness",
	"minecraft:strong_swiftness",
	"minecraft:long_swiftness",
	"minecraft:healing",
];

const pool = [
	{ typeId: "minecraft:stone", maxAmount: 64 },
	{ typeId: "minecraft:dirt", maxAmount: 64 },
	{ typeId: "minecraft:apple", maxAmount: 64 },
	{ typeId: "minecraft:egg", maxAmount: 16 },
	{ typeId: "minecraft:diamond_sword", maxAmount: 1 },
	{ typeId: "minecraft:white_shulker_box", maxAmount: 1 },
	{ typeId: "minecraft:bundle", maxAmount: 1 },
	{ typeId: "minecraft:potion", maxAmount: 1 },
	// 排序表里不存在的自定义物品，走 3000 兜底
	{ typeId: "custom:artifact", maxAmount: 64 },
];

/** 数量分布：覆盖正好满堆、上限-1、1 和随机值 */
function randomAmount(rand: () => number, maxAmount: number) {
	const r = rand();
	if (maxAmount <= 1) return 1;
	if (r < 0.3) return maxAmount;
	if (r < 0.5) return maxAmount - 1;
	if (r < 0.7) return 1;
	return 1 + Math.floor(rand() * maxAmount);
}

function randomItem(rand: () => number): Stack {
	const ri = (n: number) => Math.floor(rand() * n);
	const base = pool[ri(pool.length)];
	const components: Record<string, unknown> = {};
	if (base.typeId === "minecraft:potion") {
		components["minecraft:potion"] = {
			potionEffectType: {
				id: potionEffects[ri(potionEffects.length)],
				durationTicks: ri(3) * 200,
			},
			potionDeliveryType: { id: rand() < 0.5 ? "drink" : "splash" },
		};
	}
	return item(base.typeId, randomAmount(rand, base.maxAmount), {
		maxAmount: base.maxAmount,
		nameTag: rand() < 0.25 ? `name${ri(3)}` : undefined,
		lore: rand() < 0.2 ? [`lore${ri(2)}`] : undefined,
		lockMode: rand() < 0.1 ? "slot" : undefined,
		components,
	});
}

interface Scenario {
	name: string;
	fill: (rand: () => number, size: number) => (Stack | undefined)[];
}

function emptyItems(size: number) {
	return Array.from({ length: size }, () => undefined as Stack | undefined);
}

const scenarios: Scenario[] = [
	{ name: "empty", fill: (_, size) => emptyItems(size) },
	{
		name: "single",
		fill: (rand, size) => {
			const items = emptyItems(size);
			items[Math.floor(rand() * size)] = randomItem(rand);
			return items;
		},
	},
	{
		name: "full",
		fill: (rand, size) => Array.from({ length: size }, () => randomItem(rand)),
	},
	{
		name: "oneFree",
		fill: (rand, size) => {
			const free = Math.floor(rand() * size);
			return Array.from({ length: size }, (_, i) => (i === free ? undefined : randomItem(rand)));
		},
	},
	{
		name: "half",
		fill: (rand, size) =>
			Array.from({ length: size }, () => (rand() < 0.5 ? randomItem(rand) : undefined)),
	},
	{
		name: "partials",
		fill: (rand, size) => {
			// 少量物品种类 + 大量半堆，制造跨位置合并
			const kinds = Array.from({ length: 1 + Math.floor(rand() * 3) }, () => randomItem(rand));
			return Array.from({ length: size }, () => {
				if (rand() < 0.25) return undefined;
				const base = kinds[Math.floor(rand() * kinds.length)];
				const copy = item(base.typeId, randomAmount(rand, base.maxAmount), {
					maxAmount: base.maxAmount,
					nameTag: base.nameTag,
					lore: base.lore,
					components: base.components,
				});
				return copy;
			});
		},
	},
	{
		name: "allLocked",
		fill: (rand, size) =>
			Array.from({ length: size }, () =>
				rand() < 0.6 ? item("minecraft:stone", randomAmount(rand, 64), { lockMode: "slot" }) : undefined
			),
	},
	{
		name: "allSkippable",
		fill: (rand, size) =>
			Array.from({ length: size }, () => {
				if (rand() >= 0.6) return undefined;
				return rand() < 0.5
					? item("minecraft:white_shulker_box", 1, { maxAmount: 1 })
					: item("minecraft:bundle", 1, { maxAmount: 1 });
			}),
	},
];

interface ConfigSpec {
	method: number;
	dir: number;
	skipShulkerBox: boolean;
	skipBundle: boolean;
	table: number;
}

/** 配置矩阵固定跑满：2 方法 × 2 方向 × 4 种跳过组合 × 2 张排序表 */
const configs: ConfigSpec[] = [];
for (const method of [0, 1]) {
	for (const dir of [0, 1]) {
		for (const skipShulkerBox of [false, true]) {
			for (const skipBundle of [false, true]) {
				for (const table of [0, 1]) {
					configs.push({ method, dir, skipShulkerBox, skipBundle, table });
				}
			}
		}
	}
}

/** 槽位内容签名：类型、数量、堆叠上限、名称、lore、锁定状态 */
function signature(stack: Stack | undefined) {
	if (!stack) return null;
	return JSON.stringify([
		stack.typeId,
		stack.amount,
		stack.maxAmount,
		stack.nameTag ?? null,
		stack.lore,
		stack.lockMode,
	]);
}

function contents(container: FakeContainer) {
	return container.items.map(signature);
}

/** 按物品数据分组统计总数量：合并会改变堆叠拆分，但总量必须守恒 */
function totals(container: FakeContainer) {
	const map = new Map<string, number>();
	for (const stack of container.items) {
		if (!stack) continue;
		const key = JSON.stringify([
			stack.typeId,
			stack.maxAmount,
			stack.nameTag ?? null,
			stack.lore,
			stack.lockMode,
		]);
		map.set(key, (map.get(key) ?? 0) + stack.amount);
	}
	return [...map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
}

function describeCase(info: string) {
	return info;
}

function assertEqual(actual: unknown, expected: unknown, info: string) {
	if (JSON.stringify(actual) !== JSON.stringify(expected)) {
		throw new Error(
			`${info}\n实际: ${JSON.stringify(actual)}\n预期: ${JSON.stringify(expected)}`
		);
	}
}

function setupPlayer(config: ConfigSpec) {
	const player = fakePlayer();
	sorter_method.set(player as never, config.method);
	sorter_dir.set(player as never, config.dir);
	sorter_ordertable.set(player as never, config.table);
	return player;
}

describe("sortContainer - 场景化随机不变量", () => {
	beforeEach(() => {
		Object.assign(globalConfig, {
			skipBundle: false,
			skipShulkerBox: false,
			autoEnderChest: false,
			interval: 60,
			actionCooldown: 10,
			showLoadSuccessMessage: true,
		});
	});

	it("所有容器 × 场景 × 配置组合满足不变量", async () => {
		let caseNo = 0;

		for (const spec of containers) {
			for (const scenario of scenarios) {
				for (const config of configs) {
					const seed = 100000 + caseNo++;
					const rand = rng(seed);
					globalConfig.skipShulkerBox = config.skipShulkerBox;
					globalConfig.skipBundle = config.skipBundle;

					const player = setupPlayer(config);
					const container = new FakeContainer(spec.size, scenario.fill(rand, spec.size));
					const info = describeCase(
						`seed=${seed} container=${spec.name} scenario=${scenario.name} ` +
							`method=${config.method} dir=${config.dir} table=${config.table} ` +
							`skipShulker=${config.skipShulkerBox} skipBundle=${config.skipBundle}`
					);

					const before = contents(container);
					const beforeTotals = totals(container);

					// 整理前记录不应被移动的槽位：minSlot 之前、锁定物品、被跳过的潜影盒/收纳袋
					const protectedSlots: number[] = [];
					for (let i = 0; i < spec.size; i++) {
						const stack = container.items[i];
						const isSkipped =
							(config.skipShulkerBox && stack?.typeId === "minecraft:white_shulker_box") ||
							(config.skipBundle && stack?.typeId === "minecraft:bundle");
						if (i < spec.type.minSlot || stack?.lockMode === "slot" || isSkipped) {
							protectedSlots.push(i);
						}
					}

					const time = await sortContainer(
						container as never,
						spec.type as never,
						player as never
					);
					assertEqual(typeof time, "number", `${info} 整理应成功`);

					const after = contents(container);

					// 1. 物品总量守恒
					assertEqual(totals(container), beforeTotals, `${info} 物品总量发生变化`);

					// 2. 锁定格、被跳过格、minSlot 之前的槽位不动
					for (const i of protectedSlots) {
						assertEqual(after[i], before[i], `${info} 第 ${i} 格不应被移动`);
					}

					// 3. 每格数量不超过堆叠上限
					for (let i = 0; i < spec.size; i++) {
						const stack = container.items[i];
						if (stack && stack.amount > stack.maxAmount) {
							throw new Error(
								`${info} 第 ${i} 格数量 ${stack.amount} 超过上限 ${stack.maxAmount}`
							);
						}
					}

					// 4. 幂等：整理结果已就位时不应再产生写入
					const writes = container.writes;
					await sortContainer(container as never, spec.type as never, player as never);
					assertEqual(container.writes, writes, `${info} 第二次整理产生了多余写入`);
					assertEqual(contents(container), after, `${info} 第二次整理改变了内容`);

					expect(player.sendMessage).not.toHaveBeenCalled();
				}
			}
		}
	});
});

describe("sortContainer - 异常注入", () => {
	beforeEach(() => {
		Object.assign(globalConfig, {
			skipBundle: false,
			skipShulkerBox: false,
			autoEnderChest: false,
			interval: 60,
			actionCooldown: 10,
			showLoadSuccessMessage: true,
		});
	});

	function setup(method = 1, dir = 0) {
		const player = fakePlayer();
		sorter_method.set(player as never, method);
		sorter_dir.set(player as never, dir);
		sorter_ordertable.set(player as never, 0);
		return player;
	}

	it("读取中途抛错时不写入、提示一次", async () => {
		const player = setup();
		const container = new FakeContainer(27, [
			item("minecraft:stone", 5),
			item("minecraft:dirt", 3),
			item("minecraft:apple", 2),
		]);
		const original = container.getSlot.bind(container);
		let calls = 0;
		spyOn(container, "getSlot").mockImplementation((index: number) => {
			if (++calls === 5) throw new Error("InvalidContainerError");
			return original(index);
		});

		const before = contents(container);
		await expect(
			sortContainer(container as never, ContainerTypes.common as never, player as never)
		).resolves.toBeUndefined();

		expect(player.sendMessage).toHaveBeenCalledTimes(1);
		expect(container.writes).toBe(0);
		expect(contents(container)).toEqual(before);
	});

	it("末影箱读取中途抛错时不写入、提示一次", async () => {
		const player = setup();
		const container = new FakeContainer(27, [
			item("minecraft:stone", 5),
			item("minecraft:dirt", 3),
		]);
		const original = container.getItem.bind(container);
		let calls = 0;
		spyOn(container, "getItem").mockImplementation((index: number) => {
			if (++calls === 3) throw new Error("InvalidContainerSlotError");
			return original(index);
		});

		const before = contents(container);
		await expect(
			sortContainer(container as never, ContainerTypes.enderChest as never, player as never)
		).resolves.toBeUndefined();

		expect(player.sendMessage).toHaveBeenCalledTimes(1);
		expect(container.writes).toBe(0);
		expect(contents(container)).toEqual(before);
	});

	it("写入中途抛错时不崩、提示一次", async () => {
		const player = setup();
		const container = new FakeContainer(9, [
			item("minecraft:stone", 5),
			item("minecraft:dirt", 3),
			item("minecraft:apple", 2),
		]);
		const original = container.setItem.bind(container);
		let calls = 0;
		spyOn(container, "setItem").mockImplementation((index: number, stack) => {
			if (++calls === 3) throw new Error("写入失败");
			original(index, stack);
		});

		await expect(
			sortContainer(container as never, ContainerTypes.common as never, player as never)
		).resolves.toBeUndefined();

		expect(player.sendMessage).toHaveBeenCalledTimes(1);

		// 写回不是事务性的：同一同步块内 setItem 抛错属于防御性场景（真实 API 只在容器失效时抛，
		// 而容器失效不会发生在同步块中途），这里只保证异常被捕获、有提示、不产生未处理异常。
		expect(container.items).toHaveLength(9);
	});
});

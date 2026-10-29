import { mock } from "bun:test";
import { EntityComponentTypes, ItemLockMode, ItemStack } from "./stubs/minecraft-server";

type Extra = {
	maxAmount?: number;
	nameTag?: string;
	lore?: string[];
	lockMode?: string;
};

/** 构造一个测试用物品 */
export function item(typeId: string, amount = 1, extra: Extra = {}) {
	const stack = new ItemStack(typeId, amount);
	if (extra.maxAmount !== undefined) stack.maxAmount = extra.maxAmount;
	if (extra.nameTag !== undefined) stack.nameTag = extra.nameTag;
	if (extra.lore !== undefined) stack.lore = extra.lore;
	if (extra.lockMode !== undefined) stack.lockMode = extra.lockMode;
	return stack;
}

export function locked(typeId: string, amount = 1, extra: Extra = {}) {
	return item(typeId, amount, { ...extra, lockMode: ItemLockMode.slot });
}

function cloneItem(stack: ItemStack) {
	const copy = item(stack.typeId, stack.amount, {
		maxAmount: stack.maxAmount,
		nameTag: stack.nameTag,
		lore: stack.lore,
		lockMode: stack.lockMode,
	});
	return copy;
}

/** 模拟 Container，读写都做拷贝，贴近真实 API 的返回副本语义 */
export class FakeContainer {
	readonly items: (ItemStack | undefined)[];
	/** setItem 调用次数（含清空），用于断言无意义写入与双写行为 */
	writes = 0;
	/** setItem 调用记录：[槽位, 类型 id | null] */
	writeLog: [number, string | null][] = [];
	/** 每格 getItem 调用次数，用于断言跳过时没有创建完整物品副本 */
	reads: number[];

	constructor(
		readonly size: number,
		items: (ItemStack | undefined)[] = []
	) {
		this.items = Array.from({ length: size }, (_, i) => {
			const stack = items[i];
			return stack ? cloneItem(stack) : undefined;
		});
		this.reads = new Array(size).fill(0);
	}

	getSlot(index: number) {
		const container = this;
		return {
			hasItem: () => container.items[index] !== undefined,
			getItem: () => {
				container.reads[index]++;
				const stack = container.items[index];
				return stack ? cloneItem(stack) : undefined;
			},
			get typeId() {
				return container.items[index]?.typeId;
			},
			get amount() {
				return container.items[index]?.amount;
			},
		};
	}

	setItem(index: number, stack: ItemStack | undefined) {
		this.writes++;
		this.writeLog.push([index, stack?.typeId ?? null]);
		this.items[index] = stack ? cloneItem(stack) : undefined;
	}

	/** 便于断言的快照：`minecraft:stone x64` 或 null */
	snapshot() {
		return this.items.map((stack) => (stack ? `${stack.typeId} x${stack.amount}` : null));
	}
}

/** 模拟 Player，末影箱/背包容器挂在组件上 */
export function fakePlayer(id = "p1") {
	const enderChest = new FakeContainer(27);
	const inventory = new FakeContainer(36);

	const player = {
		id,
		name: "Tester",
		location: { x: 0, y: 0, z: 0 },
		enderChest,
		inventory,
		sendMessage: mock(),
		getComponent(type: string) {
			if (type === EntityComponentTypes.EnderInventory || type === "minecraft:ender_inventory") {
				return { container: enderChest };
			}
			if (type === EntityComponentTypes.Inventory || type === "minecraft:inventory") {
				return { container: inventory };
			}
			return undefined;
		},
		getBlockFromViewDirection() {
			return undefined as unknown;
		},
		getEntitiesFromViewDirection() {
			return [] as unknown[];
		},
	};

	return player;
}

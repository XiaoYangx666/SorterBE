// @minecraft/server 的最小替身，只实现被测代码用到的部分。
// 测试里请通过本文件导入 ItemLockMode/EntityComponentTypes 等运行时枚举。

const noopSubscription = { unsubscribe() {} };
const noopEvent = { subscribe: () => noopSubscription, unsubscribe() {} };

export const world = {
	afterEvents: {
		worldLoad: noopEvent,
		playerSpawn: noopEvent,
		playerJoin: noopEvent,
		playerInteractWithBlock: noopEvent,
		playerInteractWithEntity: noopEvent,
		playerInventoryItemChange: noopEvent,
	},
	beforeEvents: { startup: noopEvent },
	sendMessage: () => {},
	getDimension: () => {
		throw new Error("world.getDimension 未在测试替身中实现");
	},
};

export const system = {
	currentTick: 0,
	run: (callback: () => void) => {
		callback();
		return 1;
	},
	runTimeout: (callback: () => void) => {
		callback();
		return 1;
	},
	runInterval: () => 1,
	runJob: () => 1,
	clearRun: () => {},
	afterEvents: { scriptEventReceive: noopEvent },
	beforeEvents: { startup: noopEvent },
};

export const ItemLockMode = {
	none: "none",
	slot: "slot",
	inventory: "inventory",
} as const;

export const EntityComponentTypes = {
	Inventory: "minecraft:inventory",
	EnderInventory: "minecraft:ender_inventory",
	CursorInventory: "minecraft:cursor_inventory",
	Strength: "minecraft:strength",
} as const;

export const BlockComponentTypes = {
	Inventory: "minecraft:inventory",
} as const;

export const ItemComponentTypes = {
	Potion: "minecraft:potion",
} as const;

export const PlayerInventoryType = {
	Hotbar: "Hotbar",
	Inventory: "Inventory",
} as const;

export class ItemStack {
	typeId: string;
	amount: number;
	maxAmount = 64;
	nameTag?: string;
	lore: string[] = [];
	lockMode: string = ItemLockMode.none;
	/** 物品组件替身，按组件 id 索引 */
	components: Record<string, unknown> = {};

	constructor(typeId: string, amount = 1) {
		this.typeId = typeId;
		this.amount = amount;
	}

	// 与真实 ItemStack.isStackableWith 一致：不可堆叠物品永远返回 false，
	// 且自定义数据（名称、lore）不同时不可合并
	isStackableWith(other: ItemStack) {
		return (
			this.maxAmount > 1 &&
			this.typeId === other.typeId &&
			this.maxAmount === other.maxAmount &&
			(this.nameTag ?? "") === (other.nameTag ?? "") &&
			this.lore.length === other.lore.length &&
			this.lore.every((line, i) => line === other.lore[i])
		);
	}

	getComponent(type: string) {
		return this.components[type];
	}
}

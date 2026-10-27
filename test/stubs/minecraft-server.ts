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
	Inventory: "inventory",
	EnderChest: "ender_chest",
} as const;

export class ItemStack {
	typeId: string;
	amount: number;
	maxAmount = 64;
	nameTag?: string;
	lore: string[] = [];
	lockMode: string = ItemLockMode.none;

	constructor(typeId: string, amount = 1) {
		this.typeId = typeId;
		this.amount = amount;
	}

	isStackableWith(other: ItemStack) {
		return (
			this.typeId === other.typeId &&
			(this.nameTag ?? "") === (other.nameTag ?? "") &&
			this.maxAmount === other.maxAmount
		);
	}

	getComponent() {
		return undefined;
	}
}

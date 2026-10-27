import { EntityComponentTypes, world } from "@minecraft/server";
import { Command, formManager, pcommand, translator } from "sapi-pro";
import { globalConfig, sorter_auto } from "../config";
import { lang } from "../constants";
import { CmdLang, MessageLang } from "../lang";
import { profiler } from "./profiler";
import { SorterScheduler } from "./scheduler";
import {
	ContainerTypes,
	entityWhiteList,
	getBlockContainerType,
	getEnderChestContainer,
	getEntityContainerType,
	sortContainer,
} from "./sort";
import { sortCmdHandler } from "./sortCommand";
import { sorterMenu } from "./sorterUI";

//---命令---
const sortShortCommand = new Command(
	"r",
	translator.translate(CmdLang.r, undefined, lang),
	false,
	sortCmdHandler
);
const sorter = new Command(
	"sorter",
	translator.translate(CmdLang.sorter, undefined, lang),
	false,
	(player) => {
		formManager.openNamed(player, "sorter.main", {}, 5);
	}
);

pcommand.registerNative(sortShortCommand);
pcommand.registerNative(sorter);

//---表单---
formManager.registerNamed("sorter.main", sorterMenu);

//---订阅---

//自动整理方块黑名单
const blockAutoSortBlackList = [
	"hopper",
	"furnace",
	"lit_furnace",
	"smoker",
	"lit_smoker",
	"blast_furnace",
	"lit_blast_furnace",
	"dropper",
	"dispenser",
	"brewing_stand",
];
//自动整理容器方块
world.afterEvents.playerInteractWithBlock.subscribe((t) => {
	const player = t.player;
	if (!player) return;
	if (sorter_auto.get(player) !== 1) return;

	//获取方块容器
	const BlockContainer = t.block.getComponent("inventory")?.container;

	//末影箱：容器在玩家身上
	if (t.block.typeId === "minecraft:ender_chest") {
		if (!globalConfig.autoEnderChest) return;
		const enderContainer = getEnderChestContainer(player);
		if (enderContainer) sortContainer(enderContainer, ContainerTypes.enderChest, player);
		return;
	}

	if (!BlockContainer || blockAutoSortBlackList.includes(t.block.typeId.split(":")[1])) return;

	const type = getBlockContainerType(t.block);
	sortContainer(BlockContainer, type, player);
});

//自动整理容器实体
world.afterEvents.playerInteractWithEntity.subscribe((t) => {
	const player = t.player;
	if (!player) return;
	if (sorter_auto.get(player) !== 1) return;

	//获取实体容器
	if (!t.target.isValid) return;
	const entityContainer = t.target.getComponent(EntityComponentTypes.Inventory)?.container;
	const entityId = t.target.typeId.split(":")[1];
	if (!entityContainer || !entityWhiteList.includes(entityId)) return;

	const type = getEntityContainerType(t.target);
	sortContainer(entityContainer, type, player);
});

//自动整理背包调度器
export const scheduler = new SorterScheduler();
scheduler.start();

profiler.start();

//玩家进入消息推送
world.afterEvents.playerSpawn.subscribe((e) => {
	if (!globalConfig.showLoadSuccessMessage) return;
	if (e.player == undefined || !e.initialSpawn) {
		return;
	}
	const player = e.player;
	const t = translator.createPureFor(player);
	player.sendMessage(t(MessageLang.playerSpawn.loaded));
	player.sendMessage(t(MessageLang.playerSpawn.openMsg));
});

//背包物品变更订阅
world.afterEvents.playerInventoryItemChange.subscribe((t) => {
	// 主背包和快捷栏的物品变化都记录为活动，避免依赖时间窗口漏掉真实玩家操作
	scheduler.onPlayerInventoryChange(t);
});

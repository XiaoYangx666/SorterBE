import { EntityComponentTypes, world } from "@minecraft/server";
import { Command, formManager, pcommand } from "sapi-pro";
import { intervalBus } from "sapi-pro/scripts/Event";
import { getAllPlayers } from "sapi-pro/scripts/func";
import {
	ContainerTypes,
	entityWhiteList,
	getBlockContainerType,
	getEntityContainerType,
	sortByPlayerSettings,
} from "./sort";
import { sortCmdHandler } from "./sortCommand";
import { sorter_auto, sorter_autoback } from "./sorterUI";

//---命令---
const sortShortCommand = new Command("r", "整理背包或容器", false, sortCmdHandler);
const sorter = new Command("sorter", "打开自动整理设置", false, (player) => {
	formManager.openNamed(player, "sorter.main", {}, 5);
});

pcommand.registerCommand(sortShortCommand);
pcommand.registerNative(sortShortCommand);
pcommand.registerCommand(sorter);
pcommand.registerNative(sorter);

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
	const BlockContainer = t.block.getComponent("inventory")?.container;
	if (!BlockContainer || blockAutoSortBlackList.includes(t.block.typeId.split(":")[1])) return;

	const player = t.player;
	if (sorter_auto.get(player) !== 1) return;

	const type = getBlockContainerType(t.block);
	sortByPlayerSettings(BlockContainer, player, type);
});

//自动整理容器实体
world.afterEvents.playerInteractWithEntity.subscribe((t) => {
	const entityContainer = t.target.getComponent(EntityComponentTypes.Inventory)?.container;
	const entityId = t.target.typeId.split(":")[1];
	if (!entityContainer || !entityWhiteList.includes(entityId)) return;

	const player = t.player;
	if (sorter_auto.get(player) !== 1) return;

	const type = getEntityContainerType(t.target);
	sortByPlayerSettings(entityContainer, player, type);
});

//自动整理背包(每分钟)
intervalBus.subscribemin(() => {
	for (let player of getAllPlayers()) {
		const autoback = sorter_autoback.get(player);
		if (!autoback) continue;

		const container = player.getComponent("inventory")?.container;
		sortByPlayerSettings(container, player, ContainerTypes.player);
	}
});

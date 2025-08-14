import { Block, Container, ItemStack, Player, system, world } from "@minecraft/server";
import { Command, pcommand } from "sapi-pro";
import { formManager } from "sapi-pro";
import { distance, getAllPlayers } from "sapi-pro/scripts/func.js";
import { mes, sortDirs, sortMethods } from "./methods.js";
import { sorter_auto, sorter_autoback, sorter_dir, sorter_method } from "./sorterUI.js";
import { intervalBus } from "sapi-pro/scripts/Event.js";

//自动整理黑名单
const blackList = ["hopper", "furnace", "lit_furnace", "smoker", "lit_smoker", "blast_furnace", "lit_blast_furnace", "dropper", "dispenser", "brewing_stand"];

// 整理函数
async function sortInventory(container: Container | undefined, isPlyaerInv: boolean = false, sortMethod: number = 0, sortDir: number = 0) {
    if (!container) return;
    let itemArray: ItemStack[] = [];
    for (let slot = 0; slot < container.size; slot++) {
        let item = container.getItem(slot);
        if (!item || (isPlyaerInv && slot < 9)) continue;
        itemArray.push(item);
    }
    try {
        //使用对应的排序方法
        itemArray.sort(Object.values(sortMethods)[sortMethod]);
        //合并
        const result: ItemStack[] = [];
        for (let i = 0; i < itemArray.length; i++) {
            const topitem = result[result.length - 1];
            const item = itemArray[i];
            if (topitem && topitem.typeId == item.typeId && topitem.isStackableWith(item) && topitem.amount < topitem.maxAmount) {
                //可以合并
                if (topitem.amount + item.amount <= topitem.maxAmount) {
                    topitem.amount += item.amount;
                } else {
                    item.amount = topitem.amount + item.amount - topitem.maxAmount;
                    topitem.amount = topitem.maxAmount;
                    result.push(item);
                }
            } else {
                result.push(item);
            }
        }
        //调用对应的放置方法
        Object.values(sortDirs)[sortDir](container, isPlyaerInv, result);
    } catch (e) {
        console.warn(`${e}`);
    }
}

//整理指令
const coolMap: Map<string, number> = new Map();
function sortHandler(player: Player, params: any) {
    const lasttime = coolMap.get(player.id);
    if (lasttime && Date.now() - lasttime <= 2000) {
        return mes(player, "请等待" + (2 - (Date.now() - lasttime) / 1000).toFixed(1) + "秒后再使用");
    }
    const block = player.getBlockFromViewDirection()?.block;
    let inv = undefined;
    const sortPlayer = isSortPlayer(player, block);
    if (sortPlayer) {
        inv = player.getComponent("inventory")?.container;
    } else {
        const block1 = block as Block;
        inv = block1.getComponent("minecraft:inventory")?.container;
    }
    const sort_method = sorter_method.get(player) || 0;
    const sort_dir = sorter_dir.get(player) || 0;
    system.run(async () => {
        await sortInventory(inv, sortPlayer, sort_method, sort_dir);
        mes(player, sortPlayer ? "整理背包完成" : "整理完成");
    });
    coolMap.set(player.id, Date.now());
}

function isSortPlayer(player: Player, block: Block | undefined) {
    if (!block) return true;
    const dis = distance(player.location, block?.location);
    if (dis > 25) return true;
    let inv = block?.getComponent("minecraft:inventory")?.container;
    if (!inv || block.typeId.indexOf("furnace") != -1) return true;
    return false;
}

//命令
const sortShortCommand = new Command("r", "整理背包或容器", false, sortHandler);
const sorter = new Command("sorter", "打开自动整理设置", false, (player, args) => {
    formManager.openNamed(player, "sorter.main", {}, 5);
});

pcommand.registerCommand(sortShortCommand);
pcommand.registerNative(sortShortCommand);
pcommand.registerCommand(sorter);
pcommand.registerNative(sorter);

//自动整理订阅
world.afterEvents.playerInteractWithBlock.subscribe((t) => {
    let BlockContainer = t.block.getComponent("inventory")?.container;
    if (!BlockContainer || blackList.indexOf(t.block.typeId.split(":")[1]) != -1) return;
    const player = t.player;
    if (sorter_auto.get(player) != 1) return;
    const sort_method = sorter_method.get(player) || 0;
    const sort_dir = sorter_dir.get(player) || 0;
    system.run(async () => {
        sortInventory(BlockContainer, false, sort_method, sort_dir);
    });
    coolMap.set(player.id, Date.now());
});

intervalBus.subscribemin(() => {
    for (let player of getAllPlayers()) {
        const autoback = sorter_autoback.get(player);
        if (autoback) {
            const sort_method = sorter_method.get(player) || 0;
            const sort_dir = sorter_dir.get(player) || 0;
            system.run(async () => {
                sortInventory(player.getComponent("inventory")?.container, true, sort_method, sort_dir);
            });
        }
    }
});

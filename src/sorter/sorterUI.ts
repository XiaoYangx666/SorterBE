import { system } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { ScoreBoardDataBase } from "SAPI-Pro/DataBase";
import { formManager, SAPIProForm } from "SAPI-Pro/Form/main";
import { sortDirs, sortMethods } from "./methods";
//相关计分板
export const sorter_auto = new ScoreBoardDataBase("sorter_auto");
export const sorter_method = new ScoreBoardDataBase("sorter_method");
export const sorter_dir = new ScoreBoardDataBase("sorter_dir");
export const sorter_autoback = new ScoreBoardDataBase("sorter_autoback");

const sorterUI: SAPIProForm<ModalFormData> = {
    builder: async (player, context) => {
        const autoSort = sorter_auto.get(player) == 1;
        const autoSortBack = sorter_autoback.get(player) == 1;
        const sortMethod = sorter_method.get(player) || 0;
        const sortDir = sorter_dir.get(player) || 0;
        const form = new ModalFormData()
            .title("Sorter设置")
            .dropdown("整理方法", Object.keys(sortMethods), { defaultValueIndex: sortMethod })
            .dropdown("整理方向", Object.keys(sortDirs), { defaultValueIndex: sortDir })
            .toggle("自动整理容器", { defaultValue: autoSort })
            .toggle("自动整理背包(每分钟整理)", { defaultValue: autoSortBack });
        context.autoSort = autoSort;
        return form;
    },
    handler: (res, context) => {
        const player = context.player;
        if (res.formValues) {
            const sortMethod1 = res.formValues[0] as number;
            const sortDir1 = res.formValues[1] as number;
            const autoSort1 = res.formValues[2] as boolean;
            const autoSortBack = res.formValues[3] as boolean;
            system.run(() => {
                sorter_auto.set(player, autoSort1 ? 1 : 0);
                sorter_autoback.set(player, autoSortBack ? 1 : 0);
                sorter_method.set(player, sortMethod1);
                sorter_dir.set(player, sortDir1);
            });
            player.sendMessage("§2[自动整理]§r配置保存成功");
        }
    },
};
formManager.registerNamed("sorter.main", sorterUI);

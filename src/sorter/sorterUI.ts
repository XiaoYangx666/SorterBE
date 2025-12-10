import { system } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { SAPIProForm } from "sapi-pro";
import { sorter_auto, sorter_autoback, sorter_dir, sorter_method, sorter_ordertable } from "../db";
import { orderTables } from "../tables";
import { sortDirs, sortMethods } from "./methods";
import { mes } from "./sort";
//相关计分板

export const sorterUI: SAPIProForm<ModalFormData> = {
	builder: async (player, context) => {
		const autoSort = sorter_auto.get(player) == 1;
		const autoSortBack = sorter_autoback.get(player) == 1;
		const sortMethod = sorter_method.get(player) || 0;
		const sortDir = sorter_dir.get(player) || 0;
		const orderTable = sorter_ordertable.get(player) || 0;
		const form = new ModalFormData()
			.title("自动整理设置")
			.dropdown("整理方法", Object.keys(sortMethods), { defaultValueIndex: sortMethod })
			.dropdown(
				"排序表",
				orderTables.map((t) => t.name),
				{ defaultValueIndex: orderTable, tooltip: "自定义排序依据(仅在按ID表顺序整理时有效)" }
			)
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
			const orderTable1 = res.formValues[1] as number;
			const sortDir1 = res.formValues[2] as number;
			const autoSort1 = res.formValues[3] as boolean;
			const autoSortBack = res.formValues[4] as boolean;
			system.run(() => {
				sorter_auto.set(player, autoSort1 ? 1 : 0);
				sorter_autoback.set(player, autoSortBack ? 1 : 0);
				sorter_method.set(player, sortMethod1);
				sorter_ordertable.set(player, orderTable1);
				sorter_dir.set(player, sortDir1);
			});
			mes(player, "配置保存成功!");
		}
	},
};

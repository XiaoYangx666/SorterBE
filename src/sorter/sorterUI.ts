import { system } from "@minecraft/server";
import { CommonForm, FieldType, LangSettingForm, translator } from "sapi-pro";
import { getGlobalConfig, getUserConfig, saveUserConfig, setGlobalConfig } from "../config";
import { GlobalConfigLang, MenuLang, MessageLang, UILang, UserSettingLang } from "../lang";
import { orderTables } from "../tables";
import { sortDirs, sortMethods } from "./methods";
import { mes } from "./sort";

export const sorterMenu = CommonForm.ButtonForm({
	title: MenuLang.title,
	buttons: [
		{
			label: MenuLang.userConfig,
			icon: "ui/settings_pause_menu_icon.png",
			func(ctx) {
				ctx.push(userConfigForm);
			},
		},
		{
			label: MenuLang.adminConfig,
			icon: "ui/icon_setting.png",
			isAdmin: true,
			func(ctx) {
				ctx.push(globalConfigForm);
			},
		},
		{
			label: MenuLang.lang,
			icon: "gui/newgui/Language18.png",
			func(context) {
				context.push(LangSettingForm);
			},
		},
	],
});

const userConfigForm = CommonForm.ConfigForm().create(
	{
		// 整理方法
		method: {
			type: FieldType.Dropdown,
			label: UserSettingLang.methods,
			items: sortMethods.map((m) => m.name),
		},
		// 整理表
		table: {
			type: FieldType.Dropdown,
			label: UserSettingLang.table,
			items: orderTables.map((t) => t.name),
			tooltip: UserSettingLang.table_tip,
		},
		// 方向
		dir: {
			type: FieldType.Dropdown,
			label: UserSettingLang.dir,
			items: (player) => {
				const t = translator.createPureFor(player);
				return sortDirs.map((d) => t(UILang.dir, { dir: d.name }));
			},
		},
		// 自动整理
		auto: {
			type: FieldType.Boolean,
			label: UserSettingLang.auto,
		},
		// 自动整理背包
		auto_back: {
			type: FieldType.Boolean,
			label: UserSettingLang.auto_back,
		},
	},
	{
		title: UserSettingLang.title,
		initialValues: (player) => getUserConfig(player),
		onCancel(player, ctx) {
			ctx.back();
		},
		onSubmit(data, player, ctx) {
			saveUserConfig(player, data);
			system.run(() => {
				mes(player, MessageLang.userConfigSaved);
			});
			ctx.back();
		},
	}
);

const globalConfigForm = CommonForm.ConfigForm().create(
	{
		skipBundle: {
			type: FieldType.Boolean,
			label: GlobalConfigLang.skipBundle,
			tooltip: GlobalConfigLang.skipBundle_tip,
		},
		skipShulkerBox: {
			type: FieldType.Boolean,
			label: GlobalConfigLang.skipShulkerBox,
			tooltip: GlobalConfigLang.skipShulkerBox_tip,
		},
		interval: {
			type: FieldType.Slider,
			label: GlobalConfigLang.interval,
			tooltip: GlobalConfigLang.interval_tip,
			defaultValue: 60,
			min: 30,
			max: 120,
		},
		actionCooldown: {
			type: FieldType.Slider,
			label: GlobalConfigLang.cooldown,
			tooltip: GlobalConfigLang.cooldown_tip,
			defaultValue: 10,
			min: 5,
			max: 20,
		},
	},
	{
		title: GlobalConfigLang.title,
		initialValues: () => {
			return getGlobalConfig();
		},
		onCancel(player, ctx) {
			ctx.back();
		},
		onSubmit(result, player, ctx) {
			setGlobalConfig(result);
			mes(player, GlobalConfigLang.saved);
			ctx.back();
		},
	}
);

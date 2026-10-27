import { system } from "@minecraft/server";
import { CommonForm, FieldType, LangSettingForm, translator } from "sapi-pro";
import {
	getGlobalConfig,
	getUserConfig,
	globalConfig,
	saveUserConfig,
	setGlobalConfig,
} from "../config";
import { sorterInfo } from "../constants";
import {
	AboutFormLang,
	GlobalConfigLang,
	MenuLang,
	MessageLang,
	ProfileFormLang,
	UILang,
	UserSettingLang,
} from "../lang";
import { orderTables } from "../tables";
import { sortDirs, sortMethods } from "./methods";
import { mes } from "./sort";
import { profiler } from "./profiler";
import { getPlayerById } from "sapi-pro/func";

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
			label: ProfileFormLang.title,
			icon: "ui/icon_timer.png",
			isAdmin: true,
			func(context) {
				context.push(profileForm);
			},
		},
		{
			label: MenuLang.lang,
			icon: "gui/newgui/Language18.png",
			func(context) {
				context.push(LangSettingForm);
			},
		},
		{
			label: AboutFormLang.title,
			icon: "items/book_written.png",
			func(context) {
				context.push(aboutForm);
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
			tooltip: GlobalConfigLang.skipShulkerBox,
		},
		autoEnderChest: {
			type: FieldType.Boolean,
			label: GlobalConfigLang.autoEnderChest,
			tooltip: GlobalConfigLang.autoEnderChest_tip,
			defaultValue: true,
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
		showLoadSuccessMessage: {
			type: FieldType.Boolean,
			label: GlobalConfigLang.loadMessage,
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

const aboutForm = CommonForm.BodyInfoForm(AboutFormLang.title, (form, p, args, t) => {
	const about = t(AboutFormLang.content, {
		version: sorterInfo.version,
		author: sorterInfo.author,
		group: "1004513100",
	}) as string;
	const changeLog = t(AboutFormLang.changeLog) as string;
	form.body(about + "\n\n" + changeLog);
});

const profileForm = CommonForm.BodyInfoForm(ProfileFormLang.title, (form, p, args, t) => {
	// 统计数据
	const avg = profiler.getAverageTime();
	const total = profiler.getTotalCount();
	const slowest = profiler.getSlowestPlayer();
	const maxSingle = profiler.getMaxSingle();
	const playerAvg = profiler.getPlayerAverage(p.id);

	// 格式化（避免小数太长）
	const format = (n: number) => n.toFixed(2);

	let body = "";

	// 全局信息
	body += t(ProfileFormLang.global, {
		avg: format(avg),
		total,
	});

	// 当前玩家
	body +=
		"\n\n" +
		t(ProfileFormLang.player, {
			avg: format(playerAvg),
		});

	// 最慢玩家（平均）
	if (slowest) {
		body +=
			"\n\n" +
			t(ProfileFormLang.slowest, {
				player: getPlayerById(slowest.playerId)?.name ?? "unknow",
				avg: format(slowest.avg),
			});
	}

	// 单次最慢
	if (maxSingle) {
		body +=
			"\n\n" +
			t(ProfileFormLang.maxSingle, {
				player: getPlayerById(maxSingle.playerId)?.name ?? "unknow",
				duration: format(maxSingle.duration),
			});
	}

	form.body(body);
});

import { defineLangTree } from "sapi-pro";

export const MessageLang = defineLangTree({
	prefix: {
		zh_CN: "§2[一键整理]§r",
	},
	backPack: {
		zh_CN: "背包",
	},
	playerSpawn: {
		loaded: {
			zh_CN: "§2[自动整理] 插件加载成功",
		},
		openMsg: {
			zh_CN: "§f§l使用 §e/sorter §f§l打开菜单",
		},
	},
	sortError: {
		zh_CN: "整理错误: ",
	},
	sortSuccess: {
		zh_CN: "整理{target}完成§7({time}ms) ",
	},
	userConfigSaved: {
		zh_CN: "配置保存成功!",
	},
});

export const CmdLang = defineLangTree({
	r: {
		zh_CN: "整理背包或容器",
	},
	sorter: {
		zh_CN: "打开自动整理菜单",
	},
});

export const UILang = defineLangTree({
	dir: {
		zh_CN: "{dir}字形",
		en_US: "Put In {dir}",
	},
	method: {
		byTable: {
			zh_CN: "按ID表顺序整理(默认)",
		},
		byName: {
			zh_CN: "按字母顺序整理",
		},
	},
	table: {
		time: {
			zh_CN: "物品发布顺序表",
		},
		time_desc: {
			zh_CN: "根据物品的发布版本为排序依据，出现早的物品更靠前",
		},
		group: {
			zh_CN: "物品分类顺序表",
		},
		group_desc: {
			zh_CN: "根据物品作用分类后的id表，如武器和装备、工具、食物、作物",
		},
	},
});

export const UserSettingLang = defineLangTree({
	title: {
		zh_CN: "自动整理设置",
	},
	methods: {
		zh_CN: "整理方法",
	},
	table: {
		zh_CN: "排序表",
	},
	table_tip: {
		zh_CN: "自定义排序依据(仅在按ID表顺序整理时有效)",
	},
	dir: {
		zh_CN: "整理方向",
	},
	auto: {
		zh_CN: "自动整理容器",
	},
	auto_back: {
		zh_CN: "自动整理背包(定时整理)",
	},
});

export const GlobalConfigLang = defineLangTree({
	title: {
		zh_CN: "全局设置",
	},
	skipBundle: {
		zh_CN: "跳过收纳袋",
	},
	skipBundle_tip: {
		zh_CN: "跳过收纳袋有助于显著降低卡顿",
	},
	skipShulkerBox: {
		zh_CN: "跳过潜影盒",
	},
	skipShulkerBox_tip: {
		zh_CN: "跳过潜影盒有助于降低卡顿",
	},
	interval: {
		zh_CN: "背包自动整理间隔(秒)",
	},
	cooldown: {
		zh_CN: "背包操作冷却(秒)",
	},
	cooldown_tip: {
		zh_CN: "设置玩家操作后背包自动整理冷却时间",
	},
	interval_tip: {
		zh_CN: "设置背包自动整理触发的时间间隔",
	},
	saved: {
		zh_CN: "全局配置已保存",
	},
});

export const MenuLang = defineLangTree({
	title: {
		zh_CN: "自动整理菜单",
	},
	userConfig: {
		zh_CN: "自动整理配置",
	},
	adminConfig: {
		zh_CN: "管理员配置",
	},
	lang: {
		zh_CN: "语言设置",
	},
});

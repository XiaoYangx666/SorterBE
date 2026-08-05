import { languages, PackInfo } from "sapi-pro";

export const lang: languages = "zh_CN";
export const ShulkerBoxIds = new Set([
	"minecraft:undyed_shulker_box",
	"minecraft:white_shulker_box",
	"minecraft:orange_shulker_box",
	"minecraft:magenta_shulker_box",
	"minecraft:light_blue_shulker_box",
	"minecraft:yellow_shulker_box",
	"minecraft:lime_shulker_box",
	"minecraft:pink_shulker_box",
	"minecraft:gray_shulker_box",
	"minecraft:light_gray_shulker_box",
	"minecraft:cyan_shulker_box",
	"minecraft:purple_shulker_box",
	"minecraft:blue_shulker_box",
	"minecraft:brown_shulker_box",
	"minecraft:green_shulker_box",
	"minecraft:red_shulker_box",
	"minecraft:black_shulker_box",
]);

export const BundleIds = new Set([
	"minecraft:bundle",
	"minecraft:white_bundle",
	"minecraft:light_gray_bundle",
	"minecraft:gray_bundle",
	"minecraft:black_bundle",
	"minecraft:brown_bundle",
	"minecraft:red_bundle",
	"minecraft:orange_bundle",
	"minecraft:yellow_bundle",
	"minecraft:lime_bundle",
	"minecraft:green_bundle",
	"minecraft:cyan_bundle",
	"minecraft:light_blue_bundle",
	"minecraft:blue_bundle",
	"minecraft:purple_bundle",
	"minecraft:magenta_bundle",
	"minecraft:pink_bundle",
]);

export const sorterInfo: PackInfo = {
	name: "**NAME**",
	version: "**VERSION**",
	author: "XiaoYangx666",
	nameSpace: "sorter",
	uuid: "**UUID**",
	description: "SorterBE，自动整理，输入/sorter即可打开配置文件，输入/r整理背包或容器",
};

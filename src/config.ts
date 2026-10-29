import { Player } from "@minecraft/server";
import { Configdb, ScoreBoardDataBase } from "sapi-pro";
import { logger } from "./ext";
import { worldDeferredObject } from "sapi-pro/Deferred";

//---用户配置---
export interface UserConfig {
	method: number;
	table: number;
	dir: number;
	auto: boolean;
	auto_back: boolean;
}

export const sorter_auto = new ScoreBoardDataBase("sorter_auto");
export const sorter_method = new ScoreBoardDataBase("sorter_method");
export const sorter_dir = new ScoreBoardDataBase("sorter_dir");
export const sorter_autoback = new ScoreBoardDataBase("sorter_autoback");
export const sorter_ordertable = new ScoreBoardDataBase("sorter_ordertable");

export function saveUserConfig(player: Player, data: UserConfig) {
	sorter_auto.set(player, data.auto ? 1 : 0);
	sorter_autoback.set(player, data.auto_back ? 1 : 0);
	sorter_method.set(player, data.method);
	sorter_ordertable.set(player, data.table);
	sorter_dir.set(player, data.dir);
}

export function getUserConfig(player: Player): UserConfig {
	return {
		method: sorter_method.get(player) || 0,
		table: sorter_ordertable.get(player) || 0,
		dir: sorter_dir.get(player) || 0,
		auto: sorter_auto.get(player) == 1,
		auto_back: sorter_autoback.get(player) == 1,
	};
}

//---全局配置---
export interface GlobalConfig {
	/**跳过收纳袋 */
	skipBundle: boolean;
	/**跳过潜影盒 */
	skipShulkerBox: boolean;
	/**自动整理末影箱 */
	autoEnderChest: boolean;
	/**自动整理间隔 */
	interval: number;
	/**操作冷却时间 */
	actionCooldown: number;
	/**是否显示加载成功消息 */
	showLoadSuccessMessage: boolean;
}

export function isGlobalConfig(value: unknown): value is GlobalConfig {
	if (typeof value !== "object" || value === null) return false;

	const v = value as Record<string, unknown>;

	return (
		typeof v.skipBundle === "boolean" &&
		typeof v.skipShulkerBox === "boolean" &&
		(v.autoEnderChest === undefined || typeof v.autoEnderChest === "boolean") &&
		typeof v.interval === "number" &&
		typeof v.actionCooldown === "number"
	);
}

const defaultGlobalConfig: GlobalConfig = {
	skipBundle: false,
	skipShulkerBox: false,
	// 末影箱只能按索引逐格读取，整理开销明显高于普通容器，默认关闭
	autoEnderChest: false,
	interval: 60,
	actionCooldown: 10,
	showLoadSuccessMessage: true,
};

export const globalConfig: GlobalConfig = worldDeferredObject<GlobalConfig>(getGlobalConfig);

/**设置全局配置 */
export function setGlobalConfig(config: GlobalConfig) {
	if (!isGlobalConfig(config)) {
		logger.warn("globalConfig格式错误，设置失败" + JSON.stringify(config));
		return;
	}
	//持久化存储
	Configdb.setJSON("sorter_global", config);
	//设置对象
	Object.assign(globalConfig, config);
}

export function getGlobalConfig() {
	const config = Configdb.getJSON<GlobalConfig>("sorter_global", isGlobalConfig);
	// 合并默认值，兼容旧版本存档缺失的新字段
	return Object.assign({}, defaultGlobalConfig, config ?? {});
}

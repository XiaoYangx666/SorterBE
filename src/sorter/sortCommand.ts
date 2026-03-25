import {
	BlockComponentTypes,
	Container,
	EntityComponentTypes,
	Player,
	system,
} from "@minecraft/server";
import { Vector3Utils } from "sapi-pro";
import {
	ContaienrTypeData,
	ContainerTypes,
	entityWhiteList,
	getBlockContainerType,
	getEntityContainerType,
	mes,
	sortContainer,
} from "./sort";
import { MessageLang } from "../lang";

//整理命令部分
export function sortCmdHandler(player: Player) {
	const target = getSortTarget(player);
	if (!target) return;

	system.run(async () => {
		const start = Date.now();
		await sortContainer(target.container, target.type, player);
		const end = Date.now();
		const time = end - start;
		mes(player, MessageLang.sortSuccess, {
			target: target.dis === -1 ? MessageLang.backPack : "",
			time: time == 0 ? "<1" : time,
		});
	});
}

interface sortTargetData {
	container: Container;
	dis: number;
	type: ContaienrTypeData;
}
/**获取整理目标 */
function getSortTarget(player: Player): sortTargetData | undefined {
	const block = getSortableBlock(player);
	const entity = getSortableEntity(player);

	// 两者都存在时取距离较小的
	const target = block && entity ? (block.dis < entity.dis ? block : entity) : (block ?? entity);

	if (target) return target;

	// 退化到玩家背包
	const playerContainer = player.getComponent(EntityComponentTypes.Inventory)?.container;

	return playerContainer
		? { container: playerContainer, dis: -1, type: ContainerTypes.player }
		: undefined;
}

function getSortableBlock(player: Player): sortTargetData | undefined {
	const hit = player.getBlockFromViewDirection({ maxDistance: 5 });
	const block = hit?.block;
	// 1.没有方块
	if (!block) return;
	// 2.方块是熔炉
	if (block.typeId.includes("furnace")) return;
	// 3.方块没有容器
	const container = block?.getComponent(BlockComponentTypes.Inventory)?.container;
	if (!container) return;

	return {
		container: container,
		dis: Vector3Utils.distance(player.location, block.location),
		type: getBlockContainerType(block),
	};
}

function getSortableEntity(player: Player): sortTargetData | undefined {
	const entities = player.getEntitiesFromViewDirection({ maxDistance: 5 });
	//1.没有实体
	if (entities.length == 0) return;

	const nearestEntity = entities.sort((a, b) => a.distance - b.distance)[0];
	//2.实体不在白名单
	if (!entityWhiteList.includes(nearestEntity.entity.typeId.split(":")[1])) return;
	//3.实体无容器组件
	const inv = nearestEntity.entity.getComponent(EntityComponentTypes.Inventory);
	if (!inv) return;

	return {
		container: inv.container,
		dis: nearestEntity.distance,
		type: getEntityContainerType(nearestEntity.entity),
	};
}

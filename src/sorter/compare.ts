import { ItemComponentTypes, ItemStack } from "@minecraft/server";
import { CompareFunc } from "./methods";

//特殊比较方法表(物品id，函数)
export const compareMap: Record<string, CompareFunc> = {
	potion: comparePotion,
};

//---特殊比较方法---

//药水比较
const cleanId = (id: string) => id.replace(/:(long_|strong_)+/, ":");
function comparePotion(a: ItemStack, b: ItemStack) {
	const aPotion = a.getComponent(ItemComponentTypes.Potion);
	const bPotion = b.getComponent(ItemComponentTypes.Potion);
	if (!aPotion || !bPotion) return 0;

	const aId = cleanId(aPotion.potionEffectType.id);
	const bId = cleanId(bPotion.potionEffectType.id);
	if (aId !== bId) return aId > bId ? 1 : -1;

	// 比较投递方式
	if (aPotion.potionDeliveryType.id !== bPotion.potionDeliveryType.id) {
		return aPotion.potionDeliveryType.id > bPotion.potionDeliveryType.id ? 1 : -1;
	}

	// 同种类 + 同 deliveryType → 比较效果
	const aTicks = aPotion.potionEffectType.durationTicks ?? 0;
	const bTicks = bPotion.potionEffectType.durationTicks ?? 0;
	const aStrong = aPotion.potionEffectType.id.includes("strong");
	const bStrong = bPotion.potionEffectType.id.includes("strong");

	if (aStrong !== bStrong) return aStrong ? 1 : -1;
	if (aTicks !== bTicks) return aTicks > bTicks ? 1 : -1;

	return 0;
}

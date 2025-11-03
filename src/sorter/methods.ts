import { Container, ItemComponentTypes, ItemStack, Player, world } from "@minecraft/server";
import { ids } from "./id";

const idMap: Record<string, number> = {};
world.afterEvents.worldLoad.subscribe(() => {
    for (let i = 0; i < ids.length; i++) {
        idMap[ids[i]] = i;
    }
});

export function mes(player: Player, text: string) {
    player.sendMessage("§2[一键整理]§r" + text);
}

const cleanId = (id: string) => id.replace(/:(long_|strong_)+/, ":");
//特殊比较方法
const comparePotion = (a: ItemStack, b: ItemStack) => {
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
};

//特殊比较方法
export const Compares: Record<string, Function> = {
    potion: comparePotion,
};

//通用比较方法
interface Comparefunc {
    (a: ItemStack, b: ItemStack): number;
}
export const compareByID = (a: ItemStack, b: ItemStack) => {
    const aId = a.typeId.split(":")[1];
    const bId = b.typeId.split(":")[1];
    let first = idMap[aId] ?? 2000;
    let second = idMap[bId] ?? 2000;
    if (first == second) {
        if (first == 2000) return compareByName(a, b);
        if (Compares[aId]) return Compares[aId](a, b);
    }
    return first - second;
};

export const compareByName = (a: ItemStack, b: ItemStack) => {
    let first = a.nameTag || a.typeId;
    let second = b.nameTag || b.typeId;
    if (first > second) {
        return 1;
    } else if (first == second) {
        if (Compares[first.split(":")[1]]) return Compares[first.split(":")[1]](a, b);
        return 0;
    } else {
        return -1;
    }
};
export const sortMethods: Record<string, Comparefunc> = { "按ID表顺序整理(默认)": compareByID, 按字母顺序整理: compareByName };

//整理方向
type SortDirfunc = (container: Container, itemArray: ItemStack[], slots: boolean[]) => void;

const putInZ: SortDirfunc = (container: Container, itemArray: ItemStack[], slots: boolean[]) => {
    for (let i = 0, j = 0; i < slots.length; i++) {
        if (slots[i] === false) continue;
        container.setItem(i, undefined);
        if (j < itemArray.length) {
            container.setItem(i, itemArray[j++]);
        }
    }
};
const putInN: SortDirfunc = (container: Container, itemArray: ItemStack[], slots: boolean[]) => {
    const rows = Math.floor(container.size / 9);

    let c = 0;
    for (let i = 0; i < 9; i++) {
        for (let row = 0; row < rows; row++) {
            const idx = i + row * 9;
            if (slots[idx] == false) continue;
            container.setItem(idx, undefined);
            if (c < itemArray.length) {
                container.setItem(idx, itemArray[c++]);
            }
        }
    }
};
export const sortDirs: Record<string, SortDirfunc> = { Z字形: putInZ, N字形: putInN };

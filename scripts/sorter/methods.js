import { ids } from "./id";
export function mes(player, text) {
    player.sendMessage("§2[一键整理]§r" + text);
}
//特殊比较方法
const comparePotion = (a, b) => {
    const aPotion = a.getComponent("potion");
    const bPotion = b.getComponent("potion");
    if (!aPotion || !bPotion)
        return 0;
    if (aPotion.potionEffectType.id > bPotion.potionEffectType.id) {
        return 1;
    }
    else if (aPotion.potionEffectType.id == bPotion.potionEffectType.id) {
        if (aPotion.potionLiquidType.id > bPotion.potionLiquidType.id) {
            return 1;
        }
        else if (aPotion.potionLiquidType.id == bPotion.potionLiquidType.id) {
            if (aPotion.potionModifierType.id > bPotion.potionModifierType.id) {
                return 1;
            }
            else if (aPotion.potionModifierType.id == bPotion.potionModifierType.id) {
                return 0;
            }
            else {
                return -1;
            }
        }
        else {
            return -1;
        }
    }
    else {
        return -1;
    }
};
//特殊比较方法
export const Compares = {
    potion: comparePotion,
};
export const compareByID = (a, b) => {
    const aId = a.typeId.split(":")[1];
    const bId = b.typeId.split(":")[1];
    let first = ids[aId] ?? 2000;
    let second = ids[bId] ?? 2000;
    if (first == second) {
        if (first == 2000)
            return compareByName(a, b);
        if (Compares[aId])
            return Compares[aId](a, b);
    }
    return first - second;
};
export const compareByName = (a, b) => {
    let first = a.nameTag || a.typeId;
    let second = b.nameTag || b.typeId;
    if (first > second) {
        return 1;
    }
    else if (first == second) {
        if (Compares[first.split(":")[1]])
            return Compares[first.split(":")[1]](a, b);
        return 0;
    }
    else {
        return -1;
    }
};
export const sortMethods = { "按ID表顺序整理(默认)": compareByID, 按字母顺序整理: compareByName };
const putInZ = (container, isPlyaerInv, itemArray) => {
    for (let i = isPlyaerInv ? 9 : 0, j = 0; i < container.size; i++, j++) {
        container.setItem(i, undefined);
        if (j < itemArray.length) {
            container.setItem(i, itemArray[j]);
        }
    }
};
const putInN = (container, isPlyaerInv, itemArray) => {
    const rows = Math.floor(container.size / 9);
    let c = 0;
    for (let i = 0; i < 9; i++) {
        for (let j = isPlyaerInv ? 1 : 0; j < rows; j++) {
            container.setItem(i + j * 9, undefined);
            if (c < itemArray.length) {
                container.setItem(i + j * 9, itemArray[c++]);
            }
        }
    }
};
export const sortDirs = { Z字形: putInZ, N字形: putInN };

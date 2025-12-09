import { PackInfo, initSAPIPro } from "sapi-pro";
import "./sorter/index";

const packInfo: PackInfo = {
    name: "SorterBE", //行为包名
    version: "1.2.4", //行为包版本
    author: "XiaoYangx666", //作者
    nameSpace: "sorter", //命名空间
    description: "SorterBE，自动整理，输入/sorter即可打开配置文件，输入.r整理背包或容器", //包描述
};
// 初始化
initSAPIPro(packInfo);

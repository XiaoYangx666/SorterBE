import { PackInfo, initSAPIPro, translator } from "sapi-pro";
import "./sorter/index";
import "./tables/index";

const packInfo: PackInfo = {
	name: "SorterBE", //行为包名
	version: "1.4.0", //行为包版本
	author: "XiaoYangx666", //作者
	nameSpace: "sorter", //命名空间
	uuid: "19ccda3d-c5b4-48e3-8538-8f9ffb7cfb70",
	description: "SorterBE，自动整理，输入/sorter即可打开配置文件，输入/r整理背包或容器", //包描述
};
// 初始化
initSAPIPro(packInfo);
translator.setFallBack("zh_CN");

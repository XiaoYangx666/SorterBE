import { initSAPIPro, translator } from "sapi-pro";
import { lang, sorterInfo } from "./constants";
import "./sorter/index";
import "./tables/index";

// 初始化
initSAPIPro(sorterInfo);
translator.setFallBack(lang);

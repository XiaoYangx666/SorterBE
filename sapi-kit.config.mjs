export default {
    //全局配置
    /**行为包根目录 */
    bpRoot: "./",
    /**材质包根目录 */
    rpRoot: undefined,

    //build配置
    /**打包缓存目录
     *
     * tsconfig的outdir需要和此目录一致
     */
    cacheDir: "./cache",
    /**入口文件(入口文件相对缓存目录的名字) */
    entryPoint: "main.js",
    /** 是否每次构建前清空 scripts 目录（建议在打包异常时开启） */
    shouldClearOutput: true,
    /** 是否通过 npx 调用 tsc。建议在 tsc 无法直接调用（例如未全局安装）时启用，注意可能会降低启动速度。 */
    useNpx: false,

    //copy配置
    /** 构建完成后是否自动复制行为包到游戏目录 */
    shouldCopyToGame: true,
    /** 游戏路径类型："win" 表示默认 Windows 路径，"custom" 表示自定义路径 */
    gamePathMode: "win",
    /** 自定义游戏路径（指向 development_behavior_packs 的上一级目录）
     * 仅当 gamePathMode 为 "custom" 时有效 */
    customGameRoot: "xxx",
    /** 行为包在 development_behavior_packs 中的文件夹名称 */
    behaviorPackFolderName: "sorterBE",
    /** 资源包在 development_resource_packs 中的文件夹名称 */
    resourcePackFolderName: undefined,

    //打包配置
    /** 自定义打包名，若未定义，则从manifest.json读取
     *
     * 如果有两个包，打包mcaddon，必须指定名字
     */
    packageName: "自动整理",
    /**
     *
     * @param {string} name
     * @param {[number,number,number]} version
     * @returns
     */
    buildName(name, version) {
        return name + "v" + version.join(",");
    },
    /** 是否启用二次 zip 压缩（用于上传蓝奏云等平台） */
    enableExtraZip: true,
    /** 打包文件名中是否包含版本号（版本号从 manifest.json 中读取） */
    includeVersionInName: true,
    /** 是否使用逗号格式的版本号如 v1,x,x 以兼容某些玩家导入问题 */
    useCommaStyleVersion: true,
};

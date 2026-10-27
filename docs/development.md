# SorterBE 开发文档

## 环境

- Node 26（最低 22.18，可直接 `node xxx.ts`）
- `@bepack/cli` 0.1.0-beta.6（项目本地依赖，`npx bepack`）
- ScriptAPI：`@minecraft/server` 2.10.0 / `@minecraft/server-ui` 2.2.0
- 依赖库：`sapi-pro` 0.4.3-stable

## 常用命令

| 命令 | 说明 |
|---|---|
| `npm run build` | 类型检查 + 构建到 `scripts/`、`dist/` |
| `npm run dev` | 开发监听 |
| `npm run pack` | 打包 `.mcpack` |
| `npm test` / `npm run test:watch` | 单元测试 |
| `npm run tools:new -- --to <版本>` | 查找新增物品 |
| `npm run tools:apply -- --version <版本>` | 生成排序表并记录版本 |
| `npm run tools:check` | 排序表一致性检查（`--fix` 自动修复） |
| `npm run tools:dict` | 更新本地 id 字典 |

## 项目结构

```
src/
  main.ts          入口（bepack 编译入口）
  config.ts        计分板数据与全局/用户配置
  constants.ts     语言、潜影盒/收纳袋 id、包信息
  lang.ts          语言树（8 种语言）
  ext.ts           logger
  sorter/
    index.ts       命令注册、事件订阅、调度器启动
    sort.ts        排序核心：读取容器 → 排序合并 → 放置；容器类型定义
    methods.ts     整理方法（ID 表 / 名称）与整理方向（Z / N）
    sortCommand.ts /r 的整理目标判定
    sorterUI.ts    菜单与配置表单
    scheduler.ts   定时整理背包
    profiler.ts    整理耗时统计
    compare.ts     特殊物品比较（药水）
  tables/          排序表（由 tools 生成，勿手改）
tools/             物品表工具与分类工程文件
test/              vitest 测试与运行时替身
```

线上目录 `/server/server1/development_behavior_packs/sorter-be` 本身就是服务器的开发包，`npm run build` 后 `scripts/` 直接生效；**重载/重启服务端前必须先取得确认**。

## 测试

```bash
npm test
npm run test:watch
```

基于 vitest。`@minecraft/server`、`sapi-pro` 等运行时模块由 `vitest.config.ts` 的别名指向 `test/stubs/` 下的替身，因此无需启动服务端。

- 被测逻辑若用到替身里没有的 API，需要同步补充 `test/stubs/`
- `test/helpers.ts` 提供 `FakeContainer`、`fakePlayer`、`item()`，容器读写按真实语义做拷贝

## 游戏更新后如何加新物品

预览版发布后就可以先跑起来，提前把新物品分好类；正式版发布后再补一次：

```bash
# 1. 预览版：列出新增物品并写入 tools/new_items.json（不改排序表）
npm run tools:new -- --to 1.26.60-preview.30

# 2. 正式版发布后：确认无遗漏，再生成分类表与时间序表
npm run tools:new -- --to 1.26.60
npm run tools:apply -- --version 1.26.60
npm run tools:check && npm test && npm run build
```

完整流程：

1. 查找新版本物品（自动对比官方 `@minecraft/vanilla-data`）：

   ```bash
   npm run tools:new -- --from 1.26.50 --to 1.26.60
   # 不传 --from 时使用 tools/update-state.json 里记录的已同步版本
   ```

   结果会打印待分类物品并写入 `tools/new_items.json`。

2. 打开 `tools/index.html`（自动加载 `vanilla.json` 与 `project.json`），把新物品拖进合适的分组，右上角「工程」导出覆盖 `tools/project.json`。

3. 生成表并追加时间序表：

   ```bash
   npm run tools:apply -- --version 1.26.60
   ```

   会重新生成 `src/tables/categorized.ts`，把新物品追加到 `src/tables/default.ts` 的 `//26.60新增`，并更新 `tools/update-state.json`。

4. 一致性检查：

   ```bash
   npm run tools:check
   # 分类表不一致时可加 --fix 自动重新生成
   ```

5. `npm run build` 重新构建。

> 其它：`npm run tools:dict` 更新本地字典（`--channel release` 使用正式版 id 表）。新版本若带来 ScriptAPI 更新，还需同步升级 `@minecraft/server` / `server-ui` 并在 `manifest.json` 中确认依赖版本。

## 如何自定义顺序

> 操作较为复杂，仅供开发人员参考

1. `npm run tools:dict` 下载最新 id 表到 `tools/vanilla.json`
2. 打开 `tools/index.html`，页面会自动加载该字典
3. 点击右上角导入 `tools/project.json`
4. 调整分类后导出，覆盖 `tools/project.json`（或直接执行 `npm run tools:apply -- --version <版本>` 自动生成表）
5. 需要在 `src/tables/index` 中新增一条顺序表时，引入生成的表即可
6. `npm run build` 重新构建

## 发布

1. 修改 `bepack.config.ts` 的 `version`
2. 在 `src/lang.ts` 的 `AboutFormLang.changeLog` 补充更新日志（中/英）
3. `npm run build`，确认 `manifest.json` 版本已更新
4. 提交并打 tag，推送 `origin`（GitHub），需要时同步 `gitee` 镜像

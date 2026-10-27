## SorterBE 自动整理

![Requires](https://img.shields.io/badge/基于-SAPI_Pro_v0.4.2_stable-blue) ![Support](https://img.shields.io/badge/支持-MCBE26.50+-green) [![1004513100](https://img.shields.io/badge/群-1004513100-red?&logo=qq)](https://qm.qq.com/q/YCQ7ohJpIc)

<img src="screenshot.jpg" width="350px">

### 简介

基岩版自动整理行为包，启用功能后打开容器即可自动整理。

行为包特点:

- 2 种整理方法, 2 种整理方向, 2 张排序表
- 支持手动键入命令整理
- 支持药水整理与实体整理
- bds 服务器兼容

### 下载

[下载最新版](https://gitee.com/ykxyx666_admin/sorter-be/releases/latest)
[查看全部版本](https://gitee.com/ykxyx666_admin/sorter-be/releases)

### 使用方法：

1. 在地图或服务器中加上行为包。
2. 进入游戏，聊天发送"/sorter"，即可在弹出 UI 中开启自动整理。
3. 对着容器，发送/r，可以手动整理；对着空气，发送/r 可以整理背包。
4. 对着末影箱，发送/r，或打开末影箱（开启自动整理时），可以整理自己的末影箱。

### 温馨提示:

漏斗不会被自动整理，只能输入/r 手动整理，不用担心你的分类机被搞坏了。

### 反馈与支持:

1. 如有 bug，请联系我反馈。游戏版本不对无法使用，不是 bug。
2. 如果你有附魔书的整理思路，我们可以再优化优化

### 开发相关

#### 测试

```bash
npm test          # 运行全部单元测试
npm run test:watch
```

测试基于 vitest，`@minecraft/server` 和 `sapi-pro` 由 `test/stubs/` 下的替身通过 `vitest.config.ts` 的别名注入，无需启动服务端。

#### 项目结构

- src:行为包代码
    - sorter: 自动整理主要逻辑
    - tables: 顺序表
    - db.ts: 用到的计分板
    - main.ts: 初始化
- tools: 用于生成 id 顺序表的相关工具
    - update.ts: 物品表更新工具（找新物品 / 生成分类表）
    - parse.ts: 旧版手动查找工具（保留）
    - index.html: 可视化分类拖拽工具
    - project.json: 分类结构（index.html 的工程文件）
    - vanilla.json: 本地 id 字典（由工具下载，不入库）

#### 游戏更新后如何加新方块

> 需要 Node 22.18+（本项目使用 Node 26，可直接 `node xxx.ts`）

预览版发布后就可以先跑起来，提前把新物品分好类；正式版发布后再补一次：

```bash
# 1. 预览版：列出新增物品并写入 new_items.json（不改排序表）
npm run tools:new -- --to 1.26.60-preview.30

# 2. 正式版发布后：确认无遗漏，再生成分类表与时间序表
npm run tools:new -- --to 1.26.60
npm run tools:apply -- --version 1.26.60
npm run tools:check && npm test && npm run build
```

1. 查找新版本的物品（会自动对比官方 `@minecraft/vanilla-data`）：

    ```bash
    npm run tools:new -- --from 1.26.50 --to 1.26.60
    # 不传 --from 时使用 tools/update-state.json 里记录的已同步版本
    ```

    结果会打印待分类物品并写入 `tools/new_items.json`。

2. 打开 `tools/index.html`（会各自加载 `vanilla.json` 与 `project.json`），把新物品从左侧拖进合适的分类，右上角「工程」导出覆盖 `tools/project.json`。

3. 生成表并追加时间序表：

    ```bash
    npm run tools:apply -- --version 1.26.60
    ```

    会重新生成 `src/tables/categorized.ts`，并把新物品追加到 `src/tables/default.ts` 的 `//26.60新增`，同时更新版本记录。

4. 检查一致性（分类表是否同步、是否有重复/漏项/改名的 id）：

    ```bash
    npm run tools:check
    # 分类表不一致时可加 --fix 自动重新生成
    ```

5. `npm run build` 重新构建。

> 其它命令：`npm run tools:dict` 更新本地字典（`--channel release` 使用正式版 id 表）。

#### 如何自定义顺序

> ps: 操作较为复杂，仅供开发人员参考

1. 执行 `npm run tools:dict` 下载最新 id 表 json 数据到 `tools/vanilla.json`
2. 打开 `tools/index.html` 网页，会自动加载 `tools/vanilla.json` 字典
3. 点击网页右上角导入，导入 `tools/project.json`。
4. 使用网页排序分类后导出为 JSONC，放到 `src/tables` 里面（或直接执行 `npm run tools:apply -- --version <版本>` 自动生成）
5. 在 `src/tables/index` 里面新增一条顺序表，引入自己生成的即可。
6. 使用 `npm run build` 重新构建

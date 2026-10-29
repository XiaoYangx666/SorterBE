# AGENTS.md

SorterBE 是 Minecraft 基岩版自动整理行为包，TypeScript 编写，用 bepack 构建。

## 事实速查

- 工具链：Bun 1.4.4+（包管理、测试、类型检查）；`bun install` / `bun test` / `bepack build`
- 类型检查走 `bun check`（`bepack.config.ts` 里配置），不需要 `typescript` 依赖
- 入口 `src/main.ts` → 构建产物 `scripts/`（**勿手改**脚本产物，改 `src/` 后重新构建）
- 运行时依赖：`@minecraft/server` 2.11.0、`@minecraft/server-ui` 2.3.0、`sapi-pro` 0.4.3-stable（均为精确版本）
- 构建后需要重载/重启服务端才生效，**必须先取得用户同意**
- 完整开发文档：`docs/development.md`

## 代码地图

- `src/sorter/sort.ts`：排序核心（读取容器 → 排序合并 → 放回），容器类型定义
- `src/sorter/index.ts`：命令注册、事件订阅、调度器启动
- `src/sorter/methods.ts`：整理方法（ID 表 / 名称）与方向（Z / N）
- `src/sorter/sortCommand.ts`：`/r` 的整理目标判定
- `src/sorter/sorterUI.ts`：菜单与配置表单
- `src/config.ts`：计分板数据、全局/用户配置
- `src/lang.ts`：8 种语言文案与更新日志
- `src/tables/`：排序表（由 `tools/` 生成，勿手改）

## 常用命令

```bash
bun run build    # 类型检查（bun check）+ 构建
bun test --isolate  # 单元测试（npm script `bun run test` 已含 --isolate）
bun run tools:check                          # 排序表一致性
bun run tools:new -- --to <版本>              # 查找新增物品
bun run tools:apply -- --version <版本>       # 生成排序表
```

## 约定

- 所有玩家可见文案写进 `src/lang.ts` 的 `defineLangTree`，保持 8 种语言齐全
- 新增全局配置项：`src/config.ts` 的 `GlobalConfig` + `sorterUI.ts` 表单字段 + 语言项 + 更新日志
- 改动排序/整理逻辑必须补 `test/` 用例；测试通过 `test/stubs/` 替身运行（`test/bun-preload.ts` 用 `mock.module` 注册），用到新 API 时同步补替身
- 测试用 `bun:test` 的 API，不要引入 vitest 专有写法（`vi.mock`、`vi.useFakeTimers` 等）
- 跑测试必须带 `--isolate`：bun test 默认所有测试文件共享同一模块注册表，`mock.module` 会串文件
- 发版：改 `bepack.config.ts` 的 `version`，并在 `src/lang.ts` 的 `AboutFormLang.changeLog` 补中英文日志
- 不要随手跑 `bepack install`：它会按 `stable` 标签解析并回写依赖版本
- Git：`origin` 是 GitHub（`XiaoYangx666/SorterBE`），`gitee` 为镜像；**未获指示不要 push**

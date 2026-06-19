## SorterBE 自动整理

![Requires](https://img.shields.io/badge/基于-SAPI_Pro_v0.4.1_stable-blue) ![Support](https://img.shields.io/badge/支持-MCBE26.30+-green) [![1004513100](https://img.shields.io/badge/群-1004513100-red?&logo=qq)](https://qm.qq.com/q/YCQ7ohJpIc)

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

### 温馨提示:

漏斗不会被自动整理，只能输入/r 手动整理，不用担心你的分类机被搞坏了。

### 反馈与支持:

1. 如有 bug，请联系我反馈。游戏版本不对无法使用，不是 bug。
2. 如果你有附魔书的整理思路，我们可以再优化优化

### 开发相关

#### 项目结构

- src:行为包代码
    - sorter: 自动整理主要逻辑
    - tables: 顺序表
    - db.ts: 用到的计分板
    - main.ts: 初始化
- tools: 用于生成 id 顺序表的相关工具

#### 如何自定义顺序

> ps: 操作较为复杂，仅供开发人员参考

1. 从这个网站下载 id 表 json 数据: [MCBEID 表](https://idlist.projectxero.top/)
2. 打开 `tools/index.html` 网页，点击左上角加载字典，将下载的 id 表导入
3. 点击网页右上角导入，导入 `tools/mc_items_project.json`。
4. 使用网页排序分类后导出为 JSONC，修改一下成 ts，放到 `src/tables` 里面
5. 在 `src/tables/index` 里面新增一条顺序表，引入自己生成的即可。
6. 使用`npm run build`重新构建

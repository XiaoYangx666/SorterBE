## SorterBE

[中文](README.md) | English

![Requires](https://img.shields.io/badge/Based_on-SAPI_Pro_v0.4.3_stable-blue) ![Support](https://img.shields.io/badge/Supports-MCBE_26.60+-green)

<img src="screenshot.jpg" width="350px">

### Overview

An auto-sort behavior pack for Minecraft Bedrock Edition. Once enabled, opening a container sorts it automatically.

Features:

- 2 sorting methods, 2 sorting directions, 2 order tables
- Merges partial stacks into full stacks
- Manual sorting with a command
- Potion-aware sorting and entity container sorting
- Works on BDS (Bedrock Dedicated Server)

### Download

[Latest release](https://github.com/XiaoYangx666/SorterBE/releases/latest)
[All releases](https://github.com/XiaoYangx666/SorterBE/releases)
[Gitee mirror](https://gitee.com/ykxyx666_admin/sorter-be)

### Usage

1. Add the behavior pack to your world or server.
2. Run `/sorter` in chat to enable auto-sort from the UI.
3. Aim at a container and run `/r` to sort it manually; aim at air and run `/r` to sort your inventory.
4. Aim at an ender chest and run `/r` to sort your ender chest. Auto-sort on open is off by default (ender chests can only be read slot by slot, which is slower); enable it in the global config if needed.

### Notes

Hoppers are never auto-sorted; use `/r` to sort them manually, so your sorting machines won't be broken.

### Feedback

Report bugs via GitHub issues. Using an unsupported game version is not a bug.

### Development

Build, test, item table update and release workflows are documented in [docs/development.md](docs/development.md).

# 构建与实现 / Build and implementation

## 普通玩家 / Players

直接使用 [README 的下载与安装步骤](../README.md#下载与安装)。不需要安装开发工具。

Use the install archive linked from the README. Development tools are not needed to play.

## 仓库内容 / Repository contents

| 路径 / Path | 用途 / Purpose |
| --- | --- |
| `source/DreamBody.js` | 背包虚拟道具、场景判断、往返过场与恢复 / virtual item, conditions, cinematics and restoration |
| `source/DreamBodyText.js` | 跟随界面语言的 16 种文本 / 16 UI-language text variants |
| `source/DreamBodyDebug.js` | 固定日志路径、有大小限制、失败不阻断玩法 / bounded, non-fatal logging |
| `source/*.test.cjs` | 带模拟游戏接口的行为测试 / behavior checks with mocked game APIs |
| `patches/NewInventory.patch` | 对原版背包脚本的最小接入补丁 / integration patch for the stock inventory script |
| `tools/build.py` | 从源码重建 JavaScript PAK，再与已发布的美术资源一起封装 / rebuild the script PAK and package it with released cooked assets |
| `downloads/` | 可直接安装的版本化 ZIP / versioned install archive |

补丁将梦中身加入背包的显示列表，使用时调用模组逻辑；没有调用永久发放道具或存档写入接口。场景转换复用原版坍塌序列，保留当前玩家角色，并在离场时恢复位置、朝向和光照。临时过场人物使用原版空手站立循环。输入暂停令牌只在过场期间持有，并在结束或异常路径释放；另有基于真实时间的超时兜底。

The patch adds a view-only inventory entry and dispatches its use action to the mod. It does not grant a persistent item or call save-writing APIs. Transitions reuse the original collapse sequence and retain the current playable pawn. Position, orientation and lighting are restored on exit. A temporary cinematic actor uses the original unarmed idle. Input suspension is scoped to the cinematic and released on completion or failure, with a wall-clock timeout fallback.

## 源码检查 / Source checks

安装 Node.js 后，在仓库根目录运行：

```powershell
node source/movie-idle.test.cjs
node source/movie-input.test.cjs
node source/debug-log.test.cjs
```

这些检查覆盖过场人物延迟生成、重生成、动画实例被重建后的站姿恢复、真实玩家网格隔离、输入暂停的成对释放、游戏计时暂停时的超时处理，以及日志轮换、容量和写入失败。测试使用模拟接口，不会启动游戏或访问存档。

These tests exercise delayed cinematic spawns, actor replacement, animation-instance recovery, isolation from the playable mesh, balanced input cleanup, a paused game clock, and log rotation/size/write failures. They use mocks, do not launch the game and do not access saves.

## 重建脚本包 / Rebuild the script package

开发环境 / Development requirements:

- Windows、Python 3.10+、Node.js 与 Git。
- 你自己的 Steam 构建号 **26266538** 的原始 `UI/Widget/NewInventory.js`，通过合法的本地资源提取流程取得；仓库不提供完整原版脚本、游戏密钥或存档。
- UnrealPak（本次验证使用 UE 5.8 自带工具）。
- 本仓库的安装 ZIP，作为已编译的 4K 纹理和道具数据表输入。

You need Windows, Python 3.10+, Node.js, Git, UnrealPak (validated with UE 5.8 tooling), the install archive, and an unmodified `NewInventory.js` extracted from your own matching game build. The repository does not include the complete stock script, game encryption keys or save data.

```powershell
# 先验证原版脚本与补丁 / Validate the stock script and patch first
python tools/build.py --inventory 'D:\local-extract\UI\Widget\NewInventory.js' --check-only

# 重建 / Build
python tools/build.py `
  --inventory 'D:\local-extract\UI\Widget\NewInventory.js' `
  --unrealpak 'D:\UnrealEngine\Engine\Binaries\Win64\UnrealPak.exe' `
  --base-archive 'downloads\Dreambody-v1.0.0-4K.zip' `
  --output 'dist\Dreambody-custom.zip'
```

把示例路径替换为本机路径。脚本会检查原版背包文件的 SHA-256，运行测试、应用补丁、构建并校验 PAK，最后复制基础包内的 `.utoc` / `.ucas`，输出安装 ZIP。它不会安装模组或写入游戏目录，也不会覆盖已存在的输出包。

Replace the example paths with your own. The script checks the stock file hash, runs tests, applies the patch, builds and validates the PAK, and reuses the base archive's `.utoc` / `.ucas` to produce an install ZIP. It does not install the mod, write to the game directory or overwrite an existing output archive.

**构建范围 / Build scope:** 这是脚本部分的源码构建流程。IoStore 内的纹理和道具数据表使用已发布的 cooked 资源，尚未提供从空白 Unreal 工程完整重做这些资源的工程文件。不能将此流程描述为所有二进制资源的完全从零构建。

This rebuilds the script portion from source. The texture and inventory table reuse released cooked IoStore assets; a complete Unreal project for recreating those assets from scratch is not included. This is not a from-scratch build of every binary asset.

## 纹理与封装 / Texture and containers

铜镜基于原图超分辨率放大至 4096 × 4096，BC7 编码并保留 alpha。它是放大的美术资源，不是原生绘制的 4K。原图及 4K PNG 可在 `art/` 获取。安装包中的 `.pak` 提供四个 JavaScript 文件；`.utoc` / `.ucas` 提供纹理和道具表资源。发布时使用 [retoc](https://github.com/trumank/retoc) 校验 IoStore 容器。

The mirror was upscaled to 4096 × 4096 and compressed as BC7 with alpha. It is upscaled artwork, not a native 4K painting. Original and 4K PNGs are in `art/`. The PAK contains four JavaScript files; the IoStore pair contains the texture and inventory table. Release containers were verified with retoc.

## 验证边界 / Verification limits

自动化测试不能代替实机检查。修改过场、场景判定或背包布局后，应使用独立测试存档确认入梦、移动、离梦、双向站姿和输入恢复。发布前还应检查包内仅包含预期文件，源码和封装内容一致，且没有存档、私人日志、密钥或开发工具。

After changing transitions, conditions or UI layout, use a separate test save to check entry, movement, exit, both idle poses and restored input. Before publishing, verify archive contents and source/package consistency, and exclude saves, private logs, keys and development binaries.

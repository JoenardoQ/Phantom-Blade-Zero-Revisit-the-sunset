# 更新记录 / Changelog

## v1.0.0 — 2026-11-04

首个 GitHub 发布版，整理自已确认可用的 4K 修正版。

- 跨存档的「梦中身」背包道具；少主战后在湖畔升降梯出口附近使用。
- 进入倒放、离开正放原版坍塌动画，返回使用道具时的位置。
- 入场和出场均复用魂的原版站姿，处理过场人物延迟生成和动画实例重建。
- 过场输入暂时屏蔽与异常清理；暂停游戏计时后仍有效的超时兜底。
- 铜镜贴图升级到 4096 × 4096 BC7，保留透明通道与受限的界面显示尺寸。
- 更新道具说明以及 16 种语言文本；自动跟随游戏界面语言。
- 独立的有大小限制的调试日志。

This first GitHub release packages the accepted 4K build: a reusable cross-save inventory item, reverse entry and forward exit cinematics, return to the activation position, idle-pose fixes for both directions, scoped input suspension and timeout cleanup, a transparent 4096 × 4096 mirror texture, updated text in 16 languages, and bounded diagnostic logs.

For this publication, only the archive's installation notes were refreshed. The three installed game-mod files are byte-identical to the accepted 4K package.

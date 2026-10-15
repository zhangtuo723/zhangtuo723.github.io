# 第三方资源与参考

`design/character-generation/` 中的人物参考图由 Codex 图像工具生成，保留同一虚构人物的设计方向。这些是图生 3D 的设计输入，不是实际三维网格渲染；图片与制作文档不包含第三方人物模型或参考项目的个人资产。

| 资源                       | 版本与来源                                                                                             | 许可                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| Three.js                   | 0.170.0，`assets/vendor/three.module.min.js`，[官方仓库](https://github.com/mrdoob/three.js/tree/r170) | [MIT](assets/vendor/THREE-LICENSE.txt)                   |
| Space Grotesk Latin Medium | @fontsource/space-grotesk 5.1.1，[Fontsource](https://github.com/fontsource/fontsource)                | [SIL Open Font License 1.1](assets/FONT-LICENSE.txt)     |
| Mansalva Latin Regular     | @fontsource/mansalva 5.1.1，[Fontsource](https://github.com/fontsource/fontsource)                     | [SIL Open Font License 1.1](assets/MANSALVA-LICENSE.txt) |

Three.js 与 Space Grotesk 从版本固定的 jsDelivr npm 资源获取。Mansalva 从 npm registry 获取，并对照 registry 的 `dist.integrity` 验证 SHA-512。保留原始许可证文件。

`avatar.js`、角色动作和镜头路径为本项目原创程序化实现；`assets/character-poster.webp`、`assets/social-cover.jpg`、`assets/neural-sculpture.webp` 与 `assets/modular-tools.webp` 来自本任务中的原创图像生成。它们不包含参考项目作者的肖像、模型、Logo 或作品图片。

设计研究参考：[dayinji/sen-3d-resume](https://github.com/dayinji/sen-3d-resume)。其 [NOTICE](https://github.com/dayinji/sen-3d-resume/blob/main/NOTICE) 将作者个人模型与素材排除在 MIT 授权之外，本项目未纳入这些素材。

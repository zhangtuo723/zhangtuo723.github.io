# 第三方资源与设计记录

## 运行时资源

| 资源                       | 版本与来源                                                                                                                                                             | 许可                                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Three.js 核心              | 0.170.0，`assets/vendor/three.module.min.js`，[官方 r170](https://github.com/mrdoob/three.js/tree/r170)                                                                | [MIT](assets/vendor/THREE-LICENSE.txt)                                                                 |
| RoundedBoxGeometry         | Three.js r170 官方 `examples/jsm/geometries/RoundedBoxGeometry.js`，保存在 `assets/vendor/geometries/`                                                                 | [MIT](assets/vendor/THREE-LICENSE.txt)                                                                 |
| RoomEnvironment            | Three.js r170 官方 `examples/jsm/environments/RoomEnvironment.js`，保存在 `assets/vendor/environments/`                                                                | [MIT](assets/vendor/THREE-LICENSE.txt)                                                                 |
| BufferGeometryUtils        | Three.js r170 官方 `examples/jsm/utils/BufferGeometryUtils.js`，合并设备网格并供 GLTFLoader 使用                                                                       | [MIT](assets/vendor/THREE-LICENSE.txt)                                                                 |
| GLTFLoader                 | Three.js r170 官方 `examples/jsm/loaders/GLTFLoader.js`，保存在 `assets/vendor/loaders/`                                                                               | [MIT](assets/vendor/THREE-LICENSE.txt)                                                                 |
| RobotExpressive            | Quaternius / Tomás Laulhé；Don McCurdy 添加表情与格式优化；[Three.js r170 分发目录](https://github.com/mrdoob/three.js/tree/r170/examples/models/gltf/RobotExpressive) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)；原作者说明随模型保存于 `assets/models/` |
| Space Grotesk Latin Medium | @fontsource/space-grotesk 5.1.1，[Fontsource](https://github.com/fontsource/fontsource)                                                                                | [SIL Open Font License 1.1](assets/FONT-LICENSE.txt)                                                   |
| Mansalva Latin Regular     | @fontsource/mansalva 5.1.1，[Fontsource](https://github.com/fontsource/fontsource)                                                                                     | [SIL Open Font License 1.1](assets/MANSALVA-LICENSE.txt)                                               |

核心库与 Space Grotesk 从固定版本的 jsDelivr npm 资源获取。Mansalva 从 npm registry 获取，并对照 registry 的 `dist.integrity` 验证 SHA-512。Three.js 附加模块来自同版本官方发布内容，源文件未改，通过 import map 解析 `three`。仓库保留原始许可证文件，访问本站不需要从这些上游地址下载资源。

## 本项目场景与图像

- `workshop.js` 中的科技工厂、四个项目区、中央调度台、轮式服务机器人、画布纹理和局部动画，以及 `scene.js` 的镜头编排，均为本项目编写。`factory-props.js` 提供服务器机架、显示器、办公设备、传送装置与工业机械臂等程序化设备。
- 服务机器人和工业机械臂使用原创机械几何、预设路线或预设动作，不依赖三维角色生成服务。显示屏与设备动画均为本地场景演示，没有接入存储后端、真实机器人控制、智能寻路、Agent 决策或在线模型训练。
- `factory-robot.js` 加载的实验区迎宾机器人使用上述 RobotExpressive GLB，调整主壳配色、比例与摆放，使用模型自带的骨骼、面部 morph 和动画。原 GLB 为 463,988 bytes，SHA-256：`047f5e5fb3bb6d378bd1df16ca6137f2a596c99b3a1b5690b4020c05aaf6f319`。没有外部图片或纹理依赖；GLB 和原作者说明按 r170 固定版本保存。
- `assets/workshop-poster.webp`、`assets/workshop-mobile.webp` 与 `assets/social-cover.jpg` 来自当前科技工厂的渲染截图；静态展示使用相同布局与冷色配色，不能沿用此前桌面模型或暖色工作室的截图，也不以人物概念图替代三维输出。
- `assets/modular-tools.webp` 与 `assets/neural-sculpture.webp` 由 Codex 图像工具生成并压缩，作为项目概念封面，不是产品截图。
- `design/character-generation/` 是此前人物方案的历史设计资料。其中人物参考图由 Codex 图像工具生成，是虚构角色的图生三维输入，不是已完成的三维网格或本人肖像拟合结果；当前工厂不依赖这套资料。

本站没有纳入写实人物肖像或三维人物生成服务的输出。

## 历史参考

曾研究 [dayinji/sen-3d-resume](https://github.com/dayinji/sen-3d-resume) 的滚动叙事方式。其 [NOTICE](https://github.com/dayinji/sen-3d-resume/blob/main/NOTICE) 将作者个人模型与素材排除在 MIT 授权之外；本项目未使用这些模型、个人履历、品牌素材或环境贴图。

`jds110.xyz` 由用户提供作进一步参考，但本次环境无法访问核实，未将其截图、模型或代码纳入本仓库，也不声称复现其页面。

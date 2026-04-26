# zhangtuo — 个人作品集

像素风静态网站，托管于 GitHub Pages。

🔗 **在线地址**: https://zhangtuo723.github.io

---

## 项目简介

这是我的个人作品集网站，展示我的项目、技能和联系方式。

风格采用 **复古像素风** —— 直角边框、纯色配色、CRT 扫描线、Press Start 2P 像素字体，配合 Canvas 像素粒子背景和点击二进制爆炸特效。

---

## 技术栈

- **HTML5** — 纯静态页面，无框架
- **Tailwind CSS (CDN)** — 原子化 CSS，通过 CDN 引入
- **原生 JavaScript** — Canvas 粒子动画、交互特效
- **Google Fonts** — Press Start 2P / VT323

---

## 页面结构

```
├── index.html      # 首页 / Hero
├── about.html      # 关于 / 技能栈
├── projects.html   # 项目作品
├── contact.html    # 联系方式
├── bg.js           # Canvas 像素粒子背景 + 点击特效
└── README.md       # 本文件
```

---

## 本地运行

无需构建工具，直接用浏览器打开 HTML 文件即可：

```bash
# macOS
open index.html

# 或者启动本地服务器
python3 -m http.server 8080
# 然后访问 http://localhost:8080
```

---

## 特色效果

- **像素粒子背景** — Canvas 绘制的 1-2px 方块粒子，带虚线连线
- **CRT 扫描线** — 全局 CSS 覆盖层模拟复古显示器
- **点击爆炸** — 鼠标点击时生成 "0" / "1" 二进制字符粒子，带重力下落
- **像素交互** — 按钮/卡片悬停时有像素级偏移阴影
- **像素角标** — 页面四角装饰性边框角标

---

## 项目展示

| 项目 | 链接 | 状态 |
|---|---|---|
| ForgeKit | [GitHub](https://github.com/zhangtuo723/ForgeKit) / [官网](https://forgekit.cn/zh) | 已上线 |
| 小红书爆款分析助手 | [GitHub](https://github.com/zhangtuo723/hot_analysis_plugin) | 开源 |

---

## 联系

- 📧 邮箱: 1605728334@qq.com
- 💻 GitHub: [@zhangtuo723](https://github.com/zhangtuo723)

---

*© 2026 zhangtuo*

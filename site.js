(() => {
  "use strict";
  const root = document.documentElement;
  const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
  const read = (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const save = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* Optional storage. */
    }
  };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const motionButton = document.querySelector("[data-motion-toggle]");
  const viewButton = document.querySelector("[data-view-toggle]");
  const host = document.getElementById("portrait-scene");
  let preference = read("resume-motion");
  let plain =
    new URLSearchParams(location.search).get("view") === "plain" ||
    read("resume-view") === "plain";
  let motion = false;
  let scene, scenePromise, tick;
  let sceneRunning = false;
  let active = true;

  const menuButton = document.querySelector("[data-menu-toggle]");
  const navigation = document.querySelector("[data-navigation]");
  function setMenu(open) {
    if (!menuButton || !navigation) return;
    navigation.classList.toggle("is-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute(
      "aria-label",
      open ? "关闭导航菜单" : "打开导航菜单",
    );
  }
  if (menuButton && navigation) {
    menuButton.hidden = false;
    root.classList.add("has-js");
    menuButton.addEventListener("click", () =>
      setMenu(menuButton.getAttribute("aria-expanded") !== "true"),
    );
    navigation.addEventListener("click", (e) => {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("click", (e) => {
      if (
        !e.target.closest("[data-navigation]") &&
        !e.target.closest("[data-menu-toggle]")
      )
        setMenu(false);
    });
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        menuButton.getAttribute("aria-expanded") === "true"
      ) {
        setMenu(false);
        menuButton.focus();
      }
    });
    matchMedia("(min-width: 761px)").addEventListener("change", () =>
      setMenu(false),
    );
  }

  const gallery = document.querySelector("[data-gallery]");
  const track = document.querySelector("[data-gallery-track]");
  let distance = 0,
    enhanced = false;
  function measureGallery() {
    if (!gallery || !track) return;
    gallery.dataset.enhanced = "false";
    track.style.removeProperty("--gallery-x");
    gallery.style.removeProperty("--gallery-distance");
    distance = Math.max(0, track.scrollWidth - track.clientWidth);
    enhanced = motion && !plain && innerWidth >= 900 && distance > 1;
    gallery.dataset.enhanced = String(enhanced);
    gallery.style.setProperty(
      "--gallery-distance",
      `${enhanced ? distance : 0}px`,
    );
    if (enhanced) track.scrollLeft = 0;
    updateScroll();
  }
  function getProgress() {
    const y = scrollY;
    const top = (id, fallback) => {
      const el = document.getElementById(id);
      return el ? el.getBoundingClientRect().top + y : fallback;
    };
    const journey = Math.max(1, top("journey", innerHeight));
    const works = Math.max(
      journey + 1,
      top("works", journey + innerHeight * 2),
    );
    const contact = Math.max(works + 1, top("contact", works + innerHeight));
    const end = Math.max(contact + 1, root.scrollHeight - innerHeight);
    const stops = [
      [0, 0],
      [journey, 0.22],
      [works, 0.62],
      [contact, 0.9],
      [end, 1],
    ];
    for (let i = 1; i < stops.length; i++) {
      if (y <= stops[i][0])
        return (
          stops[i - 1][1] +
          clamp((y - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0])) *
            (stops[i][1] - stops[i - 1][1])
        );
    }
    return 1;
  }
  function updateScroll() {
    tick = 0;
    const progress = getProgress();
    scene?.setScroll(progress);
    root.style.setProperty(
      "--hero-opacity",
      String(plain ? 1 : clamp(1 - scrollY / Math.max(1, innerHeight * 0.65))),
    );
    const worksTop =
      document.getElementById("works")?.getBoundingClientRect().top ?? Infinity;
    const contactTop =
      document.getElementById("contact")?.getBoundingClientRect().top ??
      Infinity;
    document.body.dataset.phase =
      contactTop <= 80
        ? "contact"
        : worksTop <= 80
          ? "works"
          : progress < 0.18
            ? "hero"
            : "journey";
    const shouldRun = motion && !plain && worksTop > 0;
    if (scene && sceneRunning !== shouldRun) {
      sceneRunning = shouldRun;
      scene.setMotion(shouldRun);
    }
    root.style.setProperty("--scroll-progress", String(progress));
    if (!gallery || !track) return;
    let fraction;
    if (enhanced) {
      fraction = clamp(
        -gallery.getBoundingClientRect().top /
          Math.max(1, gallery.offsetHeight - innerHeight),
      );
      track.style.setProperty("--gallery-x", `${-fraction * distance}px`);
    } else
      fraction = clamp(
        track.scrollLeft / Math.max(1, track.scrollWidth - track.clientWidth),
      );
    const indicator = document.querySelector("[data-gallery-progress]");
    if (indicator) indicator.style.transform = `scaleX(${fraction})`;
  }
  const queueScroll = () => {
    if (!tick) tick = requestAnimationFrame(updateScroll);
  };
  window.addEventListener("scroll", queueScroll, { passive: true });
  track?.addEventListener("scroll", queueScroll, { passive: true });
  window.addEventListener("resize", measureGallery);
  window.addEventListener("load", measureGallery, { once: true });
  document.fonts?.ready.then(measureGallery);
  track?.addEventListener("focusin", (event) => {
    if (!enhanced) return;
    const card = event.target.closest(
      ".work-card, .project-card, [data-work-card]",
    );
    if (!card) return;
    const bounds = card.getBoundingClientRect();
    if (bounds.left >= 0 && bounds.right <= innerWidth) return;
    const fraction = clamp(
      (bounds.left - track.getBoundingClientRect().left) /
        Math.max(1, distance),
    );
    window.scrollTo({
      top:
        gallery.getBoundingClientRect().top +
        scrollY +
        fraction * Math.max(1, gallery.offsetHeight - innerHeight),
      behavior: "instant",
    });
  });

  async function ensureScene() {
    if (!host || !active) return;
    if (!scenePromise)
      scenePromise = import("./scene.js")
        .then(({ createScene }) => {
          if (active) scene = createScene(host);
        })
        .catch(() => {
          host.dataset.state = "fallback";
        });
    await scenePromise;
    scene?.setScroll(getProgress());
    updateScroll();
  }
  function applyPreferences() {
    motion = preference === "on" || (preference !== "off" && !reduced.matches);
    root.dataset.motion = motion ? "on" : "off";
    root.dataset.view = plain ? "plain" : "immersive";
    if (motionButton) {
      motionButton.hidden = false;
      motionButton.setAttribute("aria-pressed", String(motion));
      motionButton.setAttribute(
        "aria-label",
        motion ? "关闭动态效果" : "开启动态效果",
      );
      motionButton
        .querySelector("[data-motion-label]")
        ?.replaceChildren(motion ? "动态 开" : "动态 关");
    }
    if (viewButton) {
      viewButton.hidden = false;
      viewButton.setAttribute("aria-pressed", String(plain));
      viewButton
        .querySelector("[data-view-label]")
        ?.replaceChildren(plain ? "进入 3D 版" : "阅读普通版");
    }
    if (motion && !plain) ensureScene();
    else {
      scene?.setMotion(false);
      sceneRunning = false;
    }
    measureGallery();
  }
  motionButton?.addEventListener("click", () => {
    preference = motion ? "off" : "on";
    save("resume-motion", preference);
    applyPreferences();
  });
  viewButton?.addEventListener("click", () => {
    plain = !plain;
    save("resume-view", plain ? "plain" : "immersive");
    applyPreferences();
  });
  reduced.addEventListener("change", applyPreferences);
  applyPreferences();

  const workData = {
    forgekit: {
      title: "ForgeKit",
      category: "01 / DEVELOPER TOOLS",
      intro:
        "一套纯浏览器端的开发者在线工具箱，让开发过程中的琐碎问题，在一个地方解决。",
      heading: "打开即用，让工具回到工具本身。",
      body: "把实用的开发工具收进浏览器，无需在多个站点和应用之间来回切换。项目关注轻量的使用体验与本地数据处理，让数据不离开浏览器。",
      points: [
        "纯浏览器端使用，关注数据隐私",
        "React 与 TypeScript 构建交互",
        "以 PWA 形式探索随手可用的工具体验",
      ],
      tags: ["React", "TypeScript", "PWA"],
      image: "assets/modular-tools.webp",
      alt: "银白与绿色模块构成的工具系统概念图",
      links: [
        ["打开 ForgeKit", "https://forgekit.cn/zh"],
        ["查看源码", "https://github.com/zhangtuo723/ForgeKit"],
      ],
    },
    analysis: {
      title: "小红书爆款分析助手",
      category: "02 / AI AGENTS",
      intro: "用对话提出问题，让 Agent 自动操控浏览器，分析内容背后的规律。",
      heading: "从一条指令，走到一份内容洞察。",
      body: "把浏览器操作、数据收集和内容分析串成一个 Agent 工作流。围绕 Top 笔记的内容、评论与视频进行分析，输出可视化的爆款规律报告。",
      points: [
        "对话驱动的内容分析工作流",
        "自动操控浏览器收集相关信息",
        "结合笔记、评论与视频进行综合分析",
      ],
      tags: ["Python", "AI Agent", "Browser Automation"],
      image: "assets/neural-sculpture.webp",
      alt: "金属与绿色玻璃交织的智能系统概念图",
      links: [
        [
          "查看 GitHub 项目",
          "https://github.com/zhangtuo723/hot_analysis_plugin",
        ],
      ],
    },
    flappy: {
      title: "FlappyBird Q-learning",
      category: "03 / REINFORCEMENT LEARNING",
      intro: "用一个熟悉的小游戏，把强化学习中的状态、动作和奖励连接起来。",
      heading: "在一次次尝试中，理解学习如何发生。",
      body: "使用 PyTorch 实现 Flappy Bird 强化学习入门项目。以简洁的代码探索 Q-learning / DQN 的核心概念，让抽象的学习过程有一个直观的观察窗口。",
      points: [
        "围绕状态、动作与奖励建立训练过程",
        "理解 Q-learning 与 DQN 的核心关系",
        "将 PyTorch 与小游戏环境结合",
      ],
      tags: ["Python", "PyTorch", "Q-learning / DQN"],
      links: [
        [
          "查看 GitHub 项目",
          "https://github.com/zhangtuo723/FlappyBird_Qlearning",
        ],
      ],
    },
    poetry: {
      title: "Qwen3 唐诗生成",
      category: "04 / LANGUAGE & IMAGINATION",
      intro: "当语言模型遇见古典诗意，探索模型微调与风格化文本生成。",
      heading: "让语言技术，触碰另一种想象力。",
      body: "基于 Hugging Face 数据集，对 Qwen3-0.6B 进行 LoRA 微调。以唐诗风格文本为目标，尝试把语言模型的能力与特定的表达方式连接起来。",
      points: [
        "以 Qwen3-0.6B 作为基础模型",
        "使用 LoRA 进行参数高效微调",
        "探索唐诗风格的文本生成",
      ],
      tags: ["Python", "LoRA", "Qwen3"],
      links: [
        [
          "查看 GitHub 项目",
          "https://github.com/zhangtuo723/qwen3_poetry_generation",
        ],
      ],
    },
  };
  const dialog = document.getElementById("work-dialog");
  let returnFocus,
    previousOverflow = "";
  const closeDialog = () => {
    if (dialog?.open) dialog.close();
  };
  document.querySelectorAll("[data-work]").forEach((button) => {
    button.hidden = false;
    button.addEventListener("click", () => {
      const data = workData[button.dataset.work];
      const detail = document.getElementById("work-detail");
      if (!dialog || !detail || !data) return;
      returnFocus = button;
      detail.innerHTML = `<p class="detail-category">${data.category}</p><h2 id="work-title">${data.title}</h2><p class="detail-intro">${data.intro}</p>${data.image ? `<figure><img src="${data.image}" alt="${data.alt}" width="1536" height="1024"><figcaption>项目概念视觉</figcaption></figure>` : ""}<h3>${data.heading}</h3><p>${data.body}</p><ul>${data.points.map((point) => `<li>${point}</li>`).join("")}</ul><div class="detail-tags">${data.tags.map((tag) => `<span>${tag}</span>`).join("")}</div><div class="detail-links">${data.links.map(([label, url]) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`).join("")}</div>`;
      dialog.setAttribute("aria-labelledby", "work-title");
      previousOverflow = document.body.style.overflow;
      dialog.showModal();
      document.body.style.overflow = "hidden";
      dialog.querySelector("[data-close-dialog]")?.focus();
    });
  });
  dialog
    ?.querySelector("[data-close-dialog]")
    ?.addEventListener("click", closeDialog);
  dialog?.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog();
  });
  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });
  dialog?.addEventListener("close", () => {
    document.body.style.overflow = previousOverflow;
    returnFocus?.focus({ preventScroll: true });
  });

  const copyButton = document.querySelector("[data-copy-email]");
  if (copyButton) copyButton.hidden = false;
  copyButton?.addEventListener("click", async () => {
    const email = document.querySelector("[data-email-address]");
    const status = document.querySelector("[data-copy-status]");
    if (!email || !status) return;
    try {
      await navigator.clipboard.writeText(email.textContent.trim());
      status.textContent = "邮箱已复制。";
    } catch {
      const range = document.createRange();
      range.selectNodeContents(email);
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = "已选中邮箱，请手动复制。";
    }
  });
  window.addEventListener("pagehide", (event) => {
    if (event.persisted) {
      scene?.setMotion(false);
      sceneRunning = false;
    } else {
      active = false;
      scene?.dispose();
    }
  });
  window.addEventListener("pageshow", () => {
    active = true;
    applyPreferences();
  });
})();

(() => {
  "use strict";
  const root = document.documentElement;
  const host = document.getElementById("world-scene");
  const dialog = document.getElementById("work-dialog");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
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
  const motionButton = document.querySelector("[data-motion-toggle]");
  const viewButton = document.querySelector("[data-view-toggle]");
  const demoButton = document.querySelector("[data-run-demo]");
  const demoStatus = document.querySelector("[data-demo-status]");
  const sceneLabel = document.querySelector("[data-scene-label]");
  const sceneProgress = document.querySelector("[data-scene-progress]");
  const stepNumber = document.querySelector("[data-step-number]");
  const menuButton = document.querySelector("[data-menu-toggle]");
  const navigation = document.querySelector("[data-navigation]");
  const chapters = [...document.querySelectorAll("[data-scene-step]")];
  const labels = {
    home: "AI 科技工厂 · 总览",
    about: "中央调度 · 关于我",
    forgekit: "工具生产区 · ForgeKit",
    analysis: "数据分析区 · 内容洞察",
    flappy: "机器人实验区 · 强化学习",
    poetry: "模型创作区 · 唐诗生成",
    contact: "新的想法 · 从这里开始",
  };
  let preference = read("resume-motion");
  let plain =
    new URLSearchParams(location.search).get("view") === "plain" ||
    read("resume-view") === "plain";
  let motion = false,
    active = true,
    scene,
    scenePromise,
    sceneRunning = null,
    frame = 0,
    stops = [],
    currentStep = "home",
    hoverStep = null,
    demoTimer = 0;

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
    root.classList.add("has-js");
    menuButton.hidden = false;
    menuButton.addEventListener("click", () =>
      setMenu(menuButton.getAttribute("aria-expanded") !== "true"),
    );
    navigation.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenu(false);
    });
    document.addEventListener("click", (event) => {
      if (!event.target.closest("[data-navigation], [data-menu-toggle]"))
        setMenu(false);
    });
    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
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
  function measure() {
    const maximum = Math.max(1, root.scrollHeight - innerHeight);
    stops = chapters.map((element) => ({
      element,
      id: element.id,
      p: Number(element.dataset.progress),
      top: clamp(element.getBoundingClientRect().top + scrollY, 0, maximum),
    }));
    updateScroll();
  }
  function getProgress() {
    if (!stops.length) return 0;
    for (let i = 1; i < stops.length; i++) {
      if (scrollY <= stops[i].top) {
        const a = stops[i - 1],
          b = stops[i];
        return (
          a.p +
          clamp((scrollY - a.top) / Math.max(1, b.top - a.top)) * (b.p - a.p)
        );
      }
    }
    return stops.at(-1).p;
  }
  function updateLabel() {
    if (sceneLabel)
      sceneLabel.textContent = labels[hoverStep || currentStep] || labels.home;
  }
  function syncSceneMotion() {
    const covered =
      document.getElementById("contact")?.getBoundingClientRect().top <= 100;
    const shouldRun = motion && !plain && !dialog?.open && !covered;
    if (scene && shouldRun !== sceneRunning) {
      sceneRunning = shouldRun;
      scene.setMotion(shouldRun);
    }
  }
  function updateScroll() {
    frame = 0;
    const progress = getProgress();
    scene?.setScroll(progress);
    root.style.setProperty("--scroll-progress", String(progress));
    if (sceneProgress) sceneProgress.style.transform = `scaleX(${progress})`;
    const near = Math.min(
      stops.length - 1,
      Math.max(
        0,
        stops.reduce(
          (index, stop, i) =>
            scrollY + innerHeight * 0.38 >= stop.top ? i : index,
          0,
        ),
      ),
    );
    currentStep = stops[near]?.id || "home";
    document.body.dataset.phase = currentStep;
    chapters.forEach((chapter) =>
      chapter.classList.toggle("is-active", chapter.id === currentStep),
    );
    document.querySelectorAll("[data-station]").forEach((button) => {
      if (button.dataset.station === currentStep)
        button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    if (stepNumber)
      stepNumber.textContent = `${String(near + 1).padStart(2, "0")} / ${String(chapters.length).padStart(2, "0")}`;
    syncSceneMotion();
    updateLabel();
  }
  function queueScroll() {
    if (!frame) frame = requestAnimationFrame(updateScroll);
  }
  function goTo(id) {
    const element = document.getElementById(id);
    if (!element) return;
    const top = element.getBoundingClientRect().top + scrollY;
    window.scrollTo({ top, behavior: motion && !plain ? "smooth" : "instant" });
    setMenu(false);
  }
  document.querySelectorAll("[data-station]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      goTo(button.dataset.station);
    });
  });
  async function ensureScene() {
    if (!host || !active || plain || !motion) return;
    if (!scenePromise) {
      scenePromise = import("./scene.js")
        .then(async ({ createScene }) => {
          if (!active || plain || !motion) return;
          const controller = await createScene(host, {
            onSelect: (id) => goTo(id),
            onHover: (id) => {
              hoverStep = id;
              updateLabel();
            },
          });
          if (!active) {
            controller.dispose();
            return;
          }
          scene = controller;
          sceneRunning = null;
          scene.setScroll(getProgress());
          syncSceneMotion();
        })
        .catch(() => {
          host.dataset.state = "fallback";
        });
    }
    await scenePromise;
    if (!scene) scenePromise = null;
    updateDemoButton();
  }
  function updateDemoButton() {
    if (demoButton)
      demoButton.disabled =
        !scene ||
        !motion ||
        plain ||
        Boolean(demoTimer) ||
        host?.dataset.state === "fallback";
  }
  function stopDemo() {
    clearTimeout(demoTimer);
    demoTimer = 0;
    demoButton?.removeAttribute("aria-busy");
    if (demoStatus)
      demoStatus.textContent = "本地流程演示，不发起真实模型请求。";
    updateDemoButton();
  }
  function applyPreferences() {
    motion = preference === "on" || (preference !== "off" && !reduced.matches);
    root.dataset.motion = motion ? "on" : "off";
    root.dataset.view = plain ? "plain" : "immersive";
    if (demoButton) demoButton.hidden = false;
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
    else stopDemo();
    syncSceneMotion();
    updateDemoButton();
    requestAnimationFrame(measure);
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
  demoButton?.addEventListener("click", () => {
    if (!scene || !motion || plain || demoTimer) return;
    scene.runDemo?.();
    demoButton.setAttribute("aria-busy", "true");
    if (demoStatus)
      demoStatus.textContent = "演示中：任务 → 工具编排 → 内容分析 → 报告。";
    demoTimer = setTimeout(stopDemo, 5200);
    updateDemoButton();
  });
  window.addEventListener("scroll", queueScroll, { passive: true });
  window.addEventListener("resize", measure, { passive: true });
  window.addEventListener("load", measure, { once: true });
  document.fonts?.ready.then(measure);
  reduced.addEventListener("change", applyPreferences);

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
  let returnFocus,
    previousOverflow = "";
  function closeDialog() {
    if (dialog?.open) dialog.close();
  }
  function openWork(id, source) {
    const data = workData[id],
      detail = document.getElementById("work-detail");
    if (!dialog || !detail || !data) return;
    returnFocus = source;
    detail.innerHTML = `<p class="detail-category">${data.category}</p><h2 id="work-title">${data.title}</h2><p class="detail-intro">${data.intro}</p>${data.image ? `<figure><img src="${data.image}" alt="${data.alt}" width="1536" height="1024"><figcaption>项目概念视觉</figcaption></figure>` : ""}<h3>${data.heading}</h3><p>${data.body}</p><ul>${data.points.map((point) => `<li>${point}</li>`).join("")}</ul><div class="detail-tags">${data.tags.map((tag) => `<span>${tag}</span>`).join("")}</div><div class="detail-links">${data.links.map(([label, url]) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`).join("")}</div>`;
    dialog.setAttribute("aria-labelledby", "work-title");
    previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    syncSceneMotion();
    dialog.querySelector("[data-close-dialog]")?.focus();
  }
  document.querySelectorAll("[data-work]").forEach((button) => {
    button.hidden = false;
    button.addEventListener("click", () =>
      openWork(button.dataset.work, button),
    );
  });
  dialog
    ?.querySelector("[data-close-dialog]")
    ?.addEventListener("click", closeDialog);
  dialog?.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog();
  });
  dialog?.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      closeDialog();
  });
  dialog?.addEventListener("close", () => {
    document.body.style.overflow = previousOverflow;
    syncSceneMotion();
    returnFocus?.focus({ preventScroll: true });
  });
  const copyButton = document.querySelector("[data-copy-email]");
  if (copyButton) copyButton.hidden = false;
  copyButton?.addEventListener("click", async () => {
    const email = document.querySelector("[data-email-address]"),
      status = document.querySelector("[data-copy-status]");
    if (!email || !status) return;
    try {
      await navigator.clipboard.writeText(email.textContent.trim());
      status.textContent = "邮箱已复制。";
    } catch {
      const range = document.createRange();
      range.selectNodeContents(email);
      const selection = getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      status.textContent = "已选中邮箱，请手动复制。";
    }
  });
  window.addEventListener("pagehide", (event) => {
    cancelAnimationFrame(frame);
    frame = 0;
    stopDemo();
    scene?.setMotion(false);
    sceneRunning = false;
    if (!event.persisted) {
      active = false;
      scene?.dispose();
    }
  });
  window.addEventListener("pageshow", () => {
    active = true;
    applyPreferences();
    measure();
  });
  measure();
  applyPreferences();
})();

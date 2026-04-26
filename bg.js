(function () {
  'use strict';

  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, dpr;
  let particles = [];
  let mouse = { x: -9999, y: -9999, active: false };
  let blobs;
  let frame = 0;

  const CONFIG = {
    particleCount: () => Math.min(Math.max(Math.floor(W * H / 14000), 45), 140),
    connectionDist: 150,
    mouseRadius: 240,
    mouseForce: 0.018,
    colors: [
      { r: 34, g: 211, b: 238 },   // cyan
      { r: 168, g: 85, b: 247 },   // purple
      { r: 59, g: 130, b: 246 },   // blue
    ]
  };

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initParticles();
  }

  function initParticles() {
    const count = CONFIG.particleCount();
    particles = [];
    for (let i = 0; i < count; i++) {
      const c = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 1.4 + 0.4,
        color: c,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.015 + Math.random() * 0.025,
      });
    }
  }

  function update() {
    frame++;
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.pulse += p.pulseSpeed;

      if (p.x < 0) { p.x = 0; p.vx *= -1; }
      if (p.x > W) { p.x = W; p.vx *= -1; }
      if (p.y < 0) { p.y = 0; p.vy *= -1; }
      if (p.y > H) { p.y = H; p.vy *= -1; }

      if (mouse.active) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.mouseRadius && dist > 8) {
          const f = (1 - dist / CONFIG.mouseRadius) * CONFIG.mouseForce;
          p.vx += (dx / dist) * f;
          p.vy += (dy / dist) * f;
        }
      }

      p.vx *= 0.992;
      p.vy *= 0.992;
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // 鼠标区域背景色变化
    if (mouse.active) {
      const mxNorm = mouse.x / W;
      const myNorm = mouse.y / H;
      const hue = 180 + mxNorm * 100;
      const sat = 70 + myNorm * 20;

      const g1 = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 400);
      g1.addColorStop(0, `hsla(${hue}, ${sat}%, 55%, 0.10)`);
      g1.addColorStop(0.6, `hsla(${hue + 40}, ${sat - 10}%, 50%, 0.05)`);
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, W, H);

      // 第二层更小的强光
      const g2 = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 120);
      g2.addColorStop(0, `hsla(${hue}, 90%, 70%, 0.08)`);
      g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);
    }

    // 连线
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.connectionDist) {
          let alpha = (1 - dist / CONFIG.connectionDist) * 0.10;
          // 鼠标附近连线更亮
          if (mouse.active) {
            const midX = (particles[i].x + particles[j].x) / 2;
            const midY = (particles[i].y + particles[j].y) / 2;
            const mdx = mouse.x - midX;
            const mdy = mouse.y - midY;
            const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (mDist < CONFIG.mouseRadius) {
              alpha += (1 - mDist / CONFIG.mouseRadius) * 0.15;
            }
          }
          ctx.beginPath();
          ctx.strokeStyle = `rgba(148, 163, 184, ${Math.min(alpha, 0.35)})`;
          ctx.lineWidth = 0.7;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // 粒子
    particles.forEach(p => {
      const alpha = 0.45 + Math.sin(p.pulse) * 0.35;
      ctx.beginPath();
      ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha})`;
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      // 高光
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
      ctx.arc(p.x - p.size * 0.25, p.y - p.size * 0.25, p.size * 0.35, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function animate() {
    if (!document.hidden) {
      update();
      draw();
    }
    requestAnimationFrame(animate);
  }

  // Blob 鼠标跟随（通过 CSS transform）
  function updateBlobs() {
    if (!blobs) blobs = document.querySelectorAll('.blob-mouse');
    if (!mouse.active || !blobs.length) return;

    const mx = (mouse.x / W - 0.5) * 2;
    const my = (mouse.y / H - 0.5) * 2;

    blobs.forEach((blob, i) => {
      const factor = (i + 1) * 30;
      blob.style.transform = `translate(${mx * factor}px, ${my * factor}px)`;
    });
  }

  // 点击涟漪
  function createRipple(x, y) {
    const el = document.createElement('div');
    el.className = 'fixed rounded-full pointer-events-none z-0';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.width = '12px';
    el.style.height = '12px';
    el.style.transform = 'translate(-50%, -50%) scale(1)';
    el.style.background = 'radial-gradient(circle, rgba(34,211,238,0.35) 0%, rgba(168,85,247,0.15) 40%, transparent 70%)';
    el.style.animation = 'ripple-expand 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  window.addEventListener('resize', resize);

  let mouseTimeout;
  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
    updateBlobs();

    clearTimeout(mouseTimeout);
    mouseTimeout = setTimeout(() => { mouse.active = false; }, 2000);
  });

  window.addEventListener('mouseleave', () => { mouse.active = false; });

  window.addEventListener('click', e => {
    createRipple(e.clientX, e.clientY);
  });

  resize();
  animate();
})();

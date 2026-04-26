(function () {
  'use strict';

  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, dpr;
  let particles = [];
  let clickParticles = [];
  let frame = 0;

  const CONFIG = {
    particleCount: () => Math.min(Math.max(Math.floor(W * H / 16000), 40), 120),
    connectionDist: 100,
    colors: [
      { r: 0, g: 229, b: 255 },   // pixel cyan
      { r: 255, g: 0, b: 160 },   // pixel magenta
      { r: 255, g: 215, b: 0 },   // pixel gold
    ]
  };

  function createClickExplosion(x, y) {
    const count = 16 + Math.floor(Math.random() * 8);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 4;
      const c = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
      clickParticles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 12 + Math.floor(Math.random() * 8),
        text: Math.random() > 0.5 ? '1' : '0',
        color: c,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.02,
        gravity: 0.08,
        isText: true,
      });
    }
    // Add a few square "debris" pieces
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      const c = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
      clickParticles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.floor(Math.random() * 2),
        color: c,
        life: 1.0,
        decay: 0.015 + Math.random() * 0.01,
        gravity: 0.05,
        isDebris: true,
      });
    }
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initParticles();
  }

  function getCanvasPos(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX / dpr,
      y: (clientY - rect.top) * scaleY / dpr,
    };
  }

  function initParticles() {
    const count = CONFIG.particleCount();
    particles = [];
    for (let i = 0; i < count; i++) {
      const c = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() > 0.8 ? 2 : 1,
        color: c,
        blink: Math.random() * Math.PI * 2,
        blinkSpeed: 0.02 + Math.random() * 0.03,
      });
    }
  }

  function update() {
    frame++;
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.blink += p.blinkSpeed;

      if (p.x < 0) { p.x = 0; p.vx *= -1; }
      if (p.x > W) { p.x = W; p.vx *= -1; }
      if (p.y < 0) { p.y = 0; p.vy *= -1; }
      if (p.y > H) { p.y = H; p.vy *= -1; }

      p.vx *= 0.995;
      p.vy *= 0.995;
    });

    // Update click explosion particles
    for (let i = clickParticles.length - 1; i >= 0; i--) {
      const cp = clickParticles[i];
      cp.x += cp.vx;
      cp.y += cp.vy;
      cp.vy += cp.gravity;
      cp.life -= cp.decay;
      cp.vx *= 0.98;

      if (cp.life <= 0) {
        clickParticles.splice(i, 1);
      }
    }
  }

  function drawPixel(x, y, color, size) {
    // Snap to pixel grid for pixel-art look
    const px = Math.floor(x);
    const py = Math.floor(y);
    ctx.fillStyle = color;
    ctx.fillRect(px, py, size, size);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Draw connections as dashed pixel lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.connectionDist) {
          const alpha = (1 - dist / CONFIG.connectionDist) * 0.12;
          ctx.strokeStyle = `rgba(100, 116, 139, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 4]);
          ctx.beginPath();
          ctx.moveTo(Math.floor(particles[i].x), Math.floor(particles[i].y));
          ctx.lineTo(Math.floor(particles[j].x), Math.floor(particles[j].y));
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }

    // Draw pixel particles
    particles.forEach(p => {
      const blinkAlpha = 0.3 + Math.abs(Math.sin(p.blink)) * 0.7;
      const r = p.color.r;
      const g = p.color.g;
      const b = p.color.b;

      // Main pixel
      drawPixel(p.x, p.y, `rgba(${r}, ${g}, ${b}, ${blinkAlpha})`, p.size);

      // Subtle glow for larger particles
      if (p.size > 1) {
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${blinkAlpha * 0.15})`;
        ctx.fillRect(Math.floor(p.x) - 1, Math.floor(p.y) - 1, 3, 3);
      }
    });

    // Draw click explosion particles
    clickParticles.forEach(cp => {
      const alpha = cp.life;
      const r = cp.color.r;
      const g = cp.color.g;
      const b = cp.color.b;

      if (cp.isText) {
        ctx.font = `${cp.size}px "VT323", "Courier New", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fillText(cp.text, Math.floor(cp.x), Math.floor(cp.y));
      } else if (cp.isDebris) {
        // Debris: hollow square outline
        const size = cp.size;
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(Math.floor(cp.x), Math.floor(cp.y), size, size);
      }
    });
  }

  function animate() {
    if (!document.hidden) {
      update();
      draw();
    }
    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resize);

  window.addEventListener('click', e => {
    const pos = getCanvasPos(e.clientX, e.clientY);
    createClickExplosion(pos.x, pos.y);
  });

  resize();
  animate();
})();

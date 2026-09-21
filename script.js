/* ---- aquatic night: star field + ripples ---- */

const canvas = document.getElementById("stars");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canvas) {
  const ctx = canvas.getContext("2d");
  const TAU = Math.PI * 2;

  let stars = [];
  let snow = [];
  let ripples = [];
  let width = 0;
  let height = 0;
  let rotation = 0;
  const spin = 0.00045;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let lastDragRipple = 0;
  let raf = null;

  const STAR_COLORS = ["#f4f0dc", "#e8c36a", "#e8c36a", "#5ed9a0", "#5ed9a0", "#8ff0b8"];
  const RIPPLE_GOLD = "232, 195, 106";
  const RIPPLE_SEA = "94, 217, 160";

  function isSmallScreen() {
    return window.matchMedia("(max-width: 640px)").matches;
  }

  function buildField() {
    stars = [];
    snow = [];
    const maxR = Math.min(width, height) * 0.56;
    const small = isSmallScreen();
    const base = small ? width * 0.3 : width * 0.45;
    const count = Math.round(Math.min(small ? 380 : 680, Math.max(small ? 170 : 300, base)));

    // bioluminescent spiral
    for (let i = 0; i < count; i++) {
      const t = Math.pow(Math.random(), 0.75);
      const arm = i % 3;
      const angle = t * 4.6 + (arm * TAU) / 3 + (Math.random() - 0.5) * 0.55;
      const radius = t * maxR + (Math.random() - 0.5) * maxR * 0.08;
      stars.push({
        angle,
        radius,
        size: Math.random() * 1.5 + 0.4,
        alpha: Math.random() * 0.55 + 0.25,
        phase: Math.random() * TAU,
        speed: Math.random() * 0.0012 + 0.0004,
        wobble: Math.random() * 2 + 0.5,
        color: STAR_COLORS[(Math.random() * STAR_COLORS.length) | 0],
      });
    }

    // marine snow — slow drifting motes
    const motes = Math.round(count * 0.3);
    for (let i = 0; i < motes; i++) {
      snow.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.2 + 0.3,
        alpha: Math.random() * 0.3 + 0.08,
        phase: Math.random() * TAU,
        speed: Math.random() * 0.001 + 0.0003,
        rise: Math.random() * 0.00012 + 0.00004,
        sway: Math.random() * 18 + 6,
        color: Math.random() < 0.5 ? "#e8c36a" : "#5ed9a0",
      });
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, isSmallScreen() ? 1.75 : 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildField();
    if (reduceMotion) draw(0);
  }

  function spawnRipple(x, y, strong) {
    ripples.push({
      x,
      y,
      r: strong ? 4 : 2,
      max: strong ? 190 + Math.random() * 60 : 90 + Math.random() * 40,
      life: 1,
      decay: strong ? 0.008 : 0.011,
      gold: Math.random() < 0.5,
    });
    if (ripples.length > 14) ripples.shift();
  }

  // push stars outward as a ripple front passes — water refraction feel
  function displacement(x, y) {
    let dx = 0;
    let dy = 0;
    for (const rp of ripples) {
      const distX = x - rp.x;
      const distY = y - rp.y;
      const dist = Math.hypot(distX, distY) || 1;
      const band = Math.abs(dist - rp.r);
      if (band < 34) {
        const force = (1 - band / 34) * 5 * rp.life;
        dx += (distX / dist) * force;
        dy += (distY / dist) * force;
      }
    }
    return [dx, dy];
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);

    const cx = width >= 900 ? width * 0.7 : width * 0.5;
    const cy = height * 0.52;

    // ripple rings
    for (const rp of ripples) {
      const fade = rp.life * rp.life;
      const outer = rp.gold ? RIPPLE_GOLD : RIPPLE_SEA;
      const inner = rp.gold ? RIPPLE_SEA : RIPPLE_GOLD;
      ctx.strokeStyle = `rgba(${outer}, ${0.3 * fade})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = `rgba(${inner}, ${0.14 * fade})`;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r * 0.72, 0, TAU);
      ctx.stroke();
    }

    // spiral stars
    for (const s of stars) {
      const twinkle = 0.65 + 0.35 * Math.sin(time * s.speed + s.phase);
      const a = s.angle + rotation;
      let x = cx + Math.cos(a) * s.radius * 1.18;
      let y = cy + Math.sin(a) * s.radius * 0.62;
      x += Math.sin(time * 0.0006 * s.wobble + s.phase) * 2.2;
      y += Math.cos(time * 0.0005 * s.wobble + s.phase) * 1.8;
      const [dx, dy] = displacement(x, y);
      ctx.globalAlpha = s.alpha * twinkle;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, s.size, 0, TAU);
      ctx.fill();
    }

    // marine snow
    for (const m of snow) {
      m.y -= m.rise;
      if (m.y < -0.02) m.y = 1.02;
      const twinkle = 0.6 + 0.4 * Math.sin(time * m.speed + m.phase);
      let x = m.x * width + Math.sin(time * 0.0004 + m.phase) * m.sway;
      let y = m.y * height;
      const [dx, dy] = displacement(x, y);
      ctx.globalAlpha = m.alpha * twinkle;
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, m.size, 0, TAU);
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    // advance ripples
    for (const rp of ripples) {
      rp.r += (rp.max - rp.r) * 0.035 + 0.6;
      rp.life -= rp.decay;
    }
    ripples = ripples.filter((rp) => rp.life > 0 && rp.r < rp.max);
  }

  function tick(time) {
    if (!dragging) rotation += spin;
    draw(time);
    raf = requestAnimationFrame(tick);
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  }

  canvas.addEventListener("pointerdown", (event) => {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.classList.add("dragging");
    canvas.setPointerCapture(event.pointerId);
    const [x, y] = canvasPoint(event);
    spawnRipple(x, y, true);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    rotation += (event.clientX - lastX) * 0.004;
    lastX = event.clientX;
    const now = performance.now();
    if (now - lastDragRipple > 140) {
      lastDragRipple = now;
      const [x, y] = canvasPoint(event);
      spawnRipple(x, y, false);
    }
  });

  function endDrag() {
    dragging = false;
    canvas.classList.remove("dragging");
  }

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  canvas.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      rotation -= 0.12;
      event.preventDefault();
    } else if (event.key === "ArrowRight") {
      rotation += 0.12;
      event.preventDefault();
    }
  });

  window.addEventListener("resize", resize);
  resize();

  if (!reduceMotion) {
    raf = requestAnimationFrame(tick);
    // ambient ripples, like something touching the surface
    const ambientMs = isSmallScreen() ? 5200 : 3400;
    setInterval(() => {
      if (document.hidden) return;
      spawnRipple(
        width * (0.15 + Math.random() * 0.7),
        height * (0.15 + Math.random() * 0.7),
        Math.random() < 0.3
      );
    }, ambientMs);
  }

  document.addEventListener("visibilitychange", () => {
    if (reduceMotion) return;
    if (document.hidden && raf) {
      cancelAnimationFrame(raf);
      raf = null;
    } else if (!document.hidden && !raf) {
      raf = requestAnimationFrame(tick);
    }
  });
}

/* ---- terminal boot ---- */

const lines = [
  { text: "local-host 0.1.0-dev", className: "hi" },
  { text: "darwin arm64 · loopback 127.0.0.1", className: "dim" },
  { text: "" },
  { text: "waking local agent…" },
  { text: "  mind       on-device", className: "ok" },
  { text: "  memory     local disk", className: "ok" },
  { text: "  skills     open", className: "ok" },
  { text: "  network    none required", className: "ok" },
  { text: "" },
  { text: "agent ready." },
  { text: "waiting on you." },
];

const terminal = document.getElementById("terminal");

function renderAll() {
  terminal.innerHTML = `${lines
    .map((line) => `<span class="${line.className || ""}">${line.text}</span>`)
    .join("\n")}<span class="cursor" aria-hidden="true"></span>`;
}

async function typeLines() {
  terminal.textContent = "";
  const cursor = document.createElement("span");
  cursor.className = "cursor";
  cursor.setAttribute("aria-hidden", "true");
  terminal.appendChild(cursor);

  for (const [index, line] of lines.entries()) {
    const row = document.createElement("span");
    if (line.className) row.className = line.className;
    terminal.insertBefore(row, cursor);

    for (const char of line.text) {
      row.textContent += char;
      await new Promise((resolve) => setTimeout(resolve, char === " " ? 8 : 16));
    }

    if (index < lines.length - 1) {
      terminal.insertBefore(document.createTextNode("\n"), cursor);
    }
  }
}

if (terminal) {
  if (reduceMotion) renderAll();
  else typeLines();
}

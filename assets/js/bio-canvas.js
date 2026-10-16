(() => {
  "use strict";

  const canvas = document.getElementById("bio-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // Subtle, non-distracting biological color system for dark and light modes
  function getColors() {
    const isDark = document.documentElement.dataset.theme !== "light";
    if (isDark) {
      return {
        primary:   "rgba(125, 211, 199, 0.065)", // very faint cyan/teal line
        secondary: "rgba(214, 160, 95, 0.055)",  // very faint amber bond
        mid:       "rgba(125, 211, 199, 0.040)", // softest connector
        dot:       "rgba(125, 211, 199, 0.14)",  // subtle node dot
        dotSec:    "rgba(214, 160, 95, 0.12)",
      };
    }
    return {
      primary:   "rgba(15, 118, 110, 0.060)",   // very faint deep teal line
      secondary: "rgba(154, 91, 19, 0.050)",    // very faint ochre bond
      mid:       "rgba(15, 118, 110, 0.035)",   // softest connector
      dot:       "rgba(15, 118, 110, 0.13)",    // subtle node dot
      dotSec:    "rgba(154, 91, 19, 0.11)",
    };
  }

  const stroke = (width, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const dot = (x, y, r, fill) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  };

  // 1. Clean, continuous DNA Double Helix (pure geometric sinusoidal curve with base pair rungs)
  function drawDNAHelix(x, amp, freq, phase, H, C) {
    const period = (2 * Math.PI) / freq;

    // Strand 1
    stroke(1.0, C.primary);
    ctx.beginPath();
    for (let y = 0; y <= H; y += 4) {
      const px = x + amp * Math.sin(freq * y + phase);
      if (y === 0) ctx.moveTo(px, y);
      else ctx.lineTo(px, y);
    }
    ctx.stroke();

    // Strand 2
    stroke(1.0, C.primary);
    ctx.beginPath();
    for (let y = 0; y <= H; y += 4) {
      const px = x + amp * Math.sin(freq * y + phase + Math.PI);
      if (y === 0) ctx.moveTo(px, y);
      else ctx.lineTo(px, y);
    }
    ctx.stroke();

    // Base pair cross-rungs with nucleotide junction dots
    for (let y = 20; y < H - 20; y += period / 2) {
      const x1 = x + amp * Math.sin(freq * y + phase);
      const x2 = x + amp * Math.sin(freq * y + phase + Math.PI);

      stroke(0.8, C.mid);
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();

      dot(x1, y, 1.8, C.dot);
      dot(x2, y, 1.8, C.dot);
    }
  }

  // 2. Simple Amino Acid Skeletal Structure (Central C-alpha, Amino group, Carboxyl group, Side-chain R)
  function drawAminoAcid(cx, cy, scale, rot, C) {
    const s = scale;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);

    const dx = s * 24;
    const dy = s * 14;

    stroke(1.0, C.primary);
    ctx.beginPath();
    // N-terminus to C-alpha to C-terminus backbone
    ctx.moveTo(-dx, 0);
    ctx.lineTo(0, -dy);
    ctx.lineTo(dx, 0);
    ctx.stroke();

    // Carbonyl double bond (=O)
    stroke(0.8, C.secondary);
    ctx.beginPath();
    ctx.moveTo(dx, 0);
    ctx.lineTo(dx + 12 * s, -10 * s);
    ctx.moveTo(dx + 2 * s, 2 * s);
    ctx.lineTo(dx + 14 * s, -8 * s);
    // Hydroxyl bond (-OH)
    ctx.moveTo(dx, 0);
    ctx.lineTo(dx + 12 * s, 10 * s);
    ctx.stroke();

    // Amino nitrogen bonds (-NH2)
    stroke(0.8, C.secondary);
    ctx.beginPath();
    ctx.moveTo(-dx, 0);
    ctx.lineTo(-dx - 12 * s, -9 * s);
    ctx.moveTo(-dx, 0);
    ctx.lineTo(-dx - 12 * s, 9 * s);
    ctx.stroke();

    // Side-chain (-R) extending upward from C-alpha
    stroke(1.0, C.primary);
    ctx.beginPath();
    ctx.moveTo(0, -dy);
    ctx.lineTo(0, -dy - 16 * s);
    ctx.lineTo(12 * s, -dy - 24 * s);
    ctx.stroke();

    // Vertex atom dots
    dot(-dx, 0, 2.2 * s, C.dot);        // N
    dot(0, -dy, 2.5 * s, C.dot);         // C-alpha
    dot(dx, 0, 2.2 * s, C.dot);          // Carbonyl C
    dot(dx + 12 * s, -10 * s, 2.0 * s, C.dotSec); // =O
    dot(dx + 12 * s, 10 * s, 2.0 * s, C.dotSec);  // -OH
    dot(12 * s, -dy - 24 * s, 2.2 * s, C.dotSec); // R group

    ctx.restore();
  }

  // 3. Simple Aromatic / Benzene Ring
  function drawBenzene(cx, cy, r, rot, C) {
    stroke(1.0, C.primary);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i + rot;
      const px = cx + r * Math.cos(a);
      const py = cy + r * Math.sin(a);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // Inner aromatic circle
    stroke(0.8, C.mid);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.54, 0, Math.PI * 2);
    ctx.stroke();

    // Vertex atom dots
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i + rot;
      dot(cx + r * Math.cos(a), cy + r * Math.sin(a), 1.6, C.dot);
    }
  }

  // 4. Simple Cladogram / Phylogenetic Tree Branches (pure branching geometry, no text)
  function drawPhyloBranches(cx, cy, depth, angle, len, scale, C) {
    if (depth > 4) return;
    const s = scale;
    const ex = cx + len * s * Math.cos(angle);
    const ey = cy + len * s * Math.sin(angle);

    stroke(depth === 0 ? 1.1 : 0.85, depth < 2 ? C.primary : C.mid);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    if (depth === 4) {
      dot(ex, ey, 2.2 * s, C.dot);
      return;
    }

    const spread = (Math.PI * 0.52) * Math.pow(0.72, depth);
    drawPhyloBranches(ex, ey, depth + 1, angle - spread, len * 0.72, scale, C);
    drawPhyloBranches(ex, ey, depth + 1, angle + spread, len * 0.72, scale, C);

    if (depth < 3) dot(ex, ey, 1.6 * s, C.dotSec);
  }

  // 5. Minimalist GPCR 7-TM Core (seven simple vertical rounded rods connected by serpentine loops)
  function drawGPCRCore(cx, cy, scale, C) {
    const s = scale;
    const rodW = 6 * s;
    const rodH = 24 * s;
    const spacing = 18 * s;

    // 7 Transmembrane rods
    for (let i = 0; i < 7; i++) {
      const rx = cx + (i - 3) * spacing;
      const ry = cy + (i % 2 === 0 ? -2 * s : 2 * s);

      stroke(1.0, C.primary);
      ctx.beginPath();
      ctx.roundRect(rx - rodW / 2, ry - rodH / 2, rodW, rodH, rodW / 2);
      ctx.stroke();

      dot(rx, ry, 1.4 * s, C.dot);

      // Loops connecting tops and bottoms
      if (i < 6) {
        const nextRx = rx + spacing;
        const nextRy = cy + ((i + 1) % 2 === 0 ? -2 * s : 2 * s);
        stroke(0.8, C.mid);
        ctx.beginPath();
        if (i % 2 === 0) {
          // Top loop
          ctx.moveTo(rx, ry - rodH / 2);
          ctx.quadraticCurveTo((rx + nextRx) / 2, cy - rodH / 2 - 12 * s, nextRx, nextRy - rodH / 2);
        } else {
          // Bottom loop
          ctx.moveTo(rx, ry + rodH / 2);
          ctx.quadraticCurveTo((rx + nextRx) / 2, cy + rodH / 2 + 12 * s, nextRx, nextRy + rodH / 2);
        }
        ctx.stroke();
      }
    }
  }

  // 6. Simple Cell & Nucleus Outline
  function drawCellOutline(cx, cy, r, C) {
    stroke(1.0, C.mid);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Subtle inner plasma boundary
    stroke(0.6, C.secondary);
    ctx.beginPath();
    ctx.arc(cx, cy, r - 3.5, 0, Math.PI * 2);
    ctx.stroke();

    // Nucleus
    const nr = r * 0.36;
    const nx = cx + r * 0.12;
    const ny = cy - r * 0.10;
    stroke(0.9, C.primary);
    ctx.beginPath();
    ctx.arc(nx, ny, nr, 0, Math.PI * 2);
    ctx.stroke();

    // Nucleolus
    dot(nx - nr * 0.2, ny + nr * 0.1, nr * 0.25, C.dot);
  }

  // Master Draw — subtle, elegant, distributed across the entire document
  function draw() {
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const C = getColors();
    const isMobile = W < 768;
    const s = isMobile ? Math.max(0.65, W / 850) : Math.min(1.0, W / 1300);

    // ── Continuous DNA Helices framing margins ──
    const leftMargin = W * 0.035;
    const rightMargin = W * 0.965;
    drawDNAHelix(leftMargin, 20 * s, 0.016, 0, H, C);
    drawDNAHelix(rightMargin, 18 * s, 0.018, Math.PI * 0.5, H, C);

    if (!isMobile) {
      drawDNAHelix(W * 0.12, 14 * s, 0.019, Math.PI * 0.8, H, C);
      drawDNAHelix(W * 0.88, 15 * s, 0.017, Math.PI * 0.3, H, C);
    }

    // ── Subtle, non-intrusive shapes distributed down the full page ──

    // SECTION 1 (About area: 5% - 22% of H)
    drawAminoAcid(isMobile ? W * 0.5 : W * 0.26, Math.max(160, H * 0.07), s * 0.85, -0.2, C);
    drawBenzene(isMobile ? W * 0.8 : W * 0.78, Math.max(220, H * 0.09), 26 * s, 0, C);
    drawGPCRCore(isMobile ? W * 0.5 : W * 0.80, Math.max(480, H * 0.17), s * 0.85, C);
    drawCellOutline(isMobile ? W * 0.2 : W * 0.22, Math.max(540, H * 0.20), 42 * s, C);

    // SECTION 2 (Research area: 22% - 45% of H)
    drawPhyloBranches(isMobile ? W * 0.2 : W * 0.24, H * 0.28, 0, -Math.PI / 2, 38, s * 0.85, C);
    drawAminoAcid(isMobile ? W * 0.8 : W * 0.76, H * 0.32, s * 0.90, 0.3, C);
    drawBenzene(isMobile ? W * 0.5 : W * 0.25, H * 0.40, 30 * s, Math.PI / 6, C);
    drawCellOutline(isMobile ? W * 0.8 : W * 0.78, H * 0.43, 46 * s, C);

    // SECTION 3 (Publications area: 45% - 68% of H)
    drawGPCRCore(isMobile ? W * 0.5 : W * 0.24, H * 0.50, s * 0.85, C);
    drawAminoAcid(isMobile ? W * 0.8 : W * 0.78, H * 0.53, s * 0.85, -0.4, C);
    drawPhyloBranches(isMobile ? W * 0.2 : W * 0.78, H * 0.62, 0, -Math.PI / 2, 36, s * 0.85, C);
    drawBenzene(isMobile ? W * 0.5 : W * 0.22, H * 0.65, 28 * s, 0, C);

    // SECTION 4 (Gallery & Contact area: 68% - 100% of H)
    drawAminoAcid(isMobile ? W * 0.2 : W * 0.25, H * 0.74, s * 0.85, 0.2, C);
    drawCellOutline(isMobile ? W * 0.8 : W * 0.78, H * 0.77, 44 * s, C);
    drawGPCRCore(isMobile ? W * 0.5 : W * 0.76, H * 0.86, s * 0.80, C);
    drawBenzene(isMobile ? W * 0.2 : W * 0.24, H * 0.89, 28 * s, Math.PI / 4, C);
    drawAminoAcid(isMobile ? W * 0.7 : W * 0.65, H * 0.94, s * 0.80, -0.15, C);
  }

  let resizeFrame = 0;

  function resize() {
    resizeFrame = 0;
    const w = document.documentElement.clientWidth;
    const h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    draw();
  }

  function scheduleResize() {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(resize);
  }

  window.addEventListener("resize", scheduleResize);
  window.addEventListener("load", scheduleResize);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleResize);
  } else {
    scheduleResize();
  }

  // Instantly re-render with new colors when light/dark theme toggles
  new MutationObserver(scheduleResize).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
})();

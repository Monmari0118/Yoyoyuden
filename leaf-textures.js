/* 初期化時に一度だけ作る、透明背景の葉の表裏。 */
(() => {
  "use strict";
  const W = 128, H = 256, TOP = 9, LENGTH = 217;
  const TAU = Math.PI * 2;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const random = (seed) => () => {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const hash = (x, y, seed) => {
    let n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + seed;
    n = Math.imul(n ^ n >>> 13, 1274126177);
    return ((n ^ n >>> 16) >>> 0) / 4294967295;
  };
  const noise = (x, y, seed) => {
    const ix = Math.floor(x), iy = Math.floor(y);
    let fx = x - ix, fy = y - iy;
    fx = fx * fx * (3 - 2 * fx);
    fy = fy * fy * (3 - 2 * fy);
    const a = hash(ix, iy, seed), b = hash(ix + 1, iy, seed);
    const c = hash(ix, iy + 1, seed), d = hash(ix + 1, iy + 1, seed);
    return a + (b - a) * fx + (c - a) * fy * (1 - fx) + (d - b) * fy * fx;
  };
  const canvas = () => Object.assign(document.createElement("canvas"), { width: W, height: H });

  function makeSpec(shape, color) {
    const seed = 8093 + shape * 917 + color * 371;
    const rand = random(seed);
    return {
      seed, shape, color, breadth: [51, 40, 32][shape],
      bend: [3.4, -4.2, 8.1][shape], phase: rand() * TAU,
      asymmetry: rand() * .055 + .025,
      palette: color === 0 ? [[113, 138, 76], [97, 126, 70], [103, 134, 81]][shape]
        : [[78, 121, 91], [83, 120, 87], [70, 111, 89]][shape]
    };
  }

  function geometry(spec, t, side = 1) {
    t = clamp(t, 0, 1);
    const wave = Math.sin(Math.PI * t);
    const axis = 64 + spec.bend * wave + (spec.shape === 2 ? -6 : 2) * (1 - t) ** 3;
    const power = [.79, .91, 1.07][spec.shape];
    let width = spec.breadth * Math.pow(wave, power) * (1 + .11 * (t - .5));
    width *= 1 + side * spec.asymmetry * Math.sin(t * Math.PI + .4);
    const edge = .57 * Math.sin(t * TAU * 15 + spec.phase + side * .9)
      + .35 * Math.sin(t * TAU * 26.7 + side * 1.7)
      + .62 * Math.sin(t * TAU * 3.1 + spec.phase + side * .4);
    width += edge * Math.pow(wave, .7);
    return { x: axis + side * width, y: TOP + t * LENGTH, axis, width };
  }

  function contour(spec) {
    const path = new Path2D();
    const tip = geometry(spec, 0);
    path.moveTo(tip.x, tip.y);
    for (let i = 1; i <= 120; i++) {
      const p = geometry(spec, i / 120, 1);
      path.lineTo(p.x, p.y);
    }
    for (let i = 119; i >= 0; i--) {
      const p = geometry(spec, i / 120, -1);
      path.lineTo(p.x, p.y);
    }
    path.closePath();
    return path;
  }

  function paint(spec, back) {
    const result = canvas(), ctx = result.getContext("2d");
    const pigment = canvas(), pctx = pigment.getContext("2d");
    const pixels = pctx.createImageData(W, H), data = pixels.data;
    const base = spec.palette.map((v, i) => back ? v * .83 + [38, 39, 31][i] : v);
    for (let y = 0; y < H; y++) {
      const t = clamp((y - TOP) / LENGTH, .001, .999), g = geometry(spec, t);
      for (let x = 0; x < W; x++) {
        const across = clamp((x - g.axis) / Math.max(2, g.width), -1, 1);
        const coarse = noise(x * .065, y * .045, spec.seed) - .5;
        const fleck = noise(x * .31, y * .28, spec.seed + 31) - .5;
        const grain = hash(x, y, spec.seed + 59) - .5;
        const fold = -across * (back ? -3 : 6)
          + Math.exp(-(((across + .2) * 4) ** 2)) * (back ? 1.8 : 4.5)
          - Math.exp(-((across * 23) ** 2)) * (back ? 1 : 2.7);
        const edgeShade = -Math.pow(Math.abs(across), 3) * (back ? 4 : 8);
        const age = Math.max(0, noise(x * .11, y * .085, spec.seed + 73) - .72) * 19;
        const light = coarse * 12 + fleck * 3.1 + grain * 3.4 + fold + edgeShade
          + Math.sin(t * Math.PI) * 2 - age;
        const i = (y * W + x) * 4;
        data[i] = clamp(base[0] + light + age * .6, 0, 255);
        data[i + 1] = clamp(base[1] + light, 0, 255);
        data[i + 2] = clamp(base[2] + light * .77 - age * .3, 0, 255);
        data[i + 3] = 255;
      }
    }
    pctx.putImageData(pixels, 0, 0);
    const outline = contour(spec);
    ctx.save();
    ctx.clip(outline);
    ctx.drawImage(pigment, 0, 0);

    // 葉脈を片側ずつ少しずらし、左右一様な模様を避ける。
    const rand = random(spec.seed + 97);
    ctx.lineCap = "round";
    for (const side of [-1, 1]) {
      for (let i = 0; i < 9; i++) {
        const t = .23 + i * .077 + rand() * .014 + (side === 1 ? .016 : 0);
        const targetT = Math.max(.045, t - .14 - rand() * .035);
        const start = geometry(spec, t), end = geometry(spec, targetT, side);
        const ex = end.axis + (end.x - end.axis) * (.89 + rand() * .045);
        const controlX = start.axis + (ex - start.axis) * .53;
        const controlY = start.y - 10 - rand() * 8;
        const vein = new Path2D();
        vein.moveTo(start.axis, start.y);
        vein.quadraticCurveTo(controlX, controlY, ex, end.y);
        ctx.strokeStyle = back ? "rgba(66,82,44,.23)" : "rgba(43,66,30,.20)";
        ctx.lineWidth = 1.3;
        ctx.save(); ctx.translate(.55, .5); ctx.stroke(vein); ctx.restore();
        ctx.strokeStyle = back ? "rgba(196,199,138,.36)" : "rgba(187,191,119,.43)";
        ctx.lineWidth = back ? .9 : .82;
        ctx.stroke(vein);
        // 細い網状脈は縮小すると、控えめなざらつきとして残る。
        for (let j = 1; j <= 3; j++) {
          const u = j / 4, v = 1 - u;
          const bx = v * v * start.axis + 2 * v * u * controlX + u * u * ex;
          const by = v * v * start.y + 2 * v * u * controlY + u * u * end.y;
          const edge = geometry(spec, Math.max(.025, targetT - .018 - j * .009), side);
          ctx.beginPath(); ctx.moveTo(bx, by);
          ctx.quadraticCurveTo(bx + side * 4, by - 7, edge.axis + (edge.x - edge.axis) * (.49 + u * .45), edge.y);
          ctx.strokeStyle = back ? "rgba(177,186,124,.17)" : "rgba(162,174,103,.20)";
          ctx.lineWidth = .45; ctx.stroke();
        }
      }
    }
    const rib = new Path2D();
    for (let i = 0; i <= 50; i++) {
      const p = geometry(spec, .025 + i / 50 * .975);
      if (i === 0) rib.moveTo(p.axis, p.y); else rib.lineTo(p.axis, p.y);
    }
    ctx.strokeStyle = "rgba(40,59,29,.26)";
    ctx.lineWidth = 2.2;
    ctx.save(); ctx.translate(.8, 0); ctx.stroke(rib); ctx.restore();
    const ribColor = ctx.createLinearGradient(0, TOP, 0, 232);
    ribColor.addColorStop(0, "rgba(191,197,133,.20)");
    ribColor.addColorStop(.5, back ? "rgba(189,191,127,.71)" : "rgba(180,184,108,.66)");
    ribColor.addColorStop(1, "rgba(139,145,76,.83)");
    ctx.strokeStyle = ribColor; ctx.lineWidth = back ? 1.6 : 1.45; ctx.stroke(rib);
    ctx.restore();
    ctx.strokeStyle = "rgba(48,65,30,.24)";
    ctx.lineWidth = .65; ctx.stroke(outline);
    const root = geometry(spec, 1);
    ctx.beginPath(); ctx.moveTo(root.axis, root.y - 2);
    ctx.quadraticCurveTo(root.axis + spec.bend * .3, 235, root.axis - 3, 247);
    const stem = ctx.createLinearGradient(root.axis - 2, 0, root.axis + 2, 0);
    stem.addColorStop(0, "rgba(74,83,39,.95)");
    stem.addColorStop(.45, back ? "rgba(156,160,96,.95)" : "rgba(132,142,73,.95)");
    stem.addColorStop(1, "rgba(84,99,45,.95)");
    ctx.strokeStyle = stem; ctx.lineWidth = 1.8; ctx.stroke();
    return result;
  }

  window.createYoyoyudenLeafTextures = () => {
    const textures = [];
    for (let shape = 0; shape < 3; shape++) {
      for (let color = 0; color < 2; color++) {
        const spec = makeSpec(shape, color);
        textures.push({ front: paint(spec, false), back: paint(spec, true), width: W, height: H });
      }
    }
    return textures;
  };
})();

/* Falling foliage. Textures are painted once; motion uses elapsed seconds. */
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let started = false;
  let mode = 'detailed';
  let renderer = null;
  let textures = null;

  function updateState() {
    if (!document.body) return;
    document.body.dataset.leafMode = mode;
    document.body.dataset.leafState = mode === 'off' ? 'off'
      : reducedMotion.matches ? 'reduced-motion'
      : document.hidden ? 'paused' : 'running';
    renderer?.setActive?.(!document.hidden && !reducedMotion.matches);
  }

  function setMode(next) {
    if (!['original', 'detailed', 'off'].includes(next)) return;
    if (mode === next && renderer) {
      updateState();
      return;
    }
    mode = next;
    if (!started) return;
    renderer?.destroy();
    renderer = null;
    if (mode !== 'off' && !reducedMotion.matches) {
      if (mode === 'original') {
        renderer = window.initLeafParticles?.() || null;
        document.querySelector('.leaf-canvas')?.setAttribute('data-leaf-engine', 'original');
      } else {
        textures ||= window.createYoyoyudenLeafTextures?.();
        if (textures?.length) renderer = createDetailedLeaves(textures);
      }
    }
    updateState();
  }

  function start() {
    if (started) return;
    started = true;
    document.addEventListener('visibilitychange', updateState);
    reducedMotion.addEventListener('change', onMotionChange);
    setMode(mode);
  }

  function onMotionChange() {
    renderer?.destroy();
    renderer = null;
    setMode(mode);
  }

  window.yoyoyudenLeafAtmosphere = { start, setMode, getMode: () => mode };

  function createDetailedLeaves(atlas) {
    const canvas = document.createElement('canvas');
    canvas.className = 'leaf-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.dataset.leafEngine = 'detailed';
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return null;
    document.body.appendChild(canvas);
    let width = 0;
    let height = 0;
    let ratio = 1;
    let leaves = [];
    let frame = 0;
    let frameCount = 0;
    let previous = 0;
    let time = 0;
    let active = false;
    let destroyed = false;
    const rand = (min, max) => min + Math.random() * (max - min);

    function makeLeaf(randomY) {
      const depth = Math.random();
      return {
        x: rand(-35, width + 35), y: randomY ? rand(-30, height) : rand(-90, -35),
        depth, length: 12 + Math.pow(depth, 1.5) * 43,
        fallSpeed: 13 + depth * 29 + rand(-2, 3),
        phase: rand(0, Math.PI * 2), phase2: rand(0, Math.PI * 2),
        roll: rand(-Math.PI, Math.PI), spin: rand(-.1, .1),
        yawSpeed: rand(.35, .8), flutter: rand(.65, 1.05),
        curvature: rand(.08, .18), opacity: .28 + depth * .47,
        texture: atlas[Math.floor(Math.random() * atlas.length)]
      };
    }

    function resize() {
      const oldWidth = width;
      const oldHeight = height;
      width = window.innerWidth;
      height = window.innerHeight;
      ratio = Math.min(window.devicePixelRatio || 1, width < 600 ? 1.5 : 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (oldWidth && oldHeight) {
        leaves.forEach(leaf => { leaf.x *= width / oldWidth; leaf.y *= height / oldHeight; });
      }
      const count = Math.max(10, Math.min(34, Math.round(width / 48)));
      while (leaves.length < count) leaves.push(makeLeaf(true));
      leaves.length = count;
      canvas.dataset.leafCount = String(count);
    }

    function project(x, y, z, orientation, leaf) {
      const [cp, sp, cy, sy, cr, sr] = orientation;
      const py = y * cp - z * sp;
      const pz = y * sp + z * cp;
      const px = x * cy + pz * sy;
      const depth = -x * sy + pz * cy;
      const perspective = 440 / (440 + depth);
      return {
        x: leaf.x + (px * cr - py * sr) * perspective,
        y: leaf.y + (px * sr + py * cr) * perspective
      };
    }

    function drawTriangle(texture, source, target) {
      const [s0, s1, s2] = source;
      const [p0, p1, p2] = target;
      const area = (p1.x - p0.x) * (p2.y - p0.y) - (p2.x - p0.x) * (p1.y - p0.y);
      if (Math.abs(area) < .035) return;
      const det = s0.x * (s1.y - s2.y) + s1.x * (s2.y - s0.y) + s2.x * (s0.y - s1.y);
      const a = (p0.x * (s1.y - s2.y) + p1.x * (s2.y - s0.y) + p2.x * (s0.y - s1.y)) / det;
      const b = (p0.y * (s1.y - s2.y) + p1.y * (s2.y - s0.y) + p2.y * (s0.y - s1.y)) / det;
      const c = (p0.x * (s2.x - s1.x) + p1.x * (s0.x - s2.x) + p2.x * (s1.x - s0.x)) / det;
      const d = (p0.y * (s2.x - s1.x) + p1.y * (s0.x - s2.x) + p2.y * (s1.x - s0.x)) / det;
      const e = (p0.x * (s1.x * s2.y - s2.x * s1.y) + p1.x * (s2.x * s0.y - s0.x * s2.y) + p2.x * (s0.x * s1.y - s1.x * s0.y)) / det;
      const f = (p0.y * (s1.x * s2.y - s2.x * s1.y) + p1.y * (s2.x * s0.y - s0.x * s2.y) + p2.y * (s0.x * s1.y - s1.x * s0.y)) / det;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.closePath();
      ctx.clip();
      ctx.transform(a, b, c, d, e, f);
      ctx.drawImage(texture, 0, 0);
      ctx.restore();
    }

    function drawLeaf(leaf) {
      const yaw = leaf.phase + time * leaf.yawSpeed + Math.sin(time * .43 + leaf.phase2) * .3;
      const pitch = Math.sin(time * leaf.flutter + leaf.phase2) * .52;
      const roll = leaf.roll + Math.sin(time * .7 + leaf.phase) * .5 + time * leaf.spin;
      const orientation = [Math.cos(pitch), Math.sin(pitch), Math.cos(yaw), Math.sin(yaw), Math.cos(roll), Math.sin(roll)];
      const facing = orientation[0] * orientation[2];
      const texture = facing >= 0 ? leaf.texture.front : leaf.texture.back;
      const h = leaf.length;
      const w = h * leaf.texture.width / leaf.texture.height;
      const edgeFade = Math.min(1, (leaf.y + 55) / 40, (height + 45 - leaf.y) / 35);
      ctx.globalAlpha = Math.max(0, leaf.opacity * (.72 + .28 * Math.abs(facing)) * edgeFade);
      ctx.filter = leaf.depth < .24 ? 'blur(0.45px)' : 'none';

      if (leaf.depth < .75) {
        const p0 = project(-w / 2, -h / 2, 0, orientation, leaf);
        const p1 = project(w / 2, -h / 2, 0, orientation, leaf);
        const p2 = project(-w / 2, h / 2, 0, orientation, leaf);
        ctx.save();
        ctx.transform((p1.x - p0.x) / texture.width, (p1.y - p0.y) / texture.width,
          (p2.x - p0.x) / texture.height, (p2.y - p0.y) / texture.height, p0.x, p0.y);
        ctx.drawImage(texture, 0, 0);
        ctx.restore();
      } else {
        // Only nearby leaves use a curved surface; distant foliage needs one draw call.
        const point = (u, v) => project((u - .5) * w, (v - .5) * h,
          Math.sin(u * Math.PI) * h * leaf.curvature + Math.sin(v * Math.PI) * h * .07,
          orientation, leaf);
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 2; col++) {
            const u0 = col / 2, u1 = (col + 1) / 2, v0 = row / 3, v1 = (row + 1) / 3;
            const s00 = { x: u0 * texture.width, y: v0 * texture.height };
            const s10 = { x: u1 * texture.width, y: v0 * texture.height };
            const s01 = { x: u0 * texture.width, y: v1 * texture.height };
            const s11 = { x: u1 * texture.width, y: v1 * texture.height };
            const p00 = point(u0, v0), p10 = point(u1, v0), p01 = point(u0, v1), p11 = point(u1, v1);
            drawTriangle(texture, [s00, s10, s01], [p00, p10, p01]);
            drawTriangle(texture, [s10, s11, s01], [p10, p11, p01]);
          }
        }
      }
    }

    function step(now) {
      if (!active || destroyed) return;
      const dt = previous ? Math.min((now - previous) / 1000, .045) : 0;
      previous = now;
      time += dt;
      ctx.clearRect(0, 0, width, height);
      const wind = Math.sin(time * .29) * 9 + Math.sin(time * .67 + 1.8) * 4;
      leaves.sort((a, b) => a.depth - b.depth);
      for (const leaf of leaves) {
        leaf.x += (wind * (.35 + leaf.depth * .65) + Math.sin(time * leaf.flutter + leaf.phase) * (4 + leaf.depth * 12)) * dt;
        leaf.y += (leaf.fallSpeed + Math.sin(time * leaf.flutter * 1.3 + leaf.phase2) * 3.5) * dt;
        if (leaf.y > height + 65 || leaf.x < -100 || leaf.x > width + 100) Object.assign(leaf, makeLeaf(false));
        drawLeaf(leaf);
      }
      ctx.globalAlpha = 1;
      ctx.filter = 'none';
      frameCount++;
      if (frameCount % 30 === 0) canvas.dataset.frames = String(frameCount);
      frame = requestAnimationFrame(step);
    }

    function setActive(next) {
      if (destroyed || active === next) return;
      active = next;
      previous = 0;
      if (active) frame = requestAnimationFrame(step);
      else cancelAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', resize);
    return {
      setActive,
      destroy() {
        destroyed = true;
        active = false;
        cancelAnimationFrame(frame);
        window.removeEventListener('resize', resize);
        canvas.remove();
      }
    };
  }
})();

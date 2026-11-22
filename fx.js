/* NOVA AGENCY — visual effects engine (performance-tuned)
   Loader · smooth scroll · animated background · liquid glass · text effects
   tilt/glare · magnetic buttons · ripples & sparks · cursor · scroll-linked motion · tab title

   Speed rules used everywhere below:
   - one requestAnimationFrame loop for all effects
   - no layout reads inside the loop (positions are measured once, then on resize)
   - work that is off screen is skipped / paused
   - "lite" mode on phones, low-memory devices, or as soon as frames start dropping */
(() => {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const AR = root.lang === 'ar';
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const small = matchMedia('(max-width: 760px)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- Quality level ---------- */
  const forced = new URLSearchParams(location.search).get('fx'); // ?fx=lite or ?fx=full to test
  let stored = null;
  try { stored = sessionStorage.getItem('novaFx'); } catch (err) { /* private mode */ }
  let LITE;
  if (forced === 'lite' || forced === 'full') LITE = forced === 'lite';
  else if (stored === 'lite') LITE = true;
  else LITE = !fine || (navigator.deviceMemory || 8) <= 4 || (navigator.hardwareConcurrency || 8) <= 2;
  const liteHooks = [];
  const goLite = () => {
    if (LITE) return;
    LITE = true;
    root.classList.add('fx-lite');
    root.classList.remove('refract-on');
    try { sessionStorage.setItem('novaFx', 'lite'); } catch (err) { /* ignore */ }
    liteHooks.forEach((f) => f());
  };
  if (LITE) root.classList.add('fx-lite');

  /* ---------- One animation loop for everything ---------- */
  const tasks = [];
  const onFrame = (fn) => tasks.push(fn);
  let lenis = null;
  let last = performance.now();
  const frame = (t) => {
    const dt = Math.min(64, t - last);
    last = t;
    if (lenis) lenis.raf(t);
    for (let i = 0; i < tasks.length; i++) tasks[i](t, dt);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  /* ---------- No page zoom ---------- */
  ['gesturestart', 'gesturechange'].forEach((ev) => document.addEventListener(ev, (e) => e.preventDefault(), { passive: false }));
  document.addEventListener('touchmove', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
  addEventListener('wheel', (e) => { if (e.ctrlKey || e.metaKey) e.preventDefault(); }, { passive: false });
  addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '_', '0'].includes(e.key)) e.preventDefault();
  });

  /* ---------- Copy protection (a deterrent: no right-click menu, no view-source / dev-tools shortcuts, no image saving) ---------- */
  document.addEventListener('contextmenu', (e) => { if (!e.target.closest('input, textarea, select')) e.preventDefault(); });
  document.addEventListener('dragstart', (e) => { if (e.target.closest('img, a')) e.preventDefault(); });
  addEventListener('keydown', (e) => {
    const c = e.code;
    const mod = e.ctrlKey || e.metaKey;
    if (c === 'F12'
      || (mod && (e.shiftKey || e.altKey) && ['KeyI', 'KeyJ', 'KeyC', 'KeyK'].includes(c))
      || (mod && ['KeyU', 'KeyS', 'KeyP'].includes(c))) e.preventDefault();
  }, true);

  /* ---------- Smooth scroll (Lenis) ---------- */
  if (window.Lenis) {
    try {
      lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.4 });
      window.novaLenis = lenis;
      lenis.stop();
    } catch (err) { lenis = null; }
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id.length > 1 && document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: id === '#home' ? 0 : -70, duration: 1.5, force: true });
    else target.scrollIntoView({ behavior: 'smooth' });
  });

  /* ---------- Intro loader → window.novaReady ---------- */
  let resolveReady;
  window.novaReady = new Promise((r) => { resolveReady = r; });
  let ready = false;
  const pl = $('.preloader');
  const plCount = pl && $('.pl-count', pl);
  let seen = false;
  try { seen = sessionStorage.getItem('novaSeen') === '1'; sessionStorage.setItem('novaSeen', '1'); } catch (err) { /* ignore */ }
  const plStart = performance.now();
  let plShown = 0;
  let plDone = false;
  if (pl) {
    onFrame(() => {
      if (plDone) return;
      const target = Math.min(96, (performance.now() - plStart) / (seen ? 5 : 12));
      plShown = lerp(plShown, target, 0.18);
      pl.style.setProperty('--pl', plShown.toFixed(1));
      plCount.textContent = Math.round(plShown);
    });
  }
  const finish = () => {
    if (plDone) return;
    plDone = true;
    if (pl) {
      pl.style.setProperty('--pl', 100);
      plCount.textContent = '100';
      setTimeout(() => pl.classList.add('done'), 160);
      setTimeout(() => pl.remove(), 1400);
    }
    setTimeout(() => { if (lenis) lenis.start(); ready = true; resolveReady(); }, pl ? 420 : 0);
  };
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  const pageLoaded = new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true })));
  Promise.all([
    Promise.race([Promise.all([fontsReady, pageLoaded]), new Promise((r) => setTimeout(r, 3500))]),
    new Promise((r) => setTimeout(r, seen ? 450 : 1200)),
  ]).then(finish);

  /* ---------- Frame-drop watchdog: switch to lite if the device struggles ---------- */
  if (forced !== 'full') {
    const samples = [];
    let warm = 0;
    document.addEventListener('visibilitychange', () => { samples.length = 0; warm = 0; });
    onFrame((t, dt) => {
      if (LITE || !ready || document.hidden) return;
      if (warm < 60) { warm++; return; }
      samples.push(dt);
      if (samples.length > 100) samples.shift();
      if (samples.length === 100) {
        let sum = 0;
        for (let i = 0; i < 100; i++) sum += samples[i];
        if (sum / 100 > 24) goLite(); // under ~42 fps for a few seconds
      }
    });
  }

  /* ---------- What is on screen (pause the rest) ---------- */
  let heroOn = true;
  const offIO = new IntersectionObserver((es) => es.forEach((e) => {
    e.target.classList.toggle('off', !e.isIntersecting);
    if (e.target.classList.contains('hero')) { heroOn = e.isIntersecting; root.classList.toggle('hero-off', !heroOn); }
  }), { rootMargin: '120px 0px' });
  $$('.hero, .section, .footer, .marquee-wrap').forEach((el) => offIO.observe(el));

  /* ---------- Scroll velocity (feeds marquee, skew, background) ---------- */
  let lastY = scrollY;
  let vel = 0;
  let dirSign = 1;
  onFrame(() => {
    const y = scrollY;
    const d = y - lastY;
    lastY = y;
    if (d) dirSign = d > 0 ? 1 : -1;
    vel = lerp(vel, d, 0.14);
  });

  /* ---------- Pointer state (read once per frame, not per event) ---------- */
  const mouse = { x: -9999, y: -9999, on: false, moved: false, target: null };
  addEventListener('pointermove', (e) => {
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true; mouse.moved = true; mouse.target = e.target;
  }, { passive: true });
  document.addEventListener('pointerleave', () => { mouse.on = false; mouse.x = mouse.y = -9999; });

  /* ---------- Animated background: node network (batched drawing) ---------- */
  const net = $('.bg-net');
  if (net) {
    const ctx = net.getContext('2d', { alpha: true });
    let DPR = LITE ? 1 : Math.min(1.5, devicePixelRatio || 1);
    let N = LITE ? (small ? 26 : 40) : 70;
    let LINK = small ? 115 : 160;
    let W = 0; let H = 0;
    const nodes = [];
    const size = () => {
      W = innerWidth; H = innerHeight;
      net.width = Math.round(W * DPR); net.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    size();
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(size, 150); });
    for (let i = 0; i < 70; i++) {
      nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, r: Math.random() * 1.5 + 0.7, p: Math.random() * 6.28 });
    }
    liteHooks.push(() => { DPR = 1; N = small ? 26 : 40; size(); });
    const BUCKETS = 4;
    let acc = 0;
    onFrame((t, dt) => {
      if (document.hidden) return;
      if (LITE) { acc += dt; if (acc < 33) return; dt = acc; acc = 0; } // 30 fps is plenty for a background
      const step = dt / 16.7;
      const drift = vel * 0.25;
      for (let i = 0; i < N; i++) {
        const n = nodes[i];
        n.x += n.vx * step; n.y += n.vy * step - drift;
        if (mouse.on) {
          const dx = n.x - mouse.x; const dy = n.y - mouse.y; const d2 = dx * dx + dy * dy;
          if (d2 < 26000) { const k = ((26000 - d2) / 26000) * 0.9 / Math.sqrt(d2 + 1); n.x += dx * k; n.y += dy * k; }
        }
        if (n.x < -30) n.x = W + 30; else if (n.x > W + 30) n.x = -30;
        if (n.y < -30) n.y = H + 30; else if (n.y > H + 30) n.y = -30;
      }
      ctx.clearRect(0, 0, W, H);
      // lines grouped in 4 opacity buckets → 4 stroke calls instead of hundreds
      const paths = [];
      for (let b = 0; b < BUCKETS; b++) paths.push(new Path2D());
      const mousePath = new Path2D();
      for (let i = 0; i < N; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < N; j++) {
          const b = nodes[j];
          const dx = a.x - b.x; const dy = a.y - b.y;
          if (dx > LINK || dx < -LINK || dy > LINK || dy < -LINK) continue;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) {
            const path = paths[Math.min(BUCKETS - 1, ((1 - d / LINK) * BUCKETS) | 0)];
            path.moveTo(a.x, a.y); path.lineTo(b.x, b.y);
          }
        }
        if (mouse.on) {
          const dx = a.x - mouse.x; const dy = a.y - mouse.y;
          if (dx * dx + dy * dy < 44100) { mousePath.moveTo(a.x, a.y); mousePath.lineTo(mouse.x, mouse.y); }
        }
      }
      ctx.lineWidth = 1;
      for (let b = 0; b < BUCKETS; b++) {
        ctx.strokeStyle = `rgba(255,77,125,${(((b + 0.6) / BUCKETS) * 0.3).toFixed(3)})`;
        ctx.stroke(paths[b]);
      }
      if (mouse.on) { ctx.strokeStyle = 'rgba(255,150,190,.28)'; ctx.stroke(mousePath); }
      // nodes in two brightness groups → 2 fill calls
      const bright = new Path2D(); const dim = new Path2D();
      for (let i = 0; i < N; i++) {
        const n = nodes[i];
        const on = Math.sin(t * 0.002 + n.p) > 0;
        const path = on ? bright : dim;
        path.moveTo(n.x + n.r * 1.3, n.y);
        path.arc(n.x, n.y, n.r * (on ? 1.3 : 1), 0, 6.283);
      }
      ctx.fillStyle = 'rgba(255,130,170,.85)'; ctx.fill(bright);
      ctx.fillStyle = 'rgba(255,130,170,.4)'; ctx.fill(dim);
    });
  }

  /* ---------- Sparks on every tap/click + cursor trail (no canvas shadows) ---------- */
  const fxc = $('.fx-layer');
  const COLORS = ['#ff4d7d', '#fa1d4c', '#ffd1de', '#c084fc', '#ffffff'];
  const parts = [];
  const burst = (() => {
    if (!fxc) return () => {};
    const ctx = fxc.getContext('2d');
    const DPR = Math.min(LITE ? 1 : 2, devicePixelRatio || 1);
    let W = 0; let H = 0;
    const size = () => { W = innerWidth; H = innerHeight; fxc.width = Math.round(W * DPR); fxc.height = Math.round(H * DPR); ctx.setTransform(DPR, 0, 0, DPR, 0, 0); };
    size();
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(size, 150); });
    let dirty = false;
    onFrame((t, dt) => {
      if (!parts.length) { if (dirty) { ctx.clearRect(0, 0, W, H); dirty = false; } return; }
      dirty = true;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      const step = dt / 16.7;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life -= dt / p.dur;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        if (p.ring) {
          ctx.globalAlpha = p.life * 0.8;
          ctx.strokeStyle = '#ff78aa';
          ctx.lineWidth = 2 * p.life + 0.5;
          ctx.beginPath(); ctx.arc(p.x, p.y, (1 - p.life) * p.max, 0, 6.283); ctx.stroke();
          continue;
        }
        p.x += p.vx * step; p.y += p.vy * step; p.vy += p.g * step; p.vx *= 0.97; p.vy *= 0.97;
        const r = p.s * (0.4 + p.life * 0.6);
        ctx.fillStyle = p.c;
        ctx.globalAlpha = p.life * 0.22;
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.6, 0, 6.283); ctx.fill(); // soft glow
        ctx.globalAlpha = p.life;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    });
    return (x, y) => {
      parts.push({ ring: true, x, y, max: 70, life: 1, dur: 600 });
      const count = LITE ? 9 : 16;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * 6.283; const sp = 2 + Math.random() * 5;
        parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.5, g: 0.12, s: 1.6 + Math.random() * 2.4, life: 1, dur: 700 + Math.random() * 400, c: COLORS[(Math.random() * COLORS.length) | 0] });
      }
    };
  })();

  /* ---------- Liquid glass: moving sheen + rim on every glass surface ---------- */
  $$('.lg').forEach((el) => {
    const s = document.createElement('span');
    s.className = 'lg-sheen';
    s.setAttribute('aria-hidden', 'true');
    el.prepend(s);
  });
  $$('.nav, .feature, .hero-role, .contact-form, .hero-blob').forEach((el) => el.classList.add('lg-live'));
  const chromium = !!(navigator.userAgentData && navigator.userAgentData.brands && navigator.userAgentData.brands.some((b) => /Chromium/.test(b.brand)));
  if (chromium && !small && !LITE) root.classList.add('refract-on');

  /* ---------- Headings: split into words for the rise animation ---------- */
  const splitWords = (el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((ch) => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const inner = document.createElement('span');
            inner.textContent = part;
            inner.style.setProperty('--wi', i++);
            w.appendChild(inner);
            frag.appendChild(w);
          });
          ch.replaceWith(frag);
        } else if (ch.nodeType === 1 && ch.tagName !== 'BR') {
          walk(ch);
        }
      });
    };
    walk(el);
    el.classList.add('split');
  };
  $$('.display:not(#modal-title), .hero-name').forEach(splitWords);

  /* ---------- Section labels decode like a terminal (English) ---------- */
  if (!AR) {
    const CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+/';
    const scramble = (el) => {
      const node = [...el.childNodes].reverse().find((n) => n.nodeType === 3 && n.textContent.trim());
      if (!node) return;
      const final = node.textContent;
      let f = 0;
      const total = 18;
      const run = () => {
        node.textContent = final.split('').map((c, i) => (c === ' ' || i < (f / total) * final.length ? c : CH[(Math.random() * CH.length) | 0])).join('');
        if (++f <= total) setTimeout(run, 36); else node.textContent = final;
      };
      run();
    };
    const sio = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { scramble(e.target); sio.unobserve(e.target); }
    }), { threshold: 0.9 });
    window.novaReady.then(() => $$('main .eyebrow').forEach((el) => sio.observe(el)));
  }

  /* ---------- Typewriter in the hero (pauses when the hero is off screen) ---------- */
  $$('.tw').forEach((el) => {
    let words;
    try { words = JSON.parse(el.dataset.words); } catch (err) { return; }
    let wi = 0; let ci = 0; let del = false;
    const step = () => {
      if (!heroOn || document.hidden) { setTimeout(step, 400); return; }
      const w = words[wi];
      el.textContent = w.slice(0, ci);
      if (!del && ci < w.length) { ci++; setTimeout(step, 75); }
      else if (!del) { del = true; setTimeout(step, 1700); }
      else if (ci > 0) { ci--; setTimeout(step, 35); }
      else { del = false; wi = (wi + 1) % words.length; setTimeout(step, 320); }
    };
    window.novaReady.then(() => setTimeout(step, 1100));
  });

  /* ---------- Desktop pointer effects ---------- */
  if (fine) {
    // 3D tilt + glare (element size cached on enter → no layout work while moving)
    $$('[data-tilt]').forEach((el) => {
      const g = document.createElement('span');
      g.className = 'glare';
      el.appendChild(g);
      const max = parseFloat(el.dataset.tilt) || 9;
      let r = null;
      el.addEventListener('pointerenter', () => { r = el.getBoundingClientRect(); el.classList.add('tilt-on'); });
      el.addEventListener('pointermove', (e) => {
        if (!r) return;
        const px = clamp((e.clientX - r.left) / r.width, 0, 1);
        const py = clamp((e.clientY - r.top) / r.height, 0, 1);
        el.style.setProperty('--rx', `${((0.5 - py) * max).toFixed(2)}deg`);
        el.style.setProperty('--ry', `${((px - 0.5) * max).toFixed(2)}deg`);
        el.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
        el.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
      });
      el.addEventListener('pointerleave', () => {
        r = null;
        el.classList.remove('tilt-on');
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });

    // magnetic buttons
    $$('.btn, .btn-ghost, .lang, .chip, .wa-fab').forEach((el) => {
      el.classList.add('mag');
      let r = null;
      el.addEventListener('pointerenter', () => { r = el.getBoundingClientRect(); });
      el.addEventListener('pointermove', (e) => {
        if (!r) return;
        el.style.translate = `${((e.clientX - (r.left + r.width / 2)) * 0.25).toFixed(1)}px ${((e.clientY - (r.top + r.height / 2)) * 0.35).toFixed(1)}px`;
      });
      el.addEventListener('pointerleave', () => { r = null; el.style.translate = ''; });
    });

    // cursor lens + dot + trail + glass sheen + aurora drift — all handled once per frame
    const c = $('.cursor');
    const dot = $('.cursor-dot');
    const label = $('.cursor-label');
    const aurora = $('.aurora');
    let cx = innerWidth / 2; let cy = innerHeight / 2;
    let sheenEl = null; let sheenRect = null;
    let lastTrail = 0;
    document.addEventListener('pointerleave', () => { c.classList.remove('on'); dot.classList.remove('on'); });
    document.addEventListener('pointerover', (e) => {
      const t = e.target;
      const lab = t.closest && t.closest('[data-cursor]');
      c.classList.toggle('labeled', !!lab);
      if (lab) label.textContent = lab.dataset.cursor;
      c.classList.toggle('hover', !lab && !!(t.closest && t.closest('a, button, input, textarea, .chip, .pillar, .review')));
      const g = t.closest && t.closest('.lg');
      if (g !== sheenEl) { sheenEl = g; sheenRect = g ? g.getBoundingClientRect() : null; }
    });
    addEventListener('scroll', () => { if (sheenEl) sheenRect = sheenEl.getBoundingClientRect(); }, { passive: true });
    addEventListener('pointerdown', () => c.classList.add('down'));
    addEventListener('pointerup', () => c.classList.remove('down'));
    onFrame((t) => {
      if (mouse.moved) {
        mouse.moved = false;
        c.classList.add('on'); dot.classList.add('on');
        dot.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0)`;
        if (aurora) {
          aurora.style.setProperty('--ax', `${((mouse.x / innerWidth - 0.5) * -60).toFixed(1)}px`);
          aurora.style.setProperty('--ay', `${((mouse.y / innerHeight - 0.5) * -40).toFixed(1)}px`);
        }
        if (sheenEl && sheenRect) {
          sheenEl.style.setProperty('--sx', `${(mouse.x - sheenRect.left).toFixed(0)}px`);
          sheenEl.style.setProperty('--sy', `${(mouse.y - sheenRect.top).toFixed(0)}px`);
        }
        if (!LITE && t - lastTrail > 18 && parts.length < 200) {
          lastTrail = t;
          parts.push({ x: mouse.x, y: mouse.y, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, g: 0, s: 2.2, life: 1, dur: 520, c: COLORS[(Math.random() * 3) | 0] });
        }
      }
      if (mouse.on) {
        const nx = lerp(cx, mouse.x, 0.2); const ny = lerp(cy, mouse.y, 0.2);
        if (Math.abs(nx - cx) > 0.05 || Math.abs(ny - cy) > 0.05) {
          cx = nx; cy = ny;
          c.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
        }
      }
    });
  }

  /* ---------- Tap/click: ripple + jelly + sparks ---------- */
  const RIPPLE = '.btn, .btn-ghost, .lang, .chip, .wa-fab, .wa-row, .pillar, .review, .contact-list a, .project-media, .feature, .hero-stats, .nav, .quote-card, .features li';
  document.addEventListener('pointerdown', (e) => {
    const host = e.target.closest && e.target.closest(RIPPLE);
    if (host) {
      const r = host.getBoundingClientRect();
      const s = Math.max(r.width, r.height) * 2.2;
      const sp = document.createElement('span');
      sp.className = 'ripple';
      sp.style.cssText = `--rs:${s.toFixed(0)}px;left:${(e.clientX - r.left).toFixed(0)}px;top:${(e.clientY - r.top).toFixed(0)}px`;
      host.classList.add('rpl-host');
      host.appendChild(sp);
      sp.addEventListener('animationend', () => sp.remove());
      if (host.matches('.btn, .btn-ghost, .lang, .chip, .wa-fab')) {
        host.classList.remove('jelly');
        void host.offsetWidth;
        host.classList.add('jelly');
      }
    }
    burst(e.clientX, e.clientY);
  });
  document.addEventListener('animationend', (e) => { if (e.animationName === 'jelly') e.target.classList.remove('jelly'); });

  /* ---------- Positions for scroll effects: measured once, re-measured on resize ---------- */
  const par = $$('[data-speed]').map((el) => ({ el, speed: parseFloat(el.dataset.speed) || 0, base: 0, last: 1e9 }));
  const proc = $('.process');
  const procSteps = proc ? $$('li', proc) : [];
  let procTop = 0; let procH = 1; let stepTops = [];
  const measure = () => {
    const sy = scrollY;
    for (const p of par) {
      p.el.style.translate = '';
      const r = p.el.getBoundingClientRect();
      p.base = r.top + sy + r.height / 2;
      p.last = 1e9;
    }
    if (proc) {
      const r = proc.getBoundingClientRect();
      procTop = r.top + sy; procH = r.height || 1;
      stepTops = procSteps.map((li) => li.getBoundingClientRect().top + sy);
    }
  };
  let mt;
  const remeasure = () => { clearTimeout(mt); mt = setTimeout(measure, 120); };
  window.novaReady.then(measure);
  addEventListener('resize', remeasure);
  if (window.ResizeObserver) new ResizeObserver(remeasure).observe(document.body);

  // parallax on [data-speed]
  onFrame(() => {
    const vh = innerHeight;
    const mid = scrollY + vh / 2;
    for (const p of par) {
      const off = p.base - mid;
      if (off > vh + 300 || off < -vh - 300) continue;
      const y = -off * p.speed;
      if (Math.abs(y - p.last) < 0.3) continue;
      p.last = y;
      p.el.style.translate = `0 ${y.toFixed(1)}px`;
    }
  });

  // "From idea to launch" line fills as you scroll
  if (proc) {
    let lastFill = -1;
    onFrame(() => {
      const vh = innerHeight;
      const line = scrollY + vh * 0.7;
      if (line < procTop - vh || line > procTop + procH + vh) return;
      const fill = clamp((line - procTop) / procH, 0, 1);
      if (Math.abs(fill - lastFill) < 0.002) return;
      lastFill = fill;
      proc.style.setProperty('--fill', fill.toFixed(3));
      procSteps.forEach((li, i) => li.classList.toggle('on', stepTops[i] < line));
    });
  }

  // marquee (desktop band + phone band): speeds up with scroll and reverses when you scroll up
  const tracks = $$('.marquee-track').map((tr) => ({ tr, wrap: tr.closest('.marquee-wrap'), x: 0, half: 0 }));
  if (tracks.length) {
    root.classList.add('js-marquee');
    const m = () => tracks.forEach((k) => { k.half = k.tr.scrollWidth / 2; });
    m();
    addEventListener('resize', m);
    if (document.fonts) document.fonts.ready.then(m);
    const sign = AR ? 1 : -1;
    onFrame((t, dt) => {
      const speed = (0.06 + Math.min(1.4, Math.abs(vel) * 0.025)) * dt;
      const sk = LITE ? 0 : clamp(vel * -0.3, -12, 12);
      for (const k of tracks) {
        if (k.wrap && k.wrap.classList.contains('off')) continue; // hidden or off screen
        if (!k.half) { k.half = k.tr.scrollWidth / 2; if (!k.half) continue; }
        k.x = (k.x + speed * dirSign + k.half) % k.half;
        k.tr.style.transform = `translate3d(${(sign * k.x).toFixed(1)}px,0,0) skewX(${sk.toFixed(2)}deg)`;
      }
    });
  }

  // grids lean with scroll speed (full mode only)
  const skewEls = $$('.work-grid, .pillars, .review-grid');
  let skew = 0;
  onFrame(() => {
    if (LITE) return;
    const next = lerp(skew, clamp(vel * 0.05, -3.5, 3.5), 0.1);
    if (Math.abs(next - skew) < 0.002) return;
    skew = next;
    const v = Math.abs(skew) < 0.01 ? '' : `skewY(${skew.toFixed(3)}deg)`;
    for (const el of skewEls) el.style.transform = v;
  });
  liteHooks.push(() => skewEls.forEach((el) => { el.style.transform = ''; }));

  /* ---------- Glitch on PORTFOLIO every few seconds ---------- */
  const word = $('.hero-word');
  if (word) {
    const glitch = () => {
      if (!document.hidden && heroOn) {
        word.classList.add('glitch');
        setTimeout(() => word.classList.remove('glitch'), 520);
      }
      setTimeout(glitch, 3800 + Math.random() * 3800);
    };
    window.novaReady.then(() => setTimeout(glitch, 2800));
  }

  /* ---------- Browser tab: call the visitor back ---------- */
  const title = document.title;
  const away = AR ? '👋 ارجع! — NOVA' : '👋 Come back! — NOVA';
  document.addEventListener('visibilitychange', () => { document.title = document.hidden ? away : title; });
})();

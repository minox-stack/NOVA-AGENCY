/* NOVA AGENCY — interactions */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  // Effects always play: the owner asked for motion everywhere.
  const reduce = false;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const AR = root.lang === 'ar';
  const T = AR ? {
    formErr: 'يرجى إدخال اسمك، بريد إلكتروني صحيح ورسالة قصيرة.',
    formErrWA: 'يرجى إدخال اسمك ورسالة قصيرة.',
    waCode: (c) => `رمز العميل: ${c}`,
    sending: 'جارٍ الإرسال…',
    sent: 'شكراً! وصلتني رسالتك — سأرد عليك قريباً.',
    sendFail: (e) => `تعذّر الإرسال الآن. راسلني على ${e} أو عبر واتساب.`,
    waOk: 'جارٍ فتح واتساب…',
    subject: (n) => `مشروع جديد — ${n}`,
    waHello: 'مرحباً أمين! وجدتك من خلال موقعك وأريد التحدث معك بخصوص مشروع.',
    waIntro: (n, e) => `مرحباً أمين! أنا ${n}${e ? ` (${e})` : ''}.`,
  } : {
    formErr: 'Please add your name, a valid email and a short message.',
    formErrWA: 'Please add your name and a short message.',
    waCode: (c) => `Client code: ${c}`,
    sending: 'Sending…',
    sent: "Thanks! Your message was sent — I'll get back to you soon.",
    sendFail: (e) => `Couldn't send right now. Write to ${e} or use WhatsApp.`,
    waOk: 'Opening WhatsApp…',
    subject: (n) => `New project — ${n}`,
    waHello: "Hi Amine! I found you through your portfolio and I'd like to talk about a project.",
    waIntro: (n, e) => `Hi Amine! I'm ${n}${e ? ` (${e})` : ''}.`,
  };

  /* ---------- WhatsApp: the number is never written on the page ---------- */
  const WA = atob('MjEzNzk2MjYzNTkx');
  const openWA = (text) => window.open(`https://wa.me/${WA}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  $$('[data-wa]').forEach((b) => b.addEventListener('click', () => openWA(T.waHello)));

  /* ---------- Intro: wait for the loader (fx.js), then play the hero ---------- */
  const ready = window.novaReady || Promise.resolve();
  let started = false;
  const start = () => { if (!started) { started = true; root.classList.add('loaded'); } };
  ready.then(start);
  setTimeout(start, 4500);

  /* ---------- Nav state, scroll progress, hero scroll parallax ---------- */
  const nav = $('.nav');
  const bar = $('.progress span');
  const word = $('.hero-word');
  const photo = $('.hero-photo');
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 30);
    const max = root.scrollHeight - window.innerHeight;
    bar.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
    if (!reduce && y < window.innerHeight * 1.2) word.style.setProperty('--sy', `${y * 0.28}px`);
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Hero mouse parallax ---------- */
  if (!reduce && finePointer) {
    const hero = $('.hero');
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      word.style.setProperty('--wx', `${-nx * 34}px`);
      word.style.setProperty('--wy', `${-ny * 14}px`);
      photo.style.setProperty('--px', `${nx * 16}px`);
      photo.style.setProperty('--py', `${ny * 8}px`);
    });
    hero.addEventListener('pointerleave', () => {
      ['--wx', '--wy'].forEach((p) => word.style.setProperty(p, '0px'));
      ['--px', '--py'].forEach((p) => photo.style.setProperty(p, '0px'));
    });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); revealIO.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  const observeReveals = () => $$('.reveal').forEach((el) => revealIO.observe(el));
  ready.then(observeReveals);
  setTimeout(observeReveals, 4500);

  /* ---------- Count-up numbers ---------- */
  const countUp = (el) => {
    const target = parseInt(el.dataset.count, 10);
    if (reduce || !target) { el.textContent = target; return; }
    const dur = 1500;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { countUp(en.target); countIO.unobserve(en.target); }
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => { if (!reduce) el.textContent = '0'; countIO.observe(el); });

  /* ---------- Work filters ---------- */
  const chips = $$('.chip');
  const projects = $$('.project');
  chips.forEach((chip) => chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    chips.forEach((c) => {
      const on = c === chip;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-pressed', String(on));
    });
    projects.forEach((p) => {
      const show = f === 'all' || p.dataset.cat === f;
      const wasHidden = p.classList.contains('is-hidden');
      p.classList.toggle('is-hidden', !show);
      if (show && wasHidden && !reduce && p.animate) {
        p.animate([{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }],
          { duration: 550, easing: 'cubic-bezier(.22,1,.36,1)' });
      }
    });
  }));

  /* ---------- Project details dialog ---------- */
  const DATA = {
    yassir: {
      img: 'assets/yassir.webp', brand: '#6407d8',
      en: {
        cat: 'Events', title: 'Yassir', role: 'Event Supervisor', alt: 'Yassir logo',
        desc: 'I worked as an Event Supervisor for Yassir — organising and managing activities during events, coordinating with the team and making sure everything ran in a smooth, organised way.',
        listTitle: 'What I did',
        list: ['Organised event activities', 'Managed the flow of each event', 'Coordinated with team members', 'Made sure every event ran smoothly'],
      },
      ar: {
        cat: 'فعاليات', title: 'Yassir', role: 'مشرف فعاليات (Event Supervisor)', alt: 'شعار Yassir',
        desc: 'عملت كمشرف فعاليات لدى Yassir، حيث ساهمت في تنظيم وإدارة الأنشطة خلال الفعاليات، والتنسيق مع الفريق، وضمان سير العمل بطريقة منظمة وسلسة.',
        listTitle: 'المهام',
        list: ['تنظيم الأنشطة', 'إدارة سير الفعاليات', 'التنسيق مع أعضاء الفريق', 'ضمان سير الفعالية بشكل جيد'],
      },
    },
    abayaty: {
      img: 'assets/abayti.webp', brand: '#ffffff',
      en: {
        cat: 'Web Development', title: 'abayaty.tn', role: 'E-commerce Website Development', alt: 'Abayti logo',
        desc: 'A modern website for an e-commerce brand, designed and developed with a strong focus on UX/UI, a clear shopping experience and solid performance.',
        listTitle: 'Focus',
        list: ['UX/UI design', 'A clear, easy user experience', 'Performance optimisation', 'A modern design made for e-commerce'],
      },
      ar: {
        cat: 'تطوير المواقع', title: 'abayaty.tn', role: 'تطوير موقع تجارة إلكترونية', alt: 'شعار عبايتي',
        desc: 'تطوير موقع إلكتروني حديث لمشروع تجارة إلكترونية، مع التركيز على تصميم UX/UI، تجربة تسوّق واضحة، وأداء قوي.',
        listTitle: 'محاور التركيز',
        list: ['تصميم UX/UI', 'تجربة مستخدم واضحة وسهلة', 'تحسين الأداء', 'تصميم عصري يناسب التجارة الإلكترونية'],
      },
    },
    myhome: {
      img: 'assets/myhome.webp', brand: '#f8f8f8',
      en: {
        cat: 'Social Ads', title: 'My Home', role: 'Social Media Advertising & Marketing', alt: 'My Home logo',
        desc: 'Managed and optimised paid advertising campaigns for a company specialised in home goods — to reach more people and bring in new customers.',
        listTitle: 'Goals',
        list: ['Increase ad reach', 'Improve campaign performance', 'Reach new customers', 'Help grow online sales'],
      },
      ar: {
        cat: 'إعلانات ممولة', title: 'My Home', role: 'إعلانات مواقع التواصل والتسويق', alt: 'شعار My Home',
        desc: 'إدارة وتحسين الحملات الإعلانية الممولة لشركة مختصة في مستلزمات المنزل، بهدف الوصول إلى عملاء جدد وزيادة المبيعات عبر الإنترنت.',
        listTitle: 'الأهداف',
        list: ['زيادة وصول الإعلانات', 'تحسين أداء الحملات', 'الوصول إلى عملاء جدد', 'المساهمة في زيادة المبيعات عبر الإنترنت'],
      },
    },
  };
  const modal = $('#project-modal');
  const openProject = (key) => {
    const p = DATA[key];
    if (!p || !modal.showModal) return;
    const d = { ...p, ...p[AR ? 'ar' : 'en'] };
    $('.modal-media', modal).style.setProperty('--brand', d.brand);
    const img = $('#modal-img');
    img.src = d.img; img.alt = d.alt;
    $('#modal-cat').textContent = d.cat;
    $('#modal-title').textContent = d.title;
    $('#modal-role').textContent = d.role;
    $('#modal-desc').textContent = d.desc;
    $('#modal-list-title').textContent = d.listTitle;
    const ul = $('#modal-list');
    ul.replaceChildren(...d.list.map((t) => { const li = document.createElement('li'); li.textContent = t; return li; }));
    if (window.novaLenis) window.novaLenis.stop();
    document.body.classList.add('modal-open');
    modal.showModal();
    modal.scrollTop = 0;
  };
  modal.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    if (window.novaLenis) window.novaLenis.start();
  });
  $$('.project-open').forEach((b) => b.addEventListener('click', () => openProject(b.dataset.project)));
  $('.modal-close').addEventListener('click', () => modal.close());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });
  $('#modal-cta').addEventListener('click', () => modal.close());

  /* ---------- Contact form → opens the visitor's email app ---------- */
  const form = $('#contact-form');
  const note = $('.form-note', form);
  // the contact address is read from the page's own mailto link (one place to change it)
  const EMAIL = (($('.contact-list a[href^="mailto:"]') || {}).getAttribute?.('href') || '').replace(/^mailto:/, '');
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let lastSend = 'email';
  $$('[data-send]', form).forEach((b) => b.addEventListener('click', () => { lastSend = b.dataset.send; }));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const via = (e.submitter && e.submitter.dataset.send) || lastSend;
    lastSend = 'email';
    const val = (n) => form.elements[n].value.trim();
    const checks = {
      name: !!val('name'),
      // WhatsApp doesn't need an email; if one is typed it must be valid
      email: via === 'wa' ? (!val('email') || EMAIL_RE.test(val('email'))) : EMAIL_RE.test(val('email')),
      message: !!val('message'),
    };
    let ok = true;
    Object.entries(checks).forEach(([n, valid]) => {
      form.elements[n].closest('.field').classList.toggle('invalid', !valid);
      form.elements[n].setAttribute('aria-invalid', String(!valid));
      if (!valid) ok = false;
    });
    if (!ok) {
      note.className = 'form-note err';
      note.textContent = via === 'wa' ? T.formErrWA : T.formErr;
      const first = Object.keys(checks).find((k) => !checks[k]);
      form.elements[first].focus();
      return;
    }
    // the same client (same email, or same name when there's no email) always keeps the same code
    const code = clientCode(val('email') || val('name'));
    if (via === 'wa') {
      openWA(`${T.waIntro(val('name'), val('email'))}\n\n${val('message')}\n\n${T.waCode(code)}`);
      note.className = 'form-note ok';
      note.textContent = T.waOk;
      return;
    }
    // Email: delivered straight to the inbox through Formspree (the same form the old site used)
    const btn = $('[data-send="email"]', form);
    const now = new Date();
    const entry = { code, issued: issuedOn(now), name: val('name'), email: val('email'), message: val('message') };
    // the client code is in the email subject and in its own field, so every client is easy to tell apart
    const subject = `${T.subject(entry.name)} · ${entry.code}`;
    const data = new FormData(form);
    data.append('_subject', subject);
    data.append('client_code', entry.code);
    btn.disabled = true;
    note.className = 'form-note';
    note.textContent = T.sending;
    // If Formspree refuses the quick (background) send — e.g. its anti-spam check —
    // fall back to a normal form post: it opens Formspree's page and still delivers the message.
    const classicSubmit = () => {
      const extras = [['_subject', subject], ['client_code', entry.code]].map(([n, v]) => {
        const el = document.createElement('input');
        el.type = 'hidden'; el.name = n; el.value = v;
        form.appendChild(el);
        return el;
      });
      HTMLFormElement.prototype.submit.call(form);
      setTimeout(() => { btn.disabled = false; extras.forEach((el) => el.remove()); }, 4000);
    };
    fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      .then((res) => {
        if (!res.ok) throw new Error(`Formspree ${res.status}`);
        form.reset();
        note.className = 'form-note ok';
        note.textContent = T.sent;
        btn.disabled = false;
        showCard(entry);
      })
      .catch((err) => {
        if (navigator.onLine !== false) { classicSubmit(); return; }
        note.className = 'form-note err';
        note.textContent = T.sendFail(EMAIL);
        btn.disabled = false;
      });
  });
  form.addEventListener('input', (e) => {
    const f = e.target.closest('.field');
    if (f) { f.classList.remove('invalid'); e.target.removeAttribute('aria-invalid'); }
  });

  /* ---------- Client code: one per client (same email = same code); it also goes to the owner's inbox ---------- */
  const CODE_ABC = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // no 0/O/1/I — easy to read out loud
  function clientCode(key) {
    const k = String(key || '').trim().toLowerCase();
    let map = {};
    try { map = JSON.parse(localStorage.getItem('novaClients') || '{}') || {}; } catch (err) { /* private mode */ }
    if (k && /^NV-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(map[k] || '')) return map[k];
    const b = new Uint8Array(8);
    crypto.getRandomValues(b);
    const s = Array.from(b, (v) => CODE_ABC[v % 32]).join('');
    const code = `NV-${s.slice(0, 4)}-${s.slice(4)}`;
    if (k) { map[k] = code; try { localStorage.setItem('novaClients', JSON.stringify(map)); } catch (err) { /* ignore */ } }
    return code;
  }
  const issuedOn = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`;

  /* ---------- NOVA client card: shown after "Send by email", saved to the phone as an image ---------- */
  const rc = $('#receipt-modal');
  const ncCard = $('#nova-card');
  let lastCard = null;
  let cardBlob = null;
  let scrambleTimer = 0;
  let prerender = 0;
  let idleRaf = 0;
  let touched = 0;
  const randomCode = (code) => code.replace(/[A-Z0-9]/g, () => CODE_ABC[(Math.random() * 32) | 0]);
  // the code "decodes" from random characters, left to right
  const scramble = (el, text) => {
    clearInterval(scrambleTimer);
    let frame = 0;
    const total = 24;
    scrambleTimer = setInterval(() => {
      frame += 1;
      const lock = Math.floor((frame / total) * text.length);
      el.textContent = [...text].map((ch, i) => (i < lock || ch === '-' ? ch : CODE_ABC[(Math.random() * 32) | 0])).join('');
      if (frame >= total) { clearInterval(scrambleTimer); el.textContent = text; }
    }, 42);
  };
  // 3D tilt + moving light and holographic foil (px, py from 0 to 1)
  const setTilt = (px, py, live) => {
    ncCard.style.setProperty('--ry', `${((px - 0.5) * 22).toFixed(2)}deg`);
    ncCard.style.setProperty('--rx', `${((0.5 - py) * 16).toFixed(2)}deg`);
    ncCard.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    ncCard.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    ncCard.style.setProperty('--px', ((px - 0.5) * 2).toFixed(3));
    ncCard.style.setProperty('--py', ((py - 0.5) * 2).toFixed(3));
    ncCard.classList.toggle('is-live', !!live);
  };
  // when nobody touches it, the card slowly "breathes" so the light keeps moving
  const idle = (t) => {
    if (performance.now() - touched > 2600) setTilt(0.5 + Math.sin(t / 1900) * 0.3, 0.42 + Math.cos(t / 2600) * 0.24, true);
    idleRaf = requestAnimationFrame(idle);
  };

  function showCard(r) {
    if (!rc || !rc.showModal || !ncCard) return;
    lastCard = r;
    cardBlob = null;
    $('#nc-name').textContent = r.name;
    $('#nc-email').textContent = r.email;
    $('#nc-msg').textContent = r.message.replace(/\s+/g, ' ');
    $('#nc-msg').classList.toggle('is-rtl', RTL_RE.test(r.message));
    $('#nc-date').textContent = r.issued;
    $$('.rc-code', rc).forEach((el) => { el.textContent = r.code; });
    const codeEl = $('#nc-code');
    codeEl.textContent = randomCode(r.code);
    // replay the entrance every time the card opens
    [ncCard, $('.nc-sweep', ncCard)].forEach((el) => { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; });
    $('.rc-burst', rc).replaceChildren(...Array.from({ length: 14 }, (_, i) => {
      const s = document.createElement('i');
      s.style.cssText = `--a:${i * (360 / 14)}deg;--dl:${(0.45 + (i % 3) * 0.06).toFixed(2)}s;--c:${['#ff4d7d', '#ffd1de', '#f8de93', '#c084fc'][i % 4]}`;
      return s;
    }));
    setTilt(0.5, 0.5, false);
    touched = performance.now() + 1200;
    if (window.novaLenis) window.novaLenis.stop();
    document.body.classList.add('modal-open');
    rc.showModal();
    rc.scrollTop = 0;
    setTimeout(() => scramble(codeEl, r.code), 650);
    cancelAnimationFrame(idleRaf);
    idleRaf = requestAnimationFrame(idle);
    // draw the image in the background, so "Save" is instant (phones only allow sharing right after a tap)
    clearTimeout(prerender);
    prerender = setTimeout(() => { cardBlob = renderCard(r).catch(() => null); }, 1600);
  }
  if (rc && ncCard) {
    const stage = $('#nc-stage');
    stage.addEventListener('pointermove', (e) => {
      const b = ncCard.getBoundingClientRect();
      touched = performance.now();
      setTilt(Math.min(1, Math.max(0, (e.clientX - b.left) / b.width)), Math.min(1, Math.max(0, (e.clientY - b.top) / b.height)), true);
    });
    stage.addEventListener('pointerleave', () => { touched = performance.now(); setTilt(0.5, 0.5, false); });
    rc.addEventListener('close', () => {
      cancelAnimationFrame(idleRaf);
      clearInterval(scrambleTimer);
      clearTimeout(prerender);
      document.body.classList.remove('modal-open');
      if (window.novaLenis) window.novaLenis.start();
    });
    rc.addEventListener('click', (e) => { if (e.target === rc) rc.close(); });
    $('#rc-close').addEventListener('click', () => rc.close());
    $('#rc-save').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      if (!lastCard) return;
      btn.disabled = true;
      try { await saveCard(lastCard); } finally { btn.disabled = false; }
    });
  }

  async function saveCard(r) {
    if (!cardBlob) cardBlob = renderCard(r).catch(() => null);
    const blob = await cardBlob;
    if (!blob) return;
    const name = `NOVA-card-${r.code}.jpg`;
    // iPhone / iPad: the share sheet has "Save Image" → straight to Photos
    const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (ios && navigator.canShare) {
      const file = new File([blob], name, { type: 'image/jpeg' });
      if (navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: 'NOVA Agency' }); return; } catch (err) { if (err && err.name === 'AbortError') return; }
      }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  /* ---------- The saved image: the same card, drawn on a canvas at high resolution ---------- */
  const loadImg = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  const RTL_RE = /[֐-ࣿ]/;
  async function renderCard(r) {
    try { await Promise.all(['800 30px Inter', '700 30px Inter', '600 30px Inter', 'italic 500 30px Inter', '700 30px Cairo'].map((f) => document.fonts.load(f))); } catch (err) { /* fallback fonts */ }
    const [mark, word] = await Promise.all([loadImg('assets/nova-mark.webp'), loadImg('assets/nova-wordmark.webp')]);
    const W = 1600; const H = 1180;
    const CW = 1400; const CH = Math.round(CW / 1.586);
    const X = (W - CW) / 2; const Y = 96;
    const s = CW / 100; // 1cqw
    const R = 5 * s;
    const FONT = '"Inter", "Cairo", "Segoe UI", Tahoma, sans-serif';
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');
    const rr = (px, py, w, h, rad) => {
      x.beginPath();
      if (x.roundRect) { x.roundRect(px, py, w, h, rad); return; }
      x.moveTo(px + rad, py); x.arcTo(px + w, py, px + w, py + h, rad); x.arcTo(px + w, py + h, px, py + h, rad);
      x.arcTo(px, py + h, px, py, rad); x.arcTo(px, py, px + w, py, rad); x.closePath();
    };
    const glow = (cx, cy, rad, rgb, a) => {
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
      g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
      x.fillStyle = g; x.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
    };
    const spaced = (text, px, py, spacing, align) => {
      const chars = [...text];
      const ws = chars.map((ch) => x.measureText(ch).width);
      const total = ws.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
      let cx = align === 'right' ? px - total : align === 'center' ? px - total / 2 : px;
      x.textAlign = 'left'; x.direction = 'ltr';
      chars.forEach((ch, i) => { x.fillText(ch, cx, py); cx += ws[i] + spacing; });
      return total;
    };
    const fit = (t, max) => {
      if (x.measureText(t).width <= max) return t;
      let u = t;
      while (u.length && x.measureText(`${u}…`).width > max) u = u.slice(0, -1);
      return `${u.trim()}…`;
    };
    const text = (t, px, py, max, align) => {
      const rtl = RTL_RE.test(t);
      x.direction = rtl ? 'rtl' : 'ltr';
      const v = fit(t, max);
      if (align === 'right' || (align === 'auto' && rtl)) { x.textAlign = 'right'; x.fillText(v, px + max, py); }
      else { x.textAlign = 'left'; x.fillText(v, px, py); }
      x.direction = 'ltr';
    };

    // backdrop
    x.fillStyle = '#0a0509'; x.fillRect(0, 0, W, H);
    glow(W * 0.5, Y + CH * 0.62, 900, '250,29,76', 0.3);
    glow(W * 0.1, 60, 560, '122,6,50', 0.5);
    // soft glow under the card
    x.save();
    x.shadowColor = 'rgba(250,29,76,0.6)'; x.shadowBlur = 140; x.shadowOffsetY = 60;
    rr(X + 70, Y + 50, CW - 140, CH - 50, R); x.fillStyle = '#5c0a2c'; x.fill();
    x.restore();

    // card body
    x.save();
    rr(X, Y, CW, CH, R); x.clip();
    let g = x.createLinearGradient(X, Y, X + CW, Y + CH);
    [[0, '#2b0719'], [0.38, '#5c0a2c'], [0.72, '#b3123f'], [1, '#ff4d7d']].forEach(([o, col]) => g.addColorStop(o, col));
    x.fillStyle = g; x.fillRect(X, Y, CW, CH);
    glow(X + 0.87 * CW, Y + 60, 494, '255,140,175', 0.95);
    glow(X + 126, Y + 942, 570, '250,29,76', 0.95);
    glow(X + 1190, Y + 979, 393, '150,70,255', 0.7);
    // liquid glass: curved top highlight + frosted pane
    x.save();
    x.translate(X + 0.28 * CW, Y - 0.12 * CH); x.scale(1, (0.6 * CH) / (1.2 * CW));
    const hg = x.createRadialGradient(0, 0, 0, 0, 0, 1.2 * CW * 0.6);
    hg.addColorStop(0, 'rgba(255,255,255,0.34)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = hg; x.fillRect(-2 * CW, -2 * CW, 4 * CW, 4 * CW);
    x.restore();
    g = x.createLinearGradient(X, Y, X + CW * 0.34, Y + CH);
    g.addColorStop(0, 'rgba(255,255,255,0.14)'); g.addColorStop(0.45, 'rgba(255,255,255,0.02)'); g.addColorStop(1, 'rgba(255,255,255,0.07)');
    x.fillStyle = g; x.fillRect(X, Y, CW, CH);
    // grain
    const n = document.createElement('canvas'); n.width = 160; n.height = 160;
    const nx = n.getContext('2d'); const id = nx.createImageData(160, 160);
    for (let i = 0; i < id.data.length; i += 4) { const v = (Math.random() * 255) | 0; id.data[i] = v; id.data[i + 1] = v; id.data[i + 2] = v; id.data[i + 3] = 255; }
    nx.putImageData(id, 0, 0);
    x.globalCompositeOperation = 'overlay'; x.globalAlpha = 0.1;
    x.fillStyle = x.createPattern(n, 'repeat'); x.fillRect(X, Y, CW, CH);
    // holographic foil
    x.globalCompositeOperation = 'color-dodge'; x.globalAlpha = 0.5;
    const dx = Math.sin(115 * Math.PI / 180); const dy = -Math.cos(115 * Math.PI / 180);
    const L = (1.8 * CW * Math.abs(dx) + 1.8 * CH * Math.abs(dy)) / 2;
    const mx = X + CW / 2; const my = Y + CH / 2;
    g = x.createLinearGradient(mx - dx * L, my - dy * L, mx + dx * L, my + dy * L);
    [[0, 'rgba(0,0,0,0)'], [0.34, 'rgba(0,0,0,0)'], [0.42, 'rgba(255,0,128,0.45)'], [0.46, 'rgba(255,214,102,0.4)'], [0.5, 'rgba(0,255,200,0.38)'], [0.54, 'rgba(120,120,255,0.42)'], [0.62, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0)']]
      .forEach(([o, col]) => g.addColorStop(o, col));
    x.fillStyle = g; x.fillRect(X, Y, CW, CH);
    // light
    x.globalCompositeOperation = 'soft-light'; x.globalAlpha = 1;
    glow(X + 0.3 * CW, Y + 0.2 * CH, 556, '255,255,255', 0.7);
    x.globalCompositeOperation = 'source-over';
    x.restore();
    // rim
    g = x.createLinearGradient(X, Y, X + CW, Y + CH);
    [[0, 'rgba(255,255,255,0.85)'], [0.25, 'rgba(255,255,255,0.08)'], [0.5, 'rgba(255,170,200,0.7)'], [0.75, 'rgba(255,255,255,0.08)'], [1, 'rgba(255,255,255,0.6)']].forEach(([o, col]) => g.addColorStop(o, col));
    x.strokeStyle = g; x.lineWidth = 3; rr(X + 1.5, Y + 1.5, CW - 3, CH - 3, R - 1.5); x.stroke();

    // content
    const PL = X + 6.2 * s; const PR = X + CW - 6.2 * s; const PT = Y + 5.2 * s; const PB = Y + CH - 5 * s;
    x.fillStyle = '#fff'; x.textBaseline = 'alphabetic';
    // logo
    const mh = 8.4 * s; let mw = mh;
    if (mark) {
      mw = mh * (mark.width / mark.height);
      x.save(); x.shadowColor = 'rgba(255,255,255,0.35)'; x.shadowBlur = 2 * s; x.drawImage(mark, PL, PT, mw, mh); x.restore();
    }
    if (word) { const wh = 2.9 * s; x.drawImage(word, PL + mw + 2.2 * s, PT + (mh - wh) / 2, wh * (word.width / word.height), wh); }
    // tier + contactless
    const iw = 4.8 * s; const ty = PT + mh / 2;
    x.save(); x.translate(PR - iw, ty - iw / 2); x.scale(iw / 24, iw / 24);
    x.strokeStyle = 'rgba(255,255,255,0.88)'; x.lineWidth = 2.2; x.lineCap = 'round';
    x.stroke(new Path2D('M6.5 8.5a5 5 0 0 1 0 7M10 6a8.5 8.5 0 0 1 0 12M13.5 3.5a12 12 0 0 1 0 17'));
    x.restore();
    x.fillStyle = 'rgba(255,255,255,0.88)'; x.font = `800 ${2.5 * s}px ${FONT}`;
    spaced('CLIENT', PR - iw - 1.2 * s, ty + 2.5 * s * 0.36, 0.3 * 2.5 * s, 'right');

    // bottom row
    const valY = PB - 0.3 * s; const labY = valY - 2.8 * s - 0.9 * s - 0.3 * s;
    const IW = PR - PL; const gap = 4 * s;
    x.font = `700 ${2.8 * s}px ${FONT}`;
    const issW = Math.max(x.measureText(r.issued).width, 150);
    const rest = IW - issW - 2 * gap;
    const hW = rest * (1 / 2.6); const eW = rest - hW;
    const cols = [[PL, hW, 'Card holder', r.name.toUpperCase()], [PL + hW + gap, eW, 'Email', r.email], [PR - issW, issW, 'Issued', r.issued]];
    cols.forEach(([cx, w, lab, val], i) => {
      x.fillStyle = 'rgba(255,255,255,0.62)'; x.font = `700 ${1.9 * s}px ${FONT}`;
      spaced(lab.toUpperCase(), i === 2 ? cx + w : cx, labY, 0.2 * 1.9 * s, i === 2 ? 'right' : 'left');
      x.fillStyle = '#fff'; x.font = `${i === 1 ? 600 : 700} ${2.8 * s}px ${FONT}`;
      text(val, cx, valY, w, i === 2 ? 'right' : 'left');
    });

    // client code — embossed silver
    const codeSize = 6.2 * s;
    const codeY = labY - 1.9 * s - 3.4 * s - codeSize * 0.18;
    x.font = `700 ${codeSize}px ${FONT}`;
    x.fillStyle = 'rgba(60,0,20,0.55)';
    spaced(r.code, PL, codeY + 0.35 * s, 0.14 * codeSize, 'left');
    g = x.createLinearGradient(0, codeY - codeSize * 0.75, 0, codeY);
    g.addColorStop(0.12, '#ffffff'); g.addColorStop(0.55, '#f6dfe7'); g.addColorStop(1, '#caa3b3');
    x.save(); x.shadowColor = 'rgba(255,255,255,0.25)'; x.shadowBlur = 2 * s;
    x.fillStyle = g; spaced(r.code, PL, codeY, 0.14 * codeSize, 'left');
    x.restore();

    // chip + message, centred between the logo row and the code
    const midTop = PT + mh; const midBot = codeY - codeSize * 0.8;
    const cy = (midTop + midBot) / 2;
    const chW = 11.5 * s; const chH = chW / 1.3;
    g = x.createLinearGradient(PL, cy - chH / 2, PL + chW, cy + chH / 2);
    [[0, '#fff3c6'], [0.38, '#d6ab4e'], [0.58, '#f8de93'], [1, '#b98830']].forEach(([o, col]) => g.addColorStop(o, col));
    x.save(); x.shadowColor = 'rgba(0,0,0,0.35)'; x.shadowBlur = 1.4 * s; x.shadowOffsetY = 0.6 * s;
    rr(PL, cy - chH / 2, chW, chH, 1.8 * s); x.fillStyle = g; x.fill();
    x.restore();
    x.save(); rr(PL, cy - chH / 2, chW, chH, 1.8 * s); x.clip();
    x.strokeStyle = 'rgba(90,60,10,0.45)'; x.lineWidth = 0.3 * s;
    [0.3, 0.7].forEach((f) => { x.beginPath(); x.moveTo(PL, cy - chH / 2 + chH * f); x.lineTo(PL + chW, cy - chH / 2 + chH * f); x.stroke(); });
    [0.36, 0.64].forEach((f) => { x.beginPath(); x.moveTo(PL + chW * f, cy - chH / 2); x.lineTo(PL + chW * f, cy + chH / 2); x.stroke(); });
    x.restore();
    const mx0 = PL + chW + 4 * s; const mW = PR - mx0;
    const fs = 3 * s; const lh = fs * 1.45;
    x.font = `italic 500 ${fs}px ${FONT}`; x.fillStyle = 'rgba(255,255,255,0.9)';
    const rtlMsg = RTL_RE.test(r.message);
    x.direction = rtlMsg ? 'rtl' : 'ltr';
    const plain = r.message.replace(/\s+/g, ' ').trim();
    const words = (rtlMsg ? plain : `“${plain}”`).split(' ');
    const lines = [];
    let line = '';
    words.forEach((w) => { const t = line ? `${line} ${w}` : w; if (x.measureText(t).width > mW && line) { lines.push(line); line = w; } else line = t; });
    if (line) lines.push(line);
    const shown = lines.slice(0, 2);
    if (lines.length > 2) shown[1] = `${shown[1]} ${lines.slice(2).join(' ')}`;
    const first = cy - ((shown.length - 1) * lh) / 2 + fs * 0.35;
    shown.forEach((ln, i) => text(ln, mx0, first + i * lh, mW, rtlMsg ? 'right' : 'left'));

    // footer
    x.fillStyle = 'rgba(255,255,255,0.5)'; x.font = `600 28px ${FONT}`;
    spaced('NOVA AGENCY  ·  NOVADZ.SPACE', W / 2, Y + CH + (H - Y - CH) / 2 + 22, 8, 'center');

    return new Promise((res) => c.toBlob(res, 'image/jpeg', 0.92)); // JPEG: a few hundred KB instead of several MB
  }

  /* ---------- Visitor comments: stored in a Google Sheet, shown after the owner approves ---------- */
  // Paste the Google Apps Script "Web app" URL here (see comments-backend/SETUP.md). Empty = comments off.
  const COMMENTS_API = 'https://script.google.com/macros/s/AKfycbzPsDuYuQvTYGnaMBTK6zE2GTnQqHyQys5V2-WpoO8zClT4YRIb7pwAEusXPMF31GksIw/exec';
  const SERVICE_LABELS = AR
    ? { web: 'تطوير موقع إلكتروني', video: 'مونتاج فيديو', ads: 'إعلانات مواقع التواصل', uxui: 'تصميم UX/UI', events: 'فعاليات', other: 'أخرى' }
    : { web: 'Website development', video: 'Video editing', ads: 'Social media ads', uxui: 'UX/UI design', events: 'Events', other: 'Other' };
  const CM = AR ? {
    err: 'يرجى كتابة الاسم واللقب، اختيار الخدمة، وكتابة تعليق.',
    sending: 'جارٍ الإرسال…',
    ok: 'شكراً! وصلني تعليقك — سيظهر هنا بعد موافقتي.',
    fail: 'تعذّر الإرسال الآن، حاول مرة أخرى بعد قليل.',
    off: 'التعليقات غير مفعّلة بعد.',
  } : {
    err: 'Please add your first and last name, choose a service and write a comment.',
    sending: 'Sending…',
    ok: 'Thanks! I got your comment — it will appear here after I approve it.',
    fail: "Couldn't send right now — please try again in a moment.",
    off: 'Comments are not switched on yet.',
  };
  const grid = $('.review-grid');
  // until the Google Sheet is connected, don't show a button that can't work
  if (!COMMENTS_API) { const cta = $('.comments-cta'); if (cta) cta.remove(); }
  const shortDate = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    try { return new Intl.DateTimeFormat(AR ? 'ar-DZ' : 'en-GB', { dateStyle: 'medium' }).format(d); } catch (err) { return ''; }
  };
  // built with textContent only, so nothing a visitor types can run as code
  const renderComments = (list) => {
    $$('.user-comment', grid).forEach((el) => el.remove());
    list.forEach((c, i) => {
      const fig = document.createElement('figure');
      fig.className = 'review lg user-comment';
      fig.style.setProperty('--i', i);
      const q = document.createElement('span');
      q.className = 'q'; q.setAttribute('aria-hidden', 'true'); q.textContent = AR ? '”' : '“';
      const bq = document.createElement('blockquote');
      bq.dir = 'auto'; bq.textContent = c.comment;
      const cap = document.createElement('figcaption');
      const av = document.createElement('span');
      av.className = 'avatar'; av.setAttribute('aria-hidden', 'true');
      av.textContent = String(c.first || '?').trim().charAt(0).toUpperCase();
      const who = document.createElement('div');
      const b = document.createElement('b');
      b.dir = 'auto'; b.textContent = `${c.first || ''} ${c.last || ''}`.trim();
      const sm = document.createElement('small');
      sm.textContent = [SERVICE_LABELS[c.service] || SERVICE_LABELS.other, shortDate(c.date)].filter(Boolean).join(' · ');
      who.append(b, sm);
      cap.append(av, who);
      fig.append(q, bq, cap);
      grid.appendChild(fig);
    });
  };
  const loadComments = () => {
    if (!COMMENTS_API || !grid) return;
    try {
      const o = JSON.parse(sessionStorage.getItem('novaComments') || 'null');
      if (o && Date.now() - o.t < 120000) { renderComments(o.list); return; }
    } catch (err) { /* no cache */ }
    fetch(COMMENTS_API)
      .then((r) => r.json())
      .then((d) => {
        if (!d || !d.ok || !Array.isArray(d.comments)) return;
        renderComments(d.comments);
        try { sessionStorage.setItem('novaComments', JSON.stringify({ t: Date.now(), list: d.comments })); } catch (err) { /* ignore */ }
      })
      .catch(() => { /* the three fixed reviews stay */ });
  };
  if (grid && COMMENTS_API) {
    const cio = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { cio.disconnect(); loadComments(); }
    }, { rootMargin: '700px 0px' });
    cio.observe(grid);
  }

  const cmModal = $('#comment-modal');
  const cmForm = $('#comment-form');
  if (cmModal && cmForm) {
    const cmNote = $('.form-note', cmForm);
    const cmBtn = $('button[type="submit"]', cmForm);
    const openBtn = $('#open-comment');
    if (openBtn) openBtn.addEventListener('click', () => {
      if (window.novaLenis) window.novaLenis.stop();
      document.body.classList.add('modal-open');
      cmModal.showModal();
      if (!COMMENTS_API) { cmNote.className = 'form-note err'; cmNote.textContent = CM.off; }
    });
    $('.modal-close', cmModal).addEventListener('click', () => cmModal.close());
    cmModal.addEventListener('click', (e) => { if (e.target === cmModal) cmModal.close(); });
    cmModal.addEventListener('close', () => {
      document.body.classList.remove('modal-open');
      if (window.novaLenis) window.novaLenis.start();
    });
    cmForm.addEventListener('input', (e) => { const f = e.target.closest('.field'); if (f) f.classList.remove('invalid'); });
    cmForm.addEventListener('change', (e) => { const f = e.target.closest('.field'); if (f) f.classList.remove('invalid'); });
    cmForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = (n) => cmForm.elements[n].value.trim();
      const checks = { first: !!v('first'), last: !!v('last'), service: !!v('service'), comment: v('comment').length >= 3 };
      let ok = true;
      Object.entries(checks).forEach(([n, good]) => {
        cmForm.elements[n].closest('.field').classList.toggle('invalid', !good);
        if (!good) ok = false;
      });
      if (!ok) {
        cmNote.className = 'form-note err';
        cmNote.textContent = CM.err;
        cmForm.elements[Object.keys(checks).find((k) => !checks[k])].focus();
        return;
      }
      if (!COMMENTS_API) { cmNote.className = 'form-note err'; cmNote.textContent = CM.off; return; }
      cmBtn.disabled = true;
      cmNote.className = 'form-note';
      cmNote.textContent = CM.sending;
      const payload = {
        first: v('first'), last: v('last'), service: v('service'), comment: v('comment'),
        website: cmForm.elements.website.value, // hidden field: only bots fill it
        lang: AR ? 'ar' : 'en',
      };
      // text/plain keeps this a "simple" request, which Google Apps Script accepts from any site
      fetch(COMMENTS_API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
        .then((r) => r.json())
        .then((d) => {
          if (!d || !d.ok) throw new Error('rejected');
          cmForm.reset();
          cmNote.className = 'form-note ok';
          cmNote.textContent = CM.ok;
        })
        .catch(() => { cmNote.className = 'form-note err'; cmNote.textContent = CM.fail; })
        .finally(() => { cmBtn.disabled = false; });
    });
  }

  /* ---------- Live status: Available / Busy, switched from the "Status" tab of the same Google Sheet ---------- */
  const ST = AR ? {
    available: { long: 'متاح للعمل', short: 'متاح', line: 'متاح لمشاريع جديدة — راسلني ولنبدأ.' },
    busy: { long: 'مشغول حالياً', short: 'مشغول', line: 'مشغول حالياً — يمكنك مراسلتي وسأرد عليك فور تفرّغي.' },
  } : {
    available: { long: 'Available for work', short: 'Available', line: "Available for new projects — message me and let's start." },
    busy: { long: 'Busy right now', short: 'Busy', line: "Busy right now — you can still message me, I'll reply as soon as I'm free." },
  };
  const statusEls = $$('[data-status]');
  const STATUS_TTL = 120000; // same 2 minutes as the comments
  const showStatus = (s) => {
    if (!s || !ST[s.state]) return;
    const L = ST[s.state];
    // optional note from the sheet (B2 English, B3 Arabic), e.g. "back on 5 December"
    const note = (AR ? s.noteAr || s.note : s.note || s.noteAr) || '';
    statusEls.forEach((el) => {
      el.dataset.state = s.state;
      const put = (sel, txt) => { const n = $(sel, el); if (n) n.textContent = txt; };
      put('.st-long', L.long);
      put('.st-short', L.short);
      put('.st-text', note ? `${L.long} — ${note}` : L.line);
      if (el.tagName === 'A') el.title = note ? `${L.long} — ${note}` : L.long;
    });
  };
  const loadStatus = () => {
    if (!COMMENTS_API || !statusEls.length) return;
    try {
      const o = JSON.parse(sessionStorage.getItem('novaStatus') || 'null');
      if (o && Date.now() - o.t < STATUS_TTL) { showStatus(o.s); return; }
    } catch (err) { /* no cache */ }
    fetch(`${COMMENTS_API}?status=1`)
      .then((r) => r.json())
      .then((d) => {
        if (!d || !d.ok || !d.status) return;
        showStatus(d.status);
        try { sessionStorage.setItem('novaStatus', JSON.stringify({ t: Date.now(), s: d.status })); } catch (err) { /* ignore */ }
      })
      .catch(() => { /* no badge if the sheet can't be reached */ });
  };
  if (statusEls.length && COMMENTS_API) {
    if (document.readyState === 'complete') loadStatus();
    else addEventListener('load', loadStatus, { once: true });
    // stays live while the page is open: re-checks every ~2 minutes, and when the tab comes back into view
    setInterval(() => { if (!document.hidden) loadStatus(); }, STATUS_TTL + 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) loadStatus(); });
  }

  /* ---------- Language switch: open the other language at the same section (remembered, not put in the address) ---------- */
  $$('.lang').forEach((a) => a.addEventListener('click', () => {
    const mid = innerHeight / 2;
    const cur = $$('main section[id]').find((s) => {
      const r = s.getBoundingClientRect();
      return r.top <= mid && r.bottom >= mid;
    });
    try {
      if (cur && cur.id !== 'home') sessionStorage.setItem('novaGoto', cur.id);
      else sessionStorage.removeItem('novaGoto');
    } catch (err) { /* ignore */ }
  }));

  /* ---------- Clean address bar: novadz.space/ and novadz.space/ar — no "index.html", no "#section" ---------- */
  (() => {
    const hash = location.hash.slice(1);
    let goto = hash;
    try { goto = decodeURIComponent(hash); } catch (err) { /* bad hash */ }
    try { goto = goto || sessionStorage.getItem('novaGoto') || ''; sessionStorage.removeItem('novaGoto'); } catch (err) { /* ignore */ }
    const path = location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
    if (path !== location.pathname || hash) history.replaceState(null, '', path + location.search);
    const target = goto && goto !== 'home' ? document.getElementById(goto) : null;
    if (!target) return;
    // an old "#section" link: hide the id for a moment, so the browser's own late jump can't fight ours
    if (hash) {
      target.removeAttribute('id');
      const loaded = new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true })));
      loaded.then(() => setTimeout(() => { target.id = goto; }, 1500));
    }
    const go = () => {
      if (window.novaLenis) window.novaLenis.scrollTo(target, { offset: -70, immediate: true, force: true });
      else target.scrollIntoView();
    };
    (window.novaReady || Promise.resolve()).then(() => requestAnimationFrame(go));
  })();

  /* ---------- Footer year ---------- */
  $('#year').textContent = new Date().getFullYear();
})();

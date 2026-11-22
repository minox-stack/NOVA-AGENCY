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
    rcTitle: 'وصل إرسال رسالة', rcSub: 'تم إرسال رسالتك إلى NOVA Agency', rcStatus: 'أُرسلت إلى NOVA Agency',
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
    rcTitle: 'MESSAGE RECEIPT', rcSub: 'Your message was sent to NOVA Agency', rcStatus: 'Sent to NOVA Agency',
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
  const EMAIL = 'minooooooox@gmail.com';
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
    if (via === 'wa') {
      openWA(`${T.waIntro(val('name'), val('email'))}\n\n${val('message')}`);
      note.className = 'form-note ok';
      note.textContent = T.waOk;
      return;
    }
    // Email: delivered straight to the inbox through Formspree (the same form the old site used)
    const btn = $('[data-send="email"]', form);
    const now = new Date();
    const entry = { no: receiptNo(now), date: receiptDate(now), name: val('name'), email: val('email'), message: val('message') };
    const subject = `${T.subject(entry.name)} · ${entry.no}`;
    const data = new FormData(form);
    data.append('_subject', subject);
    data.append('receipt', entry.no); // same number as the visitor's receipt
    btn.disabled = true;
    note.className = 'form-note';
    note.textContent = T.sending;
    // If Formspree refuses the quick (background) send — e.g. its anti-spam check —
    // fall back to a normal form post: it opens Formspree's page and still delivers the message.
    const classicSubmit = () => {
      const extras = [['_subject', subject], ['receipt', entry.no]].map(([n, v]) => {
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
        showReceipt(entry);
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

  /* ---------- Send receipt: shown after "Send by email", can be saved as an image ---------- */
  function receiptNo(d) {
    const p = (n) => String(n).padStart(2, '0');
    return `NOVA-${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }
  function receiptDate(d) {
    try { return new Intl.DateTimeFormat(AR ? 'ar-DZ' : 'en-GB', { dateStyle: 'long', timeStyle: 'short' }).format(d); }
    catch (err) { return d.toLocaleString(); }
  }
  const rc = $('#receipt-modal');
  let lastReceipt = null;
  // decorative barcode made from the receipt number
  const barcode = (code) => {
    let x = 0;
    const stops = [];
    for (const ch of code + code) {
      const c = ch.charCodeAt(0);
      const w = 1 + (c % 4); const gap = 1 + ((c >> 2) % 3);
      stops.push({ x, w });
      x += w + gap;
    }
    return { stops, width: x };
  };
  function showReceipt(r) {
    if (!rc || !rc.showModal) return;
    lastReceipt = r;
    $('#rc-no').textContent = r.no;
    $('#rc-date').textContent = r.date;
    $('#rc-name').textContent = r.name;
    $('#rc-email').textContent = r.email;
    $('#rc-message').textContent = r.message;
    const bc = barcode(r.no);
    $('.rc-barcode', rc).style.backgroundImage = `linear-gradient(90deg, ${bc.stops.map((s) => `transparent ${s.x}px, #fff ${s.x}px ${s.x + s.w}px, transparent ${s.x + s.w}px`).join(', ')})`;
    $('.rc-barcode', rc).style.backgroundSize = `${bc.width}px 100%`;
    const burstEl = $('.rc-burst', rc);
    burstEl.replaceChildren(...Array.from({ length: 12 }, (_, i) => {
      const s = document.createElement('i');
      s.style.cssText = `--a:${i * 30}deg;--dl:${(0.35 + (i % 3) * 0.05).toFixed(2)}s;--c:${['#4ae083', '#ff4d7d', '#ffd1de', '#c084fc'][i % 4]}`;
      return s;
    }));
    if (window.novaLenis) window.novaLenis.stop();
    document.body.classList.add('modal-open');
    rc.showModal();
    rc.scrollTop = 0;
  }
  if (rc) {
    rc.addEventListener('close', () => {
      document.body.classList.remove('modal-open');
      if (window.novaLenis) window.novaLenis.start();
    });
    rc.addEventListener('click', (e) => { if (e.target === rc) rc.close(); });
    $('#rc-close').addEventListener('click', () => rc.close());
    $('#rc-save').addEventListener('click', () => saveReceipt(lastReceipt));
  }

  const loadImg = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  async function saveReceipt(r) {
    if (!r) return;
    const W = 1080; const M = 90;
    const BODY = AR ? '"Cairo", sans-serif' : '"Inter", sans-serif';
    const DISP = AR ? '"Cairo", sans-serif' : '"Anton", sans-serif';
    try { await Promise.all([document.fonts.load(`700 32px ${BODY}`), document.fonts.load(`400 60px ${DISP}`), document.fonts.load('400 30px "Anton"')]); } catch (err) { /* use fallback fonts */ }
    const [mark, word] = await Promise.all([loadImg('assets/nova-mark.webp'), loadImg('assets/nova-wordmark.webp')]);

    // measure the message first, so the image is exactly as tall as it needs to be
    const mx = document.createElement('canvas').getContext('2d');
    mx.direction = AR ? 'rtl' : 'ltr';
    mx.font = `500 30px ${BODY}`;
    const maxW = W - 2 * M;
    const lines = [];
    r.message.split(/\n/).forEach((para) => {
      let line = '';
      para.split(/\s+/).forEach((wd) => {
        const test = line ? `${line} ${wd}` : wd;
        if (mx.measureText(test).width > maxW && line) { lines.push(line); line = wd; } else line = test;
      });
      lines.push(line);
    });
    const MAXL = 8;
    const shown = lines.slice(0, MAXL);
    if (lines.length > MAXL) shown[MAXL - 1] += ' …';
    const top = 440;
    const msgY = top + 80 + 4 * 90;                 // message label
    const divider = msgY + 52 + shown.length * 44;  // line under the message
    const statusY = divider + 64;
    const barTop = statusY + 60;
    const cardBottom = barTop + 80 + 50;
    const H = cardBottom + 130;

    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');

    // background + glow
    const bg = x.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#22081a'); bg.addColorStop(1, '#070407');
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    const glow = x.createRadialGradient(W * 0.85, 80, 0, W * 0.85, 80, 700);
    glow.addColorStop(0, 'rgba(250,29,76,.38)'); glow.addColorStop(1, 'rgba(250,29,76,0)');
    x.fillStyle = glow; x.fillRect(0, 0, W, H);

    const S = AR ? W - M : M; // start edge
    const E = AR ? M : W - M; // end edge
    x.direction = AR ? 'rtl' : 'ltr';

    // logo
    if (mark) x.drawImage(mark, AR ? W - M - 110 : M, 80, 110, 110 * mark.height / mark.width);
    if (word) { const ww = 300; x.drawImage(word, AR ? W - M - 130 - ww : M + 130, 115, ww, ww * word.height / word.width); }

    // check badge
    const cx = AR ? M + 60 : W - M - 60; const cy = 140;
    x.fillStyle = 'rgba(74,224,131,.16)'; x.beginPath(); x.arc(cx, cy, 60, 0, 6.283); x.fill();
    x.strokeStyle = '#4ae083'; x.lineWidth = 8; x.lineCap = 'round'; x.lineJoin = 'round';
    x.beginPath(); x.moveTo(cx - 26, cy + 2); x.lineTo(cx - 8, cy + 20); x.lineTo(cx + 28, cy - 18); x.stroke();

    // title
    x.textAlign = 'start'; x.fillStyle = '#ffffff';
    x.font = AR ? `900 64px ${DISP}` : `400 78px ${DISP}`;
    x.fillText(T.rcTitle, S, 330);
    x.fillStyle = '#ff4d7d'; x.font = `600 30px ${BODY}`;
    x.fillText(T.rcSub, S, 385);

    // ticket card
    const cardH = cardBottom - top;
    x.fillStyle = 'rgba(255,255,255,.05)'; x.strokeStyle = 'rgba(255,255,255,.16)'; x.lineWidth = 2;
    x.beginPath();
    if (x.roundRect) x.roundRect(M - 20, top, W - 2 * (M - 20), cardH, 32); else x.rect(M - 20, top, W - 2 * (M - 20), cardH);
    x.fill(); x.stroke();

    const fit = (txt, max) => { let t = txt; if (x.measureText(t).width <= max) return t; while (t.length && x.measureText(`${t}…`).width > max) t = t.slice(0, -1); return `${t}…`; };
    const labels = $$('.rc-row > span, .rc-msg > span', rc).map((el) => el.textContent);
    const row = (label, value, y, opts = {}) => {
      x.textAlign = 'start'; x.fillStyle = '#9a909c'; x.font = `500 28px ${BODY}`;
      x.fillText(label, S, y);
      x.textAlign = 'end'; x.fillStyle = opts.color || '#ffffff'; x.font = opts.font || `700 32px ${BODY}`;
      x.fillText(fit(value, W - 2 * M - 260), E, y);
      x.strokeStyle = 'rgba(255,255,255,.1)'; x.setLineDash([8, 8]); x.lineWidth = 2;
      x.beginPath(); x.moveTo(M, y + 30); x.lineTo(W - M, y + 30); x.stroke(); x.setLineDash([]);
    };
    let y = top + 80;
    row(labels[0], r.no, y, { font: '400 36px "Anton", sans-serif' }); y += 90;
    row(labels[1], r.date, y); y += 90;
    row(labels[2], r.name, y); y += 90;
    row(labels[3], r.email, y); y += 90;

    // message, wrapped
    x.textAlign = 'start'; x.fillStyle = '#9a909c'; x.font = `500 28px ${BODY}`;
    x.fillText(labels[4], S, msgY);
    x.fillStyle = '#e6dee6'; x.font = `500 30px ${BODY}`;
    shown.forEach((ln, i) => x.fillText(fit(ln, maxW), S, msgY + 52 + i * 44));
    x.strokeStyle = 'rgba(255,255,255,.1)'; x.setLineDash([8, 8]); x.lineWidth = 2;
    x.beginPath(); x.moveTo(M, divider); x.lineTo(W - M, divider); x.stroke(); x.setLineDash([]);
    row(labels[5], `✓ ${T.rcStatus}`, statusY, { color: '#4ae083' });

    // barcode + footer
    const bc = barcode(r.no);
    const scale = 3;
    const bw = Math.min(bc.width * scale, W - 2 * M);
    const bx = (W - bw) / 2;
    x.fillStyle = '#ffffff';
    for (const s of bc.stops) {
      if ((s.x + s.w) * scale > bw) break;
      x.fillRect(bx + s.x * scale, barTop, s.w * scale, 80);
    }
    x.textAlign = 'center'; x.fillStyle = '#9a909c'; x.font = `500 26px ${BODY}`;
    x.fillText('NOVA Agency · novadz.space', W / 2, H - 60);

    c.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${r.no}.png`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    }, 'image/png');
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

  /* ---------- Language switch: open the other language at the same section ---------- */
  $$('.lang').forEach((a) => a.addEventListener('click', () => {
    const mid = innerHeight / 2;
    const cur = $$('main section[id]').find((s) => {
      const r = s.getBoundingClientRect();
      return r.top <= mid && r.bottom >= mid;
    });
    a.href = a.getAttribute('href').split('#')[0] + (cur && cur.id !== 'home' ? `#${cur.id}` : '');
  }));

  /* ---------- Footer year ---------- */
  $('#year').textContent = new Date().getFullYear();
})();

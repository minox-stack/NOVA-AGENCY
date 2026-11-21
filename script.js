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
    const data = new FormData(form);
    data.append('_subject', T.subject(val('name')));
    btn.disabled = true;
    note.className = 'form-note';
    note.textContent = T.sending;
    fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      .then((res) => {
        if (!res.ok) throw new Error(`Formspree ${res.status}`);
        form.reset();
        note.className = 'form-note ok';
        note.textContent = T.sent;
      })
      .catch(() => {
        note.className = 'form-note err';
        note.textContent = T.sendFail(EMAIL);
      })
      .finally(() => { btn.disabled = false; });
  });
  form.addEventListener('input', (e) => {
    const f = e.target.closest('.field');
    if (f) { f.classList.remove('invalid'); e.target.removeAttribute('aria-invalid'); }
  });

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

/* ══════════════════════════════════════════════════════════════
   MANTENIMIENTO Y ACABADOS — José Luis López · Querétaro
   script.js · JavaScript vanilla, sin dependencias
   ──────────────────────────────────────────────────────────────
   01 Utilidades            08 Contadores
   02 Loader                09 Servicios (scrollytelling)
   03 Scroll suave          10 Impermeabilización (tabs)
   04 Motor de scroll       11 Proceso + Obras (galería)
   05 Revelado / titulares  12 Lightbox
   06 Navegación + menú     13 FAQ + formulario → WhatsApp
   07 Hero (partículas…)    14 Extras (WhatsApp, cursor, tilt)
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ───────────────────────── 01 · UTILIDADES ───────────────────────── */
  var WA_NUMBER = '524422069050';
  var doc = document;
  var root = doc.documentElement;
  var body = doc.body;

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  /* Deben coincidir con los media queries del CSS que activan los modos "pinned" */
  var mqSvc = window.matchMedia('(min-width: 1000px) and (min-height: 620px)');
  var mqWork = window.matchMedia('(min-width: 900px) and (min-height: 600px)');

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function waUrl(msg) { return 'https://wa.me/' + WA_NUMBER + (msg ? '?text=' + encodeURIComponent(msg) : ''); }

  /* Bloqueo de scroll con contador (loader, menú, lightbox pueden coincidir) */
  var lockCount = 0;
  function lockScroll() { lockCount++; body.classList.add('is-locked'); }
  function unlockScroll() { lockCount = Math.max(0, lockCount - 1); if (!lockCount) body.classList.remove('is-locked'); }

  /* Evita que el navegador restaure el scroll a mitad de página antes de la intro */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  /* ───────────────────────── 02 · LOADER ───────────────────────── */
  var siteReady = false;
  var readyCallbacks = [];
  function onReady(fn) { if (siteReady) fn(); else readyCallbacks.push(fn); }
  function startSite() {
    if (siteReady) return;
    siteReady = true;
    body.classList.add('is-ready');
    readyCallbacks.forEach(function (fn) { fn(); });
    readyCallbacks = [];
  }

  (function initLoader() {
    var loader = $('#loader');
    if (!loader || prefersReduced) {
      if (loader) loader.classList.add('is-gone');
      window.scrollTo(0, 0);
      startSite();
      return;
    }

    lockScroll();
    window.scrollTo(0, 0);

    var pctEl = $('[data-loader-pct]', loader);
    var fill = $('.ld-fill', loader);
    var statusEl = $('[data-loader-status]', loader);
    var statuses = [
      [0, 'Midiendo cada detalle…'],
      [24, 'Preparando materiales…'],
      [48, 'Nivelando superficies…'],
      [72, 'Puliendo acabados…'],
      [92, 'Entregando tu experiencia…']
    ];
    var MIN_MS = 2400;     /* duración mínima para que la animación se aprecie */
    var MAX_MS = 7000;     /* tope por si algún recurso tarda demasiado */
    var t0 = performance.now();
    var shown = 0;
    var loaded = document.readyState === 'complete';
    var statusIdx = -1;
    var finished = false;

    if (!loaded) window.addEventListener('load', function () { loaded = true; });

    function frame(now) {
      var elapsed = now - t0;
      var ceil = ((loaded && elapsed > MIN_MS) || elapsed > MAX_MS) ? 100 : Math.min(90, (elapsed / MIN_MS) * 90);
      shown = Math.min(ceil, shown + (ceil - shown) * 0.07 + 0.06);

      var v = Math.round(shown);
      pctEl.textContent = v;
      fill.style.strokeDashoffset = String(100 - shown);
      for (var i = statuses.length - 1; i >= 0; i--) {
        if (shown >= statuses[i][0]) {
          if (i !== statusIdx) { statusIdx = i; statusEl.textContent = statuses[i][1]; }
          break;
        }
      }

      if (shown >= 99.4 && !finished) { finished = true; finish(); return; }
      requestAnimationFrame(frame);
    }

    function finish() {
      pctEl.textContent = '100';
      fill.style.strokeDashoffset = '0';
      statusEl.textContent = '¡Listo!';
      setTimeout(function () {
        loader.classList.add('is-out');
        setTimeout(function () { startSite(); unlockScroll(); }, 520);   /* el hero entra mientras se abren las cortinas */
        setTimeout(function () { loader.classList.add('is-gone'); }, 1900);
      }, 380);
    }

    requestAnimationFrame(frame);
  })();

  /* ───────────────────────── 03 · SCROLL SUAVE (slow-motion) ─────────────────────────
     Inercia tipo "Lenis" con lerp dependiente del tiempo. Solo en escritorio con ratón;
     en táctiles y con "reducir movimiento" se usa el scroll nativo.                      */
  var smooth = (function () {
    var enabled = finePointer && !prefersReduced;
    var target = window.scrollY, current = target, raf = 0, last = 0;
    var EASE = 0.085;

    function maxScroll() { return Math.max(0, root.scrollHeight - window.innerHeight); }

    function loop(t) {
      var dt = Math.min(50, t - (last || t));
      last = t;
      current += (target - current) * (1 - Math.pow(1 - EASE, dt / 16.667));
      if (Math.abs(target - current) < 0.4) {
        current = target; window.scrollTo(0, current); raf = 0; last = 0; return;
      }
      window.scrollTo(0, current);
      raf = requestAnimationFrame(loop);
    }

    /* ¿Hay un contenedor con scroll propio bajo el cursor que pueda absorber el gesto? */
    function innerScrollable(el, dy) {
      while (el && el !== body && el !== root) {
        if (el.nodeType === 1) {
          var cs = getComputedStyle(el);
          if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 1) {
            if (dy < 0 && el.scrollTop > 0) return true;
            if (dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) return true;
          }
        }
        el = el.parentNode;
      }
      return false;
    }

    function onWheel(e) {
      if (e.ctrlKey || e.defaultPrevented || lockCount > 0) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      var dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 32; else if (e.deltaMode === 2) dy *= window.innerHeight;
      if (innerScrollable(e.target, dy)) return;
      e.preventDefault();
      if (!raf) { current = window.scrollY; target = current; }
      target = clamp(target + dy, 0, maxScroll());
      if (!raf) raf = requestAnimationFrame(loop);
    }

    function scrollTo(y, instant) {
      y = clamp(y, 0, maxScroll());
      if (!enabled || instant) { window.scrollTo(0, y); target = current = y; return; }
      if (!raf) current = window.scrollY;
      target = y;
      if (!raf) raf = requestAnimationFrame(loop);
    }

    if (enabled) {
      window.addEventListener('wheel', onWheel, { passive: false });
      /* sincroniza cuando el scroll cambia por teclado, barra lateral o anclas nativas */
      window.addEventListener('scroll', function () { if (!raf) { target = current = window.scrollY; } }, { passive: true });
    }
    return { scrollTo: scrollTo, enabled: enabled };
  })();

  function scrollToEl(el, instant) {
    if (!el) return;
    var y = el.getBoundingClientRect().top + window.scrollY;
    if (smooth.enabled) smooth.scrollTo(y, instant);
    else window.scrollTo({ top: y, behavior: instant || prefersReduced ? 'auto' : 'smooth' });
  }

  /* ───────────────────────── 04 · MOTOR DE SCROLL ───────────────────────── */
  var scrollers = [];       /* funciones(y, vh) que se ejecutan una vez por frame de scroll */
  var measurers = [];       /* funciones que recalculan geometría */
  var ticking = false;

  function runScrollers() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    for (var i = 0; i < scrollers.length; i++) scrollers[i](y, vh);
  }
  function requestUpdate() { if (!ticking) { ticking = true; requestAnimationFrame(runScrollers); } }
  function measureAll() { for (var i = 0; i < measurers.length; i++) measurers[i](); requestUpdate(); }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  var resizeTimer;
  window.addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(measureAll, 140); });
  window.addEventListener('load', function () { setTimeout(measureAll, 60); });
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { setTimeout(measureAll, 60); });
  if ('ResizeObserver' in window) {
    var roTimer;
    new ResizeObserver(function () { clearTimeout(roTimer); roTimer = setTimeout(measureAll, 120); }).observe(body);
  }

  /* Barra de progreso + estado del nav */
  (function initChrome() {
    var bar = $('.progress i');
    var nav = $('#nav');
    var lastY = 0;
    scrollers.push(function (y) {
      var max = Math.max(1, root.scrollHeight - window.innerHeight);
      if (bar) bar.style.transform = 'scaleX(' + clamp(y / max, 0, 1).toFixed(4) + ')';
      nav.classList.toggle('is-stuck', y > 24);
      if (!body.classList.contains('menu-open')) {
        if (y > 520 && y > lastY + 8) nav.classList.add('is-hidden');
        else if (y < lastY - 8 || y < 520) nav.classList.remove('is-hidden');
      }
      lastY = y;
    });
  })();

  /* Parallax del hero al hacer scroll (profundidad) */
  (function initHeroScroll() {
    var hero = $('.hero');
    var inner = $('.hero__inner');
    var bg = $('.hero__bg');
    if (!hero || !inner || prefersReduced) return;
    scrollers.push(function (y, vh) {
      if (y > vh * 1.3) return;
      var p = clamp(y / (hero.offsetHeight || vh), 0, 1);
      inner.style.transform = 'translate3d(0,' + (y * 0.2).toFixed(1) + 'px,0)';
      inner.style.opacity = String((1 - p * 1.15).toFixed(3));
      bg.style.transform = 'translate3d(0,' + (y * 0.1).toFixed(1) + 'px,0)';
    });
  })();

  /* Parallax de imágenes internas (sección "Nosotros") */
  (function initParallaxImg() {
    var imgs = $$('[data-parallax-img]');
    if (!imgs.length || prefersReduced) return;
    scrollers.push(function (y, vh) {
      imgs.forEach(function (img) {
        var box = img.parentNode.getBoundingClientRect();
        if (box.bottom < -50 || box.top > vh + 50) return;
        var p = clamp((box.top + box.height / 2 - vh / 2) / (vh / 2 + box.height / 2), -1, 1);
        var t = (p + 1) / 2;
        img.style.transform = 'translate3d(0,' + (-t * 0.14 * box.height).toFixed(1) + 'px,0)';
      });
    });
  })();

  /* ───────────────────────── 05 · REVELADO Y TITULARES ───────────────────────── */
  function splitWords(el) {
    var idx = 0;
    function walk(node, parent, inGrad) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          ch.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { parent.appendChild(doc.createTextNode(' ')); return; }
            var outer = doc.createElement('span'); outer.className = 'sw';
            var inner = doc.createElement('span'); inner.className = 'sw__in' + (inGrad ? ' grad' : '');
            inner.style.setProperty('--i', idx++);
            inner.textContent = part;
            outer.appendChild(inner); parent.appendChild(outer);
          });
        } else if (ch.nodeType === 1) {
          if (ch.tagName === 'BR') parent.appendChild(doc.createElement('br'));
          else walk(ch, parent, inGrad || ch.classList.contains('grad'));
        }
      });
    }
    var frag = doc.createDocumentFragment();
    walk(el, frag, false);
    el.textContent = '';
    el.appendChild(frag);
  }

  (function initReveal() {
    $$('[data-split]').forEach(splitWords);
    $$('[data-reveal]').forEach(function (el) {
      var d = parseInt(el.getAttribute('data-delay'), 10);
      if (!isNaN(d)) el.style.setProperty('--d', d);
    });

    var targets = $$('[data-reveal], [data-split]');
    if (!('IntersectionObserver' in window) || prefersReduced) {
      targets.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        io.unobserve(el);
        el.classList.add('is-in');
        /* una vez revelado, se libera el elemento para que no bloquee otras transiciones (p. ej. botones magnéticos) */
        if (el.hasAttribute('data-reveal')) {
          setTimeout(function () { el.removeAttribute('data-reveal'); }, 2600);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  })();

  /* Declaración "iluminada" palabra por palabra al hacer scroll */
  (function initWordsLit() {
    var el = $('[data-words]');
    if (!el) return;
    var words = el.textContent.replace(/\s+/g, ' ').trim().split(' ');
    el.textContent = '';
    var spans = words.map(function (w, i) {
      var s = doc.createElement('span'); s.className = 'w'; s.textContent = w;
      el.appendChild(s); if (i < words.length - 1) el.appendChild(doc.createTextNode(' '));
      return s;
    });
    if (prefersReduced) { spans.forEach(function (s) { s.classList.add('is-lit'); }); return; }
    var lit = 0;
    scrollers.push(function (y, vh) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh) return;
      var p = clamp((vh * 0.86 - r.top) / (r.height + vh * 0.34), 0, 1);
      var n = Math.round(p * spans.length * 1.04);
      if (n === lit) return;
      for (var i = 0; i < spans.length; i++) spans[i].classList.toggle('is-lit', i < n);
      lit = n;
    });
  })();

  /* ───────────────────────── 06 · NAVEGACIÓN + MENÚ ───────────────────────── */
  (function initNav() {
    var burger = $('#burger');
    var menu = $('#menu');

    function setMenu(open) {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      menu.classList.toggle('is-open', open);
      body.classList.toggle('menu-open', open);
      if (open) { menu.removeAttribute('inert'); lockScroll(); $('#nav').classList.remove('is-hidden'); }
      else { menu.setAttribute('inert', ''); unlockScroll(); }
    }
    var isOpen = function () { return burger.getAttribute('aria-expanded') === 'true'; };

    burger.addEventListener('click', function () { setMenu(!isOpen()); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen()) setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1020 && isOpen()) setMenu(false); });

    /* Anclas internas con scroll suave */
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var href = a.getAttribute('href');
        if (!href || href === '#') return;
        var target = $(href);
        if (!target) return;
        e.preventDefault();
        if (isOpen()) { setMenu(false); setTimeout(function () { scrollToEl(target); }, 80); }
        else scrollToEl(target);
        if (history.replaceState) history.replaceState(null, '', href);
      });
    });

    /* Scrollspy */
    var map = {};
    $$('.nav__links a').forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    if ('IntersectionObserver' in window) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var link = map[e.target.id];
          if (!link) return;
          if (e.isIntersecting) { $$('.nav__links a.is-current').forEach(function (l) { l.classList.remove('is-current'); }); link.classList.add('is-current'); }
          else link.classList.remove('is-current');
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(map).forEach(function (id) { var s = doc.getElementById(id); if (s) spy.observe(s); });
    }

    /* Enlace de hash inicial (tras la intro) */
    if (location.hash && $(location.hash)) onReady(function () { setTimeout(function () { scrollToEl($(location.hash), true); }, 60); });
  })();

  /* ───────────────────────── 07 · HERO ───────────────────────── */
  var heroVisible = true;
  (function initHeroVisibility() {
    var hero = $('.hero');
    if (!hero || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (en) { heroVisible = en[0].isIntersecting; }, { threshold: 0.02 }).observe(hero);
  })();

  /* 7.1 Palabra rotativa del titular */
  (function initRotator() {
    var wrap = $('[data-rotator]');
    if (!wrap || prefersReduced) return;
    var words = $$('.rotator__w', wrap);
    var i = 0;
    function next() {
      if (doc.hidden || !heroVisible) return;
      var cur = words[i];
      i = (i + 1) % words.length;
      var nx = words[i];
      cur.classList.remove('is-on'); cur.classList.add('is-off');
      nx.classList.remove('is-off'); nx.classList.add('is-on');
      setTimeout(function () { cur.classList.remove('is-off'); }, 1100);
    }
    onReady(function () { setTimeout(function () { setInterval(next, 3300); }, 2600); });
  })();

  /* 7.2 Slideshow dentro de la silueta de casa */
  (function initSlides() {
    var box = $('[data-slides]');
    if (!box) return;
    var slides = $$('.slide', box);
    var dots = $$('.hv__dots i');
    var label = $('[data-slide-label]');
    var i = 0;
    function go(n) {
      slides[i].classList.remove('is-active');
      i = n;
      slides[i].classList.add('is-active');
      dots.forEach(function (d, k) { d.classList.toggle('is-on', k === i); });
      if (label) {
        label.style.opacity = '0';
        setTimeout(function () { label.textContent = slides[i].getAttribute('data-label'); label.style.opacity = '1'; }, 260);
      }
    }
    if (prefersReduced) return;
    onReady(function () {
      setInterval(function () { if (!doc.hidden && heroVisible) go((i + 1) % slides.length); }, 4800);
    });
  })();

  /* 7.3 Inclinación 3D con el cursor */
  (function initHeroTilt() {
    var hero = $('.hero');
    var hv = $('.hv');
    if (!hero || !hv || !finePointer || prefersReduced) return;
    hero.addEventListener('pointermove', function (e) {
      if (!heroVisible) return;
      var r = hero.getBoundingClientRect();
      var nx = (e.clientX - r.left) / r.width - 0.5;
      var ny = (e.clientY - r.top) / r.height - 0.5;
      hv.style.transform = 'rotateY(' + (nx * 14).toFixed(2) + 'deg) rotateX(' + (-ny * 10).toFixed(2) + 'deg)';
    });
    hero.addEventListener('pointerleave', function () { hv.style.transform = ''; });
  })();

  /* 7.4 Partículas interactivas (red de nodos estilo plano técnico) */
  (function initParticles() {
    var canvas = $('#particles');
    if (!canvas || prefersReduced || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var w = 0, h = 0, dpr = 1, pts = [], raf = 0;
    var mouse = { x: -9999, y: -9999 };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      var r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = clamp(Math.round(w * h / 14000), 26, w < 700 ? 46 : 98);
      pts = [];
      for (var i = 0; i < n; i++) {
        pts.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.36, vy: (Math.random() - 0.5) * 0.36 - 0.04,
          r: Math.random() * 1.7 + 0.6, hot: Math.random() < 0.13, tw: Math.random() * 6.28
        });
      }
    }

    function draw(t) {
      raf = 0;
      if (doc.hidden || !heroVisible) return;
      ctx.clearRect(0, 0, w, h);
      var maxD = w < 700 ? 96 : 138, maxD2 = maxD * maxD;
      var i, j, p, q, dx, dy, d2, a;

      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
        dx = p.x - mouse.x; dy = p.y - mouse.y; d2 = dx * dx + dy * dy;
        if (d2 < 22000) { var f = (1 - d2 / 22000) * 0.9; p.x += dx / Math.sqrt(d2 + 1) * f; p.y += dy / Math.sqrt(d2 + 1) * f; }
      }

      ctx.lineWidth = 1;
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        for (j = i + 1; j < pts.length; j++) {
          q = pts[j]; dx = p.x - q.x; dy = p.y - q.y; d2 = dx * dx + dy * dy;
          if (d2 < maxD2) {
            a = (1 - Math.sqrt(d2) / maxD) * 0.34;
            ctx.strokeStyle = 'rgba(92,195,242,' + a.toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        dx = p.x - mouse.x; dy = p.y - mouse.y; d2 = dx * dx + dy * dy;
        if (d2 < 30000) {
          a = (1 - d2 / 30000) * 0.55;
          ctx.strokeStyle = 'rgba(255,140,80,' + a.toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }

      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        a = 0.5 + 0.35 * Math.sin(t * 0.0018 + p.tw);
        ctx.fillStyle = p.hot ? 'rgba(255,140,80,' + a.toFixed(2) + ')' : 'rgba(170,222,250,' + a.toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
        if (p.r > 1.7) {
          ctx.fillStyle = p.hot ? 'rgba(255,122,61,.10)' : 'rgba(92,195,242,.10)';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4.2, 0, 6.2832); ctx.fill();
        }
      }
      raf = requestAnimationFrame(draw);
    }

    function start() { if (!raf) raf = requestAnimationFrame(draw); }

    resize();
    window.addEventListener('resize', function () { resize(); });
    doc.addEventListener('visibilitychange', start);
    /* se reactiva solo cuando el hero vuelve a verse */
    setInterval(function () { if (heroVisible && !doc.hidden && !raf) start(); }, 400);

    var hero = $('.hero');
    if (hero && finePointer) {
      hero.addEventListener('pointermove', function (e) { var r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
      hero.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });
    }
    start();
  })();

  /* ───────────────────────── 08 · CONTADORES ───────────────────────── */
  (function initCounters() {
    var els = $$('[data-count]');
    if (!els.length) return;
    function run(el) {
      var to = parseFloat(el.getAttribute('data-count'));
      var from = parseFloat(el.getAttribute('data-from') || '0');
      var suffix = el.getAttribute('data-suffix') || '';
      if (prefersReduced) { el.textContent = to + suffix; return; }
      var dur = 1900, t0 = null;
      requestAnimationFrame(function step(ts) {
        if (!t0) t0 = ts;
        var p = clamp((ts - t0) / dur, 0, 1);
        var e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        el.textContent = Math.round(from + (to - from) * e) + suffix;
        if (p < 1) requestAnimationFrame(step);
      });
    }
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || ''); }); return; }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); run(e.target); } });
    }, { threshold: 0.6 });
    els.forEach(function (el) {
      var from = el.getAttribute('data-from'); if (from) el.textContent = from;
      io.observe(el);
    });
  })();

  /* ───────────────────────── 09 · SERVICIOS (scrollytelling) ───────────────────────── */
  (function initServices() {
    var track = $('[data-svc-track]');
    var items = $$('[data-svc-item]');
    var meter = $('[data-svc-meter]');
    if (!track || !items.length) return;
    var active = 0, pinned = false, top = 0, total = 1;

    function setActive(i) {
      if (i === active) return;
      items[active].classList.remove('is-active');
      items[active].querySelector('.svc__btn').setAttribute('aria-expanded', 'false');
      active = i;
      items[i].classList.add('is-active');
      items[i].querySelector('.svc__btn').setAttribute('aria-expanded', 'true');
    }

    measurers.push(function () {
      pinned = mqSvc.matches;
      if (!pinned) {
        /* en móvil / tablet todo el contenido es visible: se normaliza el estado ARIA */
        items.forEach(function (it) { it.querySelector('.svc__btn').setAttribute('aria-expanded', 'true'); });
        return;
      }
      items.forEach(function (it, k) { it.querySelector('.svc__btn').setAttribute('aria-expanded', String(k === active)); });
      var r = track.getBoundingClientRect();
      top = r.top + window.scrollY;
      total = Math.max(1, track.offsetHeight - window.innerHeight);
    });

    scrollers.push(function (y) {
      if (!pinned) return;
      var p = clamp((y - top) / total, 0, 1);
      setActive(Math.min(items.length - 1, Math.floor(p * items.length)));
      if (meter) meter.style.transform = 'scaleY(' + p.toFixed(4) + ')';
    });

    items.forEach(function (it, k) {
      it.querySelector('.svc__btn').addEventListener('click', function () {
        if (!pinned) return;
        var y = top + ((k + 0.5) / items.length) * total;
        if (smooth.enabled) smooth.scrollTo(y); else window.scrollTo({ top: y, behavior: prefersReduced ? 'auto' : 'smooth' });
      });
    });

    /* CTA por servicio → preselecciona el servicio en el formulario */
    $$('[data-wa-service]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var sel = $('#f-servicio');
        if (sel) { sel.value = a.getAttribute('data-wa-service'); }
        scrollToEl($('#contacto'));
      });
    });
  })();

  /* ───────────────────────── 10 · IMPERMEABILIZACIÓN (tabs automáticas) ───────────────────────── */
  (function initTabs() {
    var wrap = $('[data-tabs]');
    if (!wrap) return;
    var tabs = $$('.tab', wrap);
    var panels = $$('.imp__panel');
    var DUR = 6500;
    var cur = 0, timer = 0, inView = false, hovering = false;

    wrap.style.setProperty('--tab-dur', DUR + 'ms');
    if (prefersReduced) wrap.classList.add('is-static');

    function schedule() {
      clearTimeout(timer);
      if (prefersReduced || !inView || hovering) return;
      timer = setTimeout(function () { show((cur + 1) % tabs.length); }, DUR);
    }
    function restartBar() {
      var bar = tabs[cur].querySelector('.tab__bar i');
      bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
    }
    function show(i, focus) {
      cur = i;
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panels[k].classList.toggle('is-active', on);
      });
      restartBar();
      if (focus) tabs[i].focus();
      schedule();
    }

    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () { show(k); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (k + 1) % tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (k - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); show(n, true); }
      });
    });
    wrap.addEventListener('mouseenter', function () { hovering = true; wrap.classList.add('is-paused'); clearTimeout(timer); });
    wrap.addEventListener('mouseleave', function () { hovering = false; wrap.classList.remove('is-paused'); restartBar(); schedule(); });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        inView = en[0].isIntersecting;
        wrap.classList.toggle('is-paused', !inView || hovering);
        if (inView) { restartBar(); schedule(); } else clearTimeout(timer);
      }, { threshold: 0.35 }).observe(wrap);
    }
  })();

  /* ───────────────────────── 11 · PROCESO + OBRAS ───────────────────────── */
  (function initProcess() {
    var wrap = $('.proc__wrap');
    var line = $('[data-process-line]');
    if (!wrap || !line) return;
    if (prefersReduced) { line.style.setProperty('--pl', 1); return; }
    scrollers.push(function (y, vh) {
      var r = wrap.getBoundingClientRect();
      if (r.bottom < -60 || r.top > vh) return;
      line.style.setProperty('--pl', clamp((vh * 0.72 - r.top) / (r.height * 0.9), 0, 1).toFixed(4));
    });
  })();

  (function initWork() {
    var track = $('[data-work-track]');
    var rail = $('[data-work-rail]');
    var bar = $('[data-work-bar]');
    if (!track || !rail) return;
    var cards = $$('.wcard', rail);
    var pinned = false, top = 0, dist = 0;

    measurers.push(function () {
      pinned = mqWork.matches;
      if (!pinned) {
        track.style.height = ''; rail.style.transform = '';
        cards.forEach(function (c) { c.style.removeProperty('--px'); });
        return;
      }
      rail.style.transform = '';
      dist = Math.max(0, rail.offsetWidth - window.innerWidth);
      track.style.height = (window.innerHeight + dist) + 'px';
      top = track.getBoundingClientRect().top + window.scrollY;
    });

    scrollers.push(function (y, vh) {
      if (!pinned) return;
      var p = clamp((y - top) / Math.max(1, dist), 0, 1);
      rail.style.transform = 'translate3d(' + (-p * dist).toFixed(1) + 'px,0,0)';
      if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      if (y < top - vh || y > top + dist + vh) return;
      var W = window.innerWidth;
      for (var i = 0; i < cards.length; i++) {
        var r = cards[i].getBoundingClientRect();
        var off = (r.left + r.width / 2 - W / 2) / W;
        cards[i].style.setProperty('--px', (off * -38).toFixed(1) + 'px');
      }
    });
  })();

  /* ───────────────────────── 12 · LIGHTBOX ───────────────────────── */
  (function initLightbox() {
    var lb = $('#lightbox');
    var cards = $$('[data-lightbox]');
    if (!lb || !cards.length) return;
    var img = $('.lb__img', lb);
    var capSmall = $('.lb__cap small', lb);
    var capStrong = $('.lb__cap strong', lb);
    var idx = 0, lastFocus = null, closeTimer = 0, touchX = null;

    function load() {
      var c = cards[idx];
      var src = c.querySelector('img');
      img.classList.remove('is-ready');
      img.onload = function () { img.classList.add('is-ready'); };
      img.src = src.currentSrc || src.src;
      img.alt = src.alt;
      if (img.complete && img.naturalWidth) img.classList.add('is-ready');
      capSmall.textContent = c.getAttribute('data-cat') || '';
      capStrong.textContent = c.getAttribute('data-title') || '';
    }
    function open(i) {
      clearTimeout(closeTimer);
      idx = i; lastFocus = doc.activeElement;
      load();
      lb.hidden = false;
      requestAnimationFrame(function () { lb.classList.add('is-open'); });
      lockScroll();
      $('.lb__x', lb).focus();
    }
    function close() {
      lb.classList.remove('is-open');
      unlockScroll();
      closeTimer = setTimeout(function () { lb.hidden = true; img.removeAttribute('src'); }, 460);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function step(d) { idx = (idx + d + cards.length) % cards.length; load(); }

    cards.forEach(function (c, i) { c.addEventListener('click', function () { open(i); }); });
    $('.lb__x', lb).addEventListener('click', close);
    $('.lb__nav--prev', lb).addEventListener('click', function () { step(-1); });
    $('.lb__nav--next', lb).addEventListener('click', function () { step(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb__fig')) close(); });

    doc.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'Tab') {            /* trampa de foco */
        var f = $$('button', lb);
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    lb.addEventListener('touchstart', function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX; touchX = null;
      if (Math.abs(dx) > 55) step(dx > 0 ? -1 : 1);
    }, { passive: true });
  })();

  /* ───────────────────────── 13 · FAQ + FORMULARIO → WHATSAPP ───────────────────────── */
  (function initFaq() {
    var list = $('[data-faq]');
    if (!list) return;
    var items = $$('.qa', list);
    function openItem(d) { d.setAttribute('open', ''); void d.offsetWidth; d.classList.add('is-open'); }
    function closeItem(d) {
      d.classList.remove('is-open');
      setTimeout(function () { if (!d.classList.contains('is-open')) d.removeAttribute('open'); }, 720);
    }
    items.forEach(function (d) {
      $('summary', d).addEventListener('click', function (e) {
        e.preventDefault();
        var willOpen = !d.classList.contains('is-open');
        items.forEach(function (o) { if (o !== d && o.classList.contains('is-open')) closeItem(o); });
        if (willOpen) openItem(d); else closeItem(d);
      });
    });
  })();

  (function initForm() {
    var form = $('#quote-form');
    if (!form) return;
    var status = $('#form-status');
    var fields = {
      nombre: { el: $('#f-nombre'), err: $('#e-nombre'), test: function (v) { return v.trim().length >= 2; }, msg: 'Escribe tu nombre.' },
      tel: { el: $('#f-tel'), err: $('#e-tel'), test: function (v) { return v.replace(/\D/g, '').length >= 10; }, msg: 'Escribe un teléfono de 10 dígitos.' },
      servicio: { el: $('#f-servicio'), err: $('#e-servicio'), test: function (v) { return v !== ''; }, msg: 'Elige el servicio que necesitas.' },
      msg: { el: $('#f-msg'), err: $('#e-msg'), test: function (v) { return v.trim().length >= 8; }, msg: 'Cuéntanos un poco más (mínimo 8 caracteres).' }
    };
    var submitted = false;

    function check(key) {
      var f = fields[key];
      var ok = f.test(f.el.value);
      f.el.parentNode.classList.toggle('has-err', !ok);
      if (f.el.parentNode.classList.contains('select')) f.el.parentNode.parentNode.classList.toggle('has-err', !ok);
      f.el.setAttribute('aria-invalid', String(!ok));
      f.err.textContent = ok ? '' : f.msg;
      return ok;
    }
    Object.keys(fields).forEach(function (k) {
      var ev = fields[k].el.tagName === 'SELECT' ? 'change' : 'input';
      fields[k].el.addEventListener(ev, function () { if (submitted) check(k); });
      fields[k].el.addEventListener('blur', function () { if (submitted || fields[k].el.value) check(k); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitted = true;
      var firstBad = null;
      Object.keys(fields).forEach(function (k) { if (!check(k) && !firstBad) firstBad = fields[k].el; });
      if (firstBad) { firstBad.focus(); status.className = 'form__status'; status.textContent = 'Revisa los campos marcados.'; return; }

      var zona = $('#f-zona').value.trim();
      var lines = [
        'Hola, soy ' + fields.nombre.el.value.trim() + '. Quiero cotizar: ' + fields.servicio.el.value + '.',
        zona ? 'Zona: ' + zona : null,
        'Detalles: ' + fields.msg.el.value.trim(),
        'Mi teléfono: ' + fields.tel.el.value.trim(),
        '(Enviado desde la página web)'
      ].filter(Boolean);
      var url = waUrl(lines.join('\n'));

      status.className = 'form__status is-ok';
      status.innerHTML = 'Abriendo WhatsApp… Si no se abrió, <a href="' + url + '" target="_blank" rel="noopener" style="text-decoration:underline">toca aquí</a>.';
      var w = window.open(url, '_blank', 'noopener');
      if (!w) window.location.href = url;
    });
  })();

  /* ───────────────────────── 14 · EXTRAS ───────────────────────── */
  /* WhatsApp flotante: globo de invitación temporal */
  (function initWhatsApp() {
    var tip = $('#wa-tip');
    if (!tip) return;
    onReady(function () {
      setTimeout(function () { tip.classList.add('is-on'); }, 5200);
      setTimeout(function () { tip.classList.remove('is-on'); }, 12500);
    });
    $('.wa__btn').addEventListener('click', function () { tip.classList.remove('is-on'); });
  })();

  /* Brillo que sigue al cursor + botones magnéticos + inclinación de tarjetas */
  (function initPointerFx() {
    if (!finePointer || prefersReduced) return;

    var glow = $('.cursor-glow');
    if (glow) {
      var gx = window.innerWidth / 2, gy = window.innerHeight / 2, tx = gx, ty = gy, on = false;
      window.addEventListener('pointermove', function (e) {
        tx = e.clientX; ty = e.clientY;
        if (!on) { on = true; glow.classList.add('is-on'); gx = tx; gy = ty; }
      }, { passive: true });
      (function loop() {
        gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
        glow.style.transform = 'translate3d(' + gx.toFixed(1) + 'px,' + gy.toFixed(1) + 'px,0)';
        requestAnimationFrame(loop);
      })();
    }

    $$('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        el.style.transform = 'translate3d(' + (dx * 16).toFixed(1) + 'px,' + (dy * 12).toFixed(1) + 'px,0)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });

    $$('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(1100px) rotateY(' + (nx * 9).toFixed(2) + 'deg) rotateX(' + (-ny * 9).toFixed(2) + 'deg)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  })();

  /* Año del footer */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* Primera medición */
  measureAll();
})();

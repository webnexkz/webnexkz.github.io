(function () {
  'use strict';
  var cfg = window.WEBNEX || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // ---------- контакты из config.js ----------
  var igUrl = 'https://ig.me/m/' + (cfg.instagram || 'webnex.kz');
  $$('[data-ig]').forEach(function (a) { a.href = igUrl; });
  if (cfg.whatsapp) {
    $$('[data-wa]').forEach(function (a) {
      a.href = 'https://wa.me/' + cfg.whatsapp + '?text=' + encodeURIComponent('Здравствуйте! Хочу сайт.');
      a.hidden = false;
    });
  }
  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  // ---------- Яндекс Метрика (номер счётчика — в config.js) ----------
  var mId = +cfg.metrika || 0;
  if (mId) {
    window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
    window.ym.l = +new Date();
    var ms = document.createElement('script'); ms.async = true; ms.src = 'https://mc.yandex.ru/metrika/tag.js';
    document.head.appendChild(ms);
    window.ym(mId, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true });
  }
  // цели: calc — тронул калькулятор, calc_send — перенёс расчёт в заявку, lead — заявка дошла, lead_direct — ушёл в Direct, ig — нажал «Написать в Direct», demo — открыл демо
  var goalsSent = {};
  function goal(name, once) {
    if (!mId || (once && goalsSent[name])) return;
    goalsSent[name] = 1;
    try { window.ym(mId, 'reachGoal', name); } catch (e) {}
  }
  $$('[data-ig]').forEach(function (a) { a.addEventListener('click', function () { goal('ig'); }); });
  $$('a[href^="demo/"]').forEach(function (a) { a.addEventListener('click', function () { goal('demo'); }); });

  // ---------- шапка и мобильная кнопка ----------
  var nav = $('#nav'), mbar = $('#mbar'), order = $('#order');
  function onScroll() {
    nav.classList.toggle('is-scrolled', window.scrollY > 8);
    if (!mbar) return;
    var r = order.getBoundingClientRect();
    var formVisible = r.top < window.innerHeight && r.bottom > 0;
    mbar.classList.toggle('is-on', window.scrollY > 500 && !formVisible);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- линия: длина пробега огонька ----------
  var line = $('#line'), flow = $('#flow');
  function setRun() { line.style.setProperty('--run', (line.offsetHeight - 10) + 'px'); }
  setRun(); window.addEventListener('resize', setRun);

  // ---------- форма ----------
  var form = $('#order'), priceEl = $('#price');
  var nSheet = $('#n-sheet'), nTg = $('#n-tg'), nCount = $('#n-count');
  var nameIn = $('#f-name'), contactIn = $('#f-contact'), aboutIn = $('#f-about');
  var note = $('#note'), send = $('#send');
  if (cfg.formUrl) note.textContent = 'Заявка придёт мне в Telegram, отвечу по указанному контакту.';
  var noteDefault = note.textContent;

  function current() { return $('input[name="type"]:checked', form); }
  function shortName(v) { return v.replace('Каталог с заказом в WhatsApp', 'Каталог').replace(' сайт', ''); }

  function render() {
    var t = current();
    var price = 'от ' + t.dataset.price + ' ₸';
    priceEl.textContent = price;
    var who = nameIn.value.trim() || 'Айгерим';
    nSheet.textContent = 'новая строка: ' + who + ' · ' + shortName(t.value);
    nTg.textContent = '«Новая заявка: ' + shortName(t.value) + ', ' + price + '»';
  }
  form.addEventListener('change', render);
  nameIn.addEventListener('input', render);

  // выбор из прайса
  $$('[data-pick]').forEach(function (b) {
    b.addEventListener('click', function () {
      var r = $('input[name="type"][value="' + b.dataset.pick + '"]', form);
      if (r) { r.checked = true; render(); }
      form.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      setTimeout(function () { nameIn.focus({ preventScroll: true }); }, 500);
    });
  });

  function setErr(input, errId, msg) {
    var f = input.closest('.field');
    f.classList.toggle('is-bad', !!msg);
    $('#' + errId).textContent = msg || '';
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  function validate() {
    var ok = true;
    var name = nameIn.value.trim(), contact = contactIn.value.trim();
    if (name.length < 2) { setErr(nameIn, 'e-name', 'Напишите имя, чтобы я знал, как к вам обращаться'); ok = false; }
    else setErr(nameIn, 'e-name');
    var digits = contact.replace(/\D/g, '');
    var looksIg = /^@?[a-z0-9._]{3,}$/i.test(contact);
    if (digits.length < 10 && !looksIg) { setErr(contactIn, 'e-contact', 'Нужен номер телефона или ник в Instagram — иначе я не смогу ответить'); ok = false; }
    else setErr(contactIn, 'e-contact');
    return ok;
  }
  nameIn.addEventListener('blur', function () { if (nameIn.value) validate(); });

  function copy(text) {
    try { if (navigator.clipboard) return navigator.clipboard.writeText(text).catch(function () { legacy(); }); } catch (e) {}
    legacy();
    return Promise.resolve();
    function legacy() { try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    } catch (e) {} }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) { (form.querySelector('.is-bad input') || nameIn).focus(); return; }
    var t = current();
    var text = 'Здравствуйте! Заявка с сайта WEBNEX.\n' +
      'Сайт: ' + t.value + ' (от ' + t.dataset.price + ' ₸)\n' +
      (calcPick && calcPick.type === t.value ? 'Тариф: ' + calcPick.tier + '\n' + (calcPick.opts.length ? 'Дополнительно: ' + calcPick.opts.join(', ') + '\n' : '') + 'По калькулятору: ≈ ' + calcPick.sum + ' ₸, ' + calcPick.days + '\n' : '') +
      'Имя: ' + nameIn.value.trim() + '\n' +
      'Контакт: ' + contactIn.value.trim() +
      (aboutIn.value.trim() ? '\nБизнес: ' + aboutIn.value.trim() : '');

    send.disabled = true;
    send.textContent = 'Отправляю…';
    render();
    flow.classList.remove('is-firing'); void flow.offsetWidth; flow.classList.add('is-firing');
    nCount.textContent = String(parseInt(nCount.textContent, 10) + 1);
    var started = Date.now();
    var done = function (fn) { setTimeout(fn, Math.max(0, 1500 - (Date.now() - started))); };

    if (!cfg.formUrl) { copy(text); done(direct); return; }
    var pick = calcPick && calcPick.type === t.value ? calcPick : null;
    var data = {
      name: nameIn.value.trim(), contact: contactIn.value.trim(),
      about: pick && aboutIn.value.trim() === 'тариф «' + pick.tier + '»' + (pick.opts.length ? ', ' + pick.opts.join(', ').toLowerCase() : '') ? '' : aboutIn.value.trim(),
      type: t.value, tier: pick ? pick.tier : '', opts: pick ? pick.opts.join(', ') : '',
      sum: pick ? pick.sum : 'от ' + t.dataset.price, days: pick ? pick.days : '',
      ref: (new URLSearchParams(location.search).get('utm_source') || document.referrer.replace(/^https?:\/\//, '').split('/')[0] || 'прямой заход'),
      website: (form.elements.website || {}).value || ''
    };
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 12000);
    // без заголовка Content-Type браузер шлёт text/plain — Google принимает такой запрос без лишних проверок
    fetch(cfg.formUrl, { method: 'POST', body: JSON.stringify(data), signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.json(); })
      .then(function (r) {
        clearTimeout(timer);
        if (!r || !r.ok) throw new Error(r && r.error);
        done(function () {
          send.disabled = false;
          send.textContent = 'Заявка отправлена ✓';
          note.classList.add('is-ok');
          note.textContent = 'Спасибо, ' + data.name + '! Заявка у меня — скоро напишу или позвоню по контакту ' + data.contact + '.';
          goal('lead');
        });
      })
      .catch(function () {
        clearTimeout(timer);
        // не дошло до таблицы — запасной путь через Direct, чтобы заявка не потерялась
        copy(text); done(direct);
      });

    function direct() {
      var wa = cfg.whatsapp ? 'https://wa.me/' + cfg.whatsapp + '?text=' + encodeURIComponent(text) : '';
      send.disabled = false;
      send.textContent = 'Отправить ещё раз';
      note.classList.add('is-ok');
      note.textContent = 'Текст заявки скопирован. Открываю ' + (wa ? 'WhatsApp' : 'Direct') + ' — вставьте сообщение и отправьте.';
      goal('lead_direct');
      var w = window.open(wa || igUrl, '_blank', 'noopener');
      if (!w) note.textContent = 'Текст заявки скопирован. Откройте Direct @webnex.kz и вставьте сообщение.';
    }
  });

  form.addEventListener('input', function () {
    if (note.classList.contains('is-ok')) { note.classList.remove('is-ok'); note.textContent = noteDefault; send.textContent = 'Отправить заявку'; }
  });

  // ---------- калькулятор ----------
  var calcPick = null;
  var cForm = $('#calcForm');
  if (cForm) {
    var cSum = $('#c-sum'), cDays = $('#c-days'), cList = $('#c-list'), cPrice = $('.calc__price');
    var shown = 0, prevKeys = '';
    var num = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
    var range = function (r, add) { var x = r.split('-'); var b = +x[1] + add, n = b % 100, m = b % 10; return (+x[0] + add) + '–' + b + (n > 10 && n < 20 ? ' дней' : m === 1 ? ' день' : m > 1 && m < 5 ? ' дня' : ' дней'); };
    var feats = $$('#c-feats li'), cTier = $('#c-tier');
    var calc = function () {
      var t = $('input[name="ctype"]:checked', cForm), tr = $('input[name="ctier"]:checked', cForm);
      var i = tr.dataset.i, ps = t.dataset.p.split(','), ds = t.dataset.d.split(',');
      var shop = /Каталог|магазин/.test(t.value);
      // цены и сроки на карточках тарифов — под выбранный вид сайта
      $$('input[name="ctier"]', cForm).forEach(function (r) {
        var k = +r.dataset.i, card = r.nextElementSibling;
        $('.tier__p', card).textContent = num(+ps[k]) + ' ₸';
        $('.tier__d', card).textContent = range(ds[k], 0);
      });
      // что входит в тариф: data-tiers — номера тарифов (0 Старт, 1 Бизнес, 2 Всё включено), data-kind="shop" — только каталог и магазин
      cTier.textContent = tr.value;
      feats.forEach(function (li) {
        var on = li.dataset.tiers.indexOf(i) >= 0 && (!li.dataset.kind || shop);
        if (on && li.hidden && prevKeys) { li.classList.remove('is-new'); void li.offsetWidth; li.classList.add('is-new'); }
        li.hidden = !on;
      });
      var sum = +ps[+i], add = 0;
      var rows = [[shortName(t.value) + ' · ' + tr.value, num(sum) + ' ₸', t.value + tr.value]], opts = [];
      $$('.opt input', cForm).forEach(function (c) {
        if (c.checked) { sum += +c.dataset.sum; add += +c.dataset.days; rows.push([c.value, '+' + num(+c.dataset.sum) + ' ₸', c.value]); opts.push(c.value); }
      });
      var d = range(ds[+i], add);
      cDays.textContent = d;
      var old = prevKeys.split('|');
      cList.innerHTML = rows.map(function (r) { return '<li' + (old.indexOf(r[2]) < 0 && prevKeys ? ' class="is-new"' : '') + '><span>' + r[0] + '</span><span>' + r[1] + '</span></li>'; }).join('');
      prevKeys = rows.map(function (r) { return r[2]; }).join('|');
      // цена «набегает» к новому значению
      var from = shown, to = sum, t0 = null;
      cPrice.classList.remove('bump'); void cPrice.offsetWidth; if (from) cPrice.classList.add('bump');
      if (!from || document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) { cSum.textContent = num(to); shown = to; }
      else requestAnimationFrame(function step(ts) {
        if (!t0) t0 = ts;
        var k = Math.min(1, (ts - t0) / 500);
        shown = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
        cSum.textContent = num(shown);
        if (k < 1) requestAnimationFrame(step);
      });
      calcPick = { type: t.value, tier: tr.value, opts: opts, sum: num(sum), days: d };
    };
    cForm.addEventListener('change', calc);
    cForm.addEventListener('change', function () { goal('calc', true); });
    calc();

    // на телефоне итог ниже опций — пока калькулятор на экране, нижняя кнопка показывает цену
    var mBtn = mbar && $('a', mbar), mText = mBtn && mBtn.textContent, cSec = $('#calc'), cBox = $('.calc__sum');
    var syncBar = function () {
      if (!mBtn) return;
      var s = cSec.getBoundingClientRect(), b = cBox.getBoundingClientRect(), vh = window.innerHeight;
      var on = s.top < vh * .6 && s.bottom > vh * .4 && b.top > vh - 40;
      mBtn.textContent = on ? '≈ ' + calcPick.sum + ' ₸ · отправить' : mText;
      mBtn.classList.toggle('is-calc', on);
    };
    window.addEventListener('scroll', syncBar, { passive: true });
    cForm.addEventListener('change', function () { setTimeout(syncBar, 0); });
    if (mBtn) mBtn.addEventListener('click', function (e) {
      if (!mBtn.classList.contains('is-calc')) return;
      e.preventDefault(); $('#c-send').click();
    });
    $('#c-send').addEventListener('click', function () {
      goal('calc_send');
      var r = $('input[name="type"][value="' + calcPick.type + '"]', form);
      if (r) { r.checked = true; render(); }
      if (!aboutIn.value.trim() || /^тариф «/.test(aboutIn.value)) aboutIn.value = 'тариф «' + calcPick.tier + '»' + (calcPick.opts.length ? ', ' + calcPick.opts.join(', ').toLowerCase() : '');
      priceEl.textContent = '≈ ' + calcPick.sum + ' ₸';
      form.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      setTimeout(function () { nameIn.focus({ preventScroll: true }); }, 500);
    });
  }

  // ---------- обслуживание: помесячно / на год ----------
  $$('input[name="care"]').forEach(function (r) {
    r.addEventListener('change', function () {
      var y = r.value === 'y';
      $$('.plan__sum').forEach(function (p) {
        p.innerHTML = y ? p.dataset.y + ' ₸<span>/год</span><small>' + p.dataset.ym + ' ₸ в месяц</small>' : p.dataset.m + ' ₸<span>/мес</span>';
      });
    });
  });

  // ---------- превью демо-сайтов: живая страница, уменьшенная под карточку ----------
  var views = $$('.demo-card__view');
  function fitViews() {
    views.forEach(function (v) {
      var k = v.clientWidth / 420, f = v.querySelector('iframe');
      v.style.setProperty('--k', k.toFixed(4));
      v.style.setProperty('--slide', -(f.offsetHeight - v.clientHeight / k) + 'px');
    });
  }
  if (views.length) { fitViews(); window.addEventListener('resize', fitViews); }

  render();
})();

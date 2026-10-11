// Анимации при прокрутке: появление блоков, счётчики в админке, полоса прогресса, параллакс скриншотов.
(function () {
  'use strict';
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // полоса прогресса под шапкой — тоже «провод»
  var bar = document.getElementById('progress');
  function progress() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ')';
  }
  window.addEventListener('scroll', progress, { passive: true }); progress();

  if (still) {
    document.documentElement.classList.remove('js-motion');
    return;
  }

  // у каждого раздела свой характер появления: [селектор, вариант, шаг задержки, начальная задержка]
  var groups = [
    // Первый экран — заголовок поднимается из-под маски, форма разворачивается, узлы выстраиваются
    ['.hero__title', 'rise', 0, .05],
    ['.hero__sub', 'blur', 0, .3],
    ['.hero__perks li', 'up', .08, .45],
    ['.hero__try', 'up', 0, .7],
    ['#order', 'flip', 0, .15],
    ['.line .node', 'left', .15, .55],
    // Работы — скриншоты разворачиваются в 3D с двух сторон
    ['.works .h2', 'left', 0, 0],
    ['.works .lead', 'blur', 0, .1],
    ['.shot--main', 'tiltl', 0, 0],
    ['.shot--over', 'tiltr', 0, .2],
    ['.case__title', 'rise', 0, 0],
    ['.case__what', 'up', 0, .1],
    ['.specs > div', 'right', .06, .15],
    ['.case__body > .btn', 'pop', 0, .4],
    ['.case--small', 'flip', 0, 0],
    // Демо-сайты — карточки падают сверху по очереди, полоса про админку прорисовывается
    ['.demos .h2', 'zoom', 0, 0],
    ['.demos .lead', 'up', 0, .1],
    ['.demo-card', 'drop', .14, .1],
    ['.demos__admin', 'wipe', 0, .3],
    // Админка — панель поднимается, строки заказов въезжают, сообщение Telegram «прилетает»
    ['.system__text .h2', 'rise', 0, 0],
    ['.system__text .lead', 'up', 0, .15],
    ['.ticks li', 'pop', .1, .2],
    ['.system__live, .system__note', 'up', .1, .6],
    ['.admin', 'flip', 0, 0],
    ['.admin__table tbody tr', 'left', .1, .45],
    ['.tgmsg', 'pop', 0, .9],
    // Цены — строки «прорисовываются» слева направо, тарифы откидываются
    ['.prices .h2', 'zoom', 0, 0],
    ['.prices .lead', 'up', 0, .1],
    ['.deal > div', 'up', .12, .1],
    ['.pricelist li', 'wipe', .08, 0],
    ['.prices__more', 'up', 0, .2],
    ['.care .h3, .care__lead, .care__switch', 'up', .08, 0],
    ['.plan', 'flip', .12, .1],
    // Калькулятор — типы сайта выпрыгивают, опции въезжают справа, итог поднимается
    ['.calc .h2', 'left', 0, 0],
    ['.calc .lead', 'blur', 0, .1],
    ['.ctype', 'pop', .06, .1],
    ['.tier', 'pop', .08, .15],
    ['.calc__inc', 'up', 0, .2],
    ['.opt', 'right', 0, .2],
    ['.calc__sum', 'rise', 0, .15],
    // Как работаю — линия тянется, шаги падают сверху по очереди
    ['.process .h2', 'right', 0, 0],
    ['.steps', 'wire', 0, 0],
    ['.steps li', 'drop', .16, .2],
    // Работаю один — проявление из размытия
    ['.direct__title', 'blur', 0, 0],
    ['.direct__list p', 'right', .14, .15],
    // Вопросы — раскладываются как карточки
    ['.faq .h2', 'left', 0, 0],
    ['.faq details', 'fold', .06, .1],
    // Финал — надпись надвигается
    ['.final__big', 'zoom', 0, 0],
    ['.final__sub, .final__btns', 'up', .12, .3]
  ];
  var items = [];
  groups.forEach(function (g) {
    $$(g[0]).forEach(function (el, i) {
      el.classList.add('rv', 'rv--' + g[1]);
      el.style.setProperty('--d', (g[3] + i * g[2]).toFixed(2) + 's');
      items.push(el);
    });
  });

  // анимация срабатывает каждый раз: при входе в экран — появление, при полном уходе — сброс.
  // Считаем по положению на экране, а не IntersectionObserver: тот не видит блоки, скрытые clip-path (wipe, rise).
  // Запас 90px при сбросе — больше любого сдвига анимации, чтобы блок не мигал на краю.
  var pending = false;
  function reveal() {
    pending = false;
    var vh = window.innerHeight;
    items.forEach(function (el) {
      var r = el.getBoundingClientRect(), on = el.classList.contains('in');
      if (!on && r.top < vh * .9 && r.bottom > vh * .05) {
        el.classList.add('in');
        if (el.classList.contains('admin')) countUp(el);
      } else if (on && (r.bottom < -90 || r.top > vh + 90)) {
        el.classList.remove('in');
      }
    });
  }
  function queue() { if (!pending) { pending = true; requestAnimationFrame(reveal); } }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  window.addEventListener('load', queue);
  reveal();

  // заголовки разделов чуть плывут, пока страница прокручивается
  var heads = $$('.h2, .direct__title, .final__big');
  var tick = false;
  function drift() {
    tick = false;
    var vh = window.innerHeight;
    heads.forEach(function (h) {
      var r = h.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var k = (r.top + r.height / 2 - vh / 2) / vh;
      h.style.translate = '0 ' + (k * -28).toFixed(1) + 'px';
    });
  }
  window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(drift); } }, { passive: true });
  drift();

  // цифры в примере админки набегают от нуля
  function countUp(root) {
    $$('.admin__kpis b', root).forEach(function (b) {
      var txt = b.dataset.txt || (b.dataset.txt = b.textContent), m = txt.match(/[\d\s]+/);
      if (!m) return;
      var target = parseInt(m[0].replace(/\s/g, ''), 10), t0 = null;
      function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
      function step(t) {
        if (!t0) t0 = t;
        var k = Math.min(1, (t - t0) / 1400), e = 1 - Math.pow(1 - k, 3);
        b.textContent = txt.replace(m[0].trim(), fmt(Math.round(target * e)));
        if (k < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  // скриншоты магазина слегка расходятся при прокрутке
  var shots = document.querySelector('.case__shots');
  var over = document.querySelector('.shot--over');
  if (shots && over) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var r = shots.getBoundingClientRect();
        var k = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight; // -1..1
        over.style.setProperty('--py', (Math.max(-1, Math.min(1, k)) * 36).toFixed(1) + 'px');
      });
    }, { passive: true });
  }
})();

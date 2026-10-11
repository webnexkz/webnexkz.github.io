// Общая «база» демо-сайтов WEBNEX. Хранится в браузере посетителя (localStorage):
// заказ с демо-сайта сразу виден в демо-админке, цена из админки — на демо-сайте.
// Все имена и цифры условные.
(function () {
  'use strict';
  var KEY_O = 'wxd-orders', KEY_P = 'wxd-products', KEY_S = 'wxd-status';

  var sites = {
    detailing: { name: 'BLACKLINE детейлинг', short: 'Детейлинг', url: '../detailing/', color: '#139bc4', kind: 'запись' },
    pizza:     { name: 'Пиццерия FORNO',      short: 'Пиццерия',  url: '../pizza/',     color: '#8b5cff', kind: 'доставка' },
    coffee:    { name: 'Кофейня «Зерно»',      short: 'Кофейня',   url: '../coffee/',    color: '#c7841c', kind: 'самовывоз' }
  };

  var catalog = {
    coffee: [
      { id: 'cap',  cat: 'Кофе',     name: 'Капучино',         price: 1200, desc: 'двойной эспрессо, молочная пена' },
      { id: 'lat',  cat: 'Кофе',     name: 'Латте',            price: 1300, desc: 'мягкий, много молока' },
      { id: 'flat', cat: 'Кофе',     name: 'Флэт уайт',        price: 1400, desc: 'крепче латте, бархатная текстура' },
      { id: 'raf',  cat: 'Кофе',     name: 'Раф ванильный',    price: 1600, desc: 'сливки, ваниль, эспрессо' },
      { id: 'ame',  cat: 'Кофе',     name: 'Американо',        price: 900,  desc: 'эспрессо и горячая вода' },
      { id: 'mat',  cat: 'Не кофе',  name: 'Матча латте',      price: 1700, desc: 'японский чай матча на молоке' },
      { id: 'coc',  cat: 'Не кофе',  name: 'Какао',            price: 1200, desc: 'густое, с маршмеллоу' },
      { id: 'cro',  cat: 'Десерты',  name: 'Круассан',         price: 1100, desc: 'сливочный, выпекаем утром' },
      { id: 'chz',  cat: 'Десерты',  name: 'Чизкейк',          price: 1500, desc: 'нью-йорк, ягодный соус' }
    ],
    pizza: [
      { id: 'mar', cat: 'Пицца',   name: 'Маргарита',    price: 2900, desc: 'томаты, моцарелла, базилик', top: ['basil', 'moz'] },
      { id: 'pep', cat: 'Пицца',   name: 'Пепперони',    price: 3400, desc: 'двойная пепперони, моцарелла', top: ['pep', 'moz'] },
      { id: 'che', cat: 'Пицца',   name: 'Четыре сыра',  price: 3700, desc: 'моцарелла, дор блю, пармезан, чеддер', top: ['moz', 'ched'] },
      { id: 'bbq', cat: 'Пицца',   name: 'Барбекю',      price: 3900, desc: 'курица, бекон, лук, соус барбекю', top: ['chick', 'onion'] },
      { id: 'mus', cat: 'Пицца',   name: 'Грибная',      price: 3200, desc: 'шампиньоны, сливочный соус, тимьян', top: ['mush', 'moz'] },
      { id: 'haw', cat: 'Пицца',   name: 'Гавайская',    price: 3300, desc: 'курица, ананас, моцарелла', top: ['pine', 'chick'] },
      { id: 'mor', cat: 'Напитки', name: 'Морс клюквенный 0,5', price: 700, desc: 'домашний' },
      { id: 'lem', cat: 'Напитки', name: 'Лимонад 0,5',  price: 800, desc: 'цитрус и мята' }
    ],
    detailing: [
      { id: 'wash', cat: 'Мойка',    name: 'Детейлинг-мойка',      price: 8000,   desc: 'двухфазная мойка, сушка, диски', hours: 1.5 },
      { id: 'pol',  cat: 'Кузов',    name: 'Полировка кузова',      price: 45000,  desc: 'убираем царапины и «паутинку»', hours: 8 },
      { id: 'cer',  cat: 'Кузов',    name: 'Керамика',              price: 120000, desc: 'защита и глубокий блеск до 2 лет', hours: 16 },
      { id: 'ppf',  cat: 'Кузов',    name: 'Плёнка на фары',        price: 25000,  desc: 'защита от сколов и помутнения', hours: 3 },
      { id: 'int',  cat: 'Салон',    name: 'Химчистка салона',      price: 35000,  desc: 'сиденья, потолок, пол, багажник', hours: 6 },
      { id: 'rain', cat: 'Стёкла',   name: 'Антидождь',             price: 6000,   desc: 'вода скатывается сама', hours: 1 }
    ]
  };

  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₸'; }

  function products(site) {
    var over = load(KEY_P, {})[site] || {};
    return catalog[site].map(function (p) {
      var o = over[p.id] || {}, c = {};
      for (var k in p) c[k] = p[k];
      if (o.price) c.price = o.price;
      c.off = !!o.off;
      return c;
    });
  }
  function setProduct(site, id, patch) {
    var all = load(KEY_P, {});
    all[site] = all[site] || {};
    var cur = all[site][id] || {};
    for (var k in patch) cur[k] = patch[k];
    all[site][id] = cur;
    save(KEY_P, all);
  }

  // условная история за 14 дней — одинаковая при каждом открытии
  function seed() {
    var s = 20261010;
    function r() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    var names = ['Айгерим К.', 'Данияр С.', 'Марина Л.', 'Ерлан Т.', 'Алия Н.', 'Тимур Б.', 'Сабина Ж.', 'Арман Д.', 'Ольга П.', 'Нурлан А.', 'Дина М.', 'Руслан Е.', 'Камила Р.', 'Сергей В.', 'Жанар О.', 'Асель У.'];
    var out = [], now = new Date(), n = 1000;
    for (var d = 13; d >= 0; d--) {
      var day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d);
      var wk = day.getDay() === 0 || day.getDay() === 6;
      ['coffee', 'pizza', 'detailing'].forEach(function (site) {
        var base = site === 'coffee' ? 9 : site === 'pizza' ? 6 : 1.3;
        var cnt = Math.round(base * (wk ? 1.35 : 1) * (.7 + r() * .6) * (1 + (13 - d) * .02));
        for (var i = 0; i < cnt; i++) {
          var cat = catalog[site], items = [], k = site === 'detailing' ? 1 : 1 + ((r() * 3) | 0);
          for (var j = 0; j < k; j++) { var p = cat[(r() * cat.length) | 0]; items.push({ name: p.name, qty: 1, price: p.price }); }
          var total = items.reduce(function (a, b) { return a + b.price * b.qty; }, 0);
          if (site === 'detailing' && r() < .4) total = Math.round(total * 1.2);
          var t = new Date(day); t.setHours(8 + ((r() * 13) | 0), (r() * 60) | 0);
          if (t > now) t = new Date(now - (r() * 3600000));
          out.push({ id: ++n, site: site, client: names[(r() * names.length) | 0], phone: '+7 7' + (((r() * 90) | 0) + 10) + ' ··· ·· ' + (((r() * 90) | 0) + 10), items: items, total: total, time: +t, status: d > 0 ? 'done' : (r() < .5 ? 'work' : 'done'), seed: true });
        }
      });
    }
    return out;
  }

  var seeded = null;
  function orders() {
    seeded = seeded || seed();
    var st = load(KEY_S, {});
    return seeded.concat(load(KEY_O, [])).map(function (o) { if (st[o.id]) o.status = st[o.id]; return o; })
      .sort(function (a, b) { return b.time - a.time; });
  }
  function addOrder(o) {
    var list = load(KEY_O, []);
    o.id = 2000 + list.length + 1; o.time = Date.now(); o.status = 'new';
    list.push(o); save(KEY_O, list);
    return o;
  }
  function setStatus(id, status) { var st = load(KEY_S, {}); st[id] = status; save(KEY_S, st); }
  function reset() { [KEY_O, KEY_P, KEY_S].forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} }); }

  // полоска «это демо» сверху каждого демо-сайта
  function ribbon(site) {
    var b = document.createElement('div');
    b.className = 'wxd-ribbon';
    b.innerHTML = '<a class="wxd-ribbon__brand" href="../../">WEBNEX <b>STUDIO</b></a>' +
      '<span class="wxd-ribbon__txt">Демо-сайт. Оформите заказ — он появится в админке</span>' +
      '<a class="wxd-ribbon__btn" href="../admin/?site=' + site + '" target="_blank" rel="noopener">Открыть админку</a>' +
      '<a class="wxd-ribbon__btn wxd-ribbon__btn--main" href="../../#calc">Хочу такой сайт</a>';
    document.body.insertBefore(b, document.body.firstChild);
    var css = document.createElement('style');
    css.textContent = '.wxd-ribbon{position:relative;z-index:1000;display:flex;align-items:center;gap:12px;padding:8px 16px;background:#060b24;color:#e8eeff;font:500 13px/1.3 system-ui,sans-serif;border-bottom:1px solid #22337a}' +
      '.wxd-ribbon a{color:inherit;text-decoration:none}.wxd-ribbon__brand{font-weight:800;letter-spacing:.12em;white-space:nowrap}.wxd-ribbon__brand b{font-weight:400;color:#29d3ff}' +
      '.wxd-ribbon__txt{flex:1;color:#9aa6d2}.wxd-ribbon__btn{padding:6px 12px;border:1px solid #22337a;border-radius:8px;white-space:nowrap}.wxd-ribbon__btn:hover{border-color:#29d3ff}' +
      '.wxd-ribbon__btn--main{background:#29d3ff;color:#04122e!important;border-color:#29d3ff;font-weight:700}' +
      '@media(max-width:700px){.wxd-ribbon__txt{display:none}.wxd-ribbon{gap:6px;padding:7px 10px;font-size:11.5px}.wxd-ribbon__brand{flex:1;letter-spacing:.06em}.wxd-ribbon__btn{padding:6px 8px}}';
    document.head.appendChild(css);
  }

  window.WXD = { sites: sites, catalog: catalog, products: products, setProduct: setProduct, orders: orders, addOrder: addOrder, setStatus: setStatus, reset: reset, fmt: fmt, ribbon: ribbon };
})();

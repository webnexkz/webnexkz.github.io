// Фон: схема из проводов, по которой бегут сигналы. Слой медленнее страницы (параллакс).
(function () {
  'use strict';
  var cv = document.getElementById('bg');
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var CELL = 56, PAR = 0.28;            // шаг сетки и скорость параллакса
  var W, H, dpr, worldH, paths = [], pulses = [], flashes = [];
  var mouse = { x: -999, y: -999 };
  var CYAN = '41,211,255', VIOLET = '139,92,255';

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, W < 700 ? 1.5 : 2);
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    var docH = Math.max(document.documentElement.scrollHeight, H);
    worldH = H + (docH - H) * PAR + CELL * 2;

    paths = [];
    var cols = Math.ceil(W / CELL), rows = Math.ceil(worldH / CELL);
    var count = Math.round(cols * rows / (W < 700 ? 14 : 10));
    for (var i = 0; i < count; i++) {
      var x = ((Math.random() * (cols + 1)) | 0) * CELL;
      var y = ((Math.random() * rows) | 0) * CELL;
      var pts = [[x, y]], len = 0;
      var dir = Math.random() < .5 ? 'h' : 'v';
      var segs = (rnd(2, 6)) | 0;
      for (var s = 0; s < segs; s++) {
        var n = ((rnd(1, 5)) | 0) * CELL * (Math.random() < .5 ? -1 : 1);
        var nx = x, ny = y;
        if (dir === 'h') nx += n; else if (dir === 'v') ny += n; else { nx += n; ny += Math.abs(n) * (Math.random() < .5 ? -1 : 1); }
        len += Math.hypot(nx - x, ny - y);
        x = nx; y = ny; pts.push([x, y]);
        dir = dir === 'd' ? pick(['h', 'v']) : (Math.random() < .22 ? 'd' : (dir === 'h' ? 'v' : 'h'));
      }
      var minY = Infinity, maxY = -Infinity;
      pts.forEach(function (p) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); });
      paths.push({ pts: pts, len: len, minY: minY, maxY: maxY, tone: Math.random() < .3 ? VIOLET : CYAN, chip: Math.random() < .14,
        led: rnd(0, 6.283), ledV: rnd(1.2, 3.2) });
    }
  }

  function at(p, d) {                    // точка на пути на расстоянии d
    for (var i = 1; i < p.pts.length; i++) {
      var a = p.pts[i - 1], b = p.pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (d <= l) { var t = d / l; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
      d -= l;
    }
    return p.pts[p.pts.length - 1];
  }

  // сигнал идёт от начала провода к концу или, если rev, от конца к началу
  function pos(u, d) { return at(u.p, u.rev ? u.p.len - d : d); }

  function visible(p, off) { return p.maxY - off > -40 && p.minY - off < H + 40; }

  function spawn(off) {
    var vis = paths.filter(function (p) { return visible(p, off) && p.len > CELL * 3; });
    if (!vis.length) return;
    var p = pick(vis);
    pulses.push({ p: p, d: 0, v: rnd(160, 300), tail: rnd(70, 130) });
  }

  // из точки (x, y мира) расходятся сигналы по ближайшим проводам — от того конца, что ближе
  var rings = [];
  function burst(x, y, radius, n, tone) {
    var near = [];
    paths.forEach(function (p) {
      var a = p.pts[0], b = p.pts[p.pts.length - 1];
      var da = Math.hypot(a[0] - x, a[1] - y), db = Math.hypot(b[0] - x, b[1] - y);
      var d = Math.min(da, db);
      if (d < radius) near.push({ p: p, d: d, rev: db < da });
    });
    near.sort(function (m, k) { return m.d - k.d; });
    near.slice(0, n).forEach(function (m, i) {
      pulses.push({ p: m.p, d: -i * 30, v: rnd(240, 340), tail: rnd(60, 100), rev: m.rev, tone: tone });
    });
    rings.push({ x: x, y: y, t: 0, tone: tone || CYAN });
  }

  // время от времени одна из микросхем «срабатывает» и рассылает сигналы
  var nextCascade = 3;
  function cascade(off) {
    var chips = paths.filter(function (p) {
      var e = p.pts[p.pts.length - 1];
      return p.chip && e[1] - off > 40 && e[1] - off < H - 40;
    });
    if (!chips.length) return;
    var c = pick(chips), e = c.pts[c.pts.length - 1];
    c.fire = 1;
    burst(e[0], e[1], CELL * 4, W < 700 ? 2 : 4, c.tone);
  }

  function draw(dt) {
    var off = window.scrollY * PAR;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.translate(0, -off);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var my = mouse.y + off;

    // провода
    for (var i = 0; i < paths.length; i++) {
      var p = paths[i];
      if (!visible(p, off)) continue;
      var a0 = p.pts[0], a1 = p.pts[p.pts.length - 1];
      var near = Math.max(0, 1 - Math.hypot(a0[0] - mouse.x, a0[1] - my) / 260);
      ctx.strokeStyle = 'rgba(80,115,225,' + (0.26 + near * .3) + ')';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(a0[0], a0[1]);
      for (var k = 1; k < p.pts.length; k++) ctx.lineTo(p.pts[k][0], p.pts[k][1]);
      ctx.stroke();
      // узлы на концах
      ctx.fillStyle = '#060b24';
      ctx.strokeStyle = 'rgba(' + p.tone + ',' + (0.28 + near * .5) + ')';
      ctx.lineWidth = 1.4;
      [a0, a1].forEach(function (q) { ctx.beginPath(); ctx.arc(q[0], q[1], 3.2, 0, 6.283); ctx.fill(); ctx.stroke(); });
      if (p.chip) { // «микросхема» на конце провода
        ctx.strokeStyle = 'rgba(80,115,225,' + (0.32 + near * .3) + ')';
        ctx.fillStyle = 'rgba(12,22,64,.9)';
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(a1[0] - 13, a1[1] - 9, 26, 18, 3) : ctx.rect(a1[0] - 13, a1[1] - 9, 26, 18);
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        for (var c = -8; c <= 8; c += 8) { ctx.moveTo(a1[0] + c, a1[1] - 9); ctx.lineTo(a1[0] + c, a1[1] - 13); ctx.moveTo(a1[0] + c, a1[1] + 9); ctx.lineTo(a1[0] + c, a1[1] + 13); }
        ctx.stroke();
        // светодиод на микросхеме мигает в своём ритме; при срабатывании горит ярко
        if (!still) {
          p.led += p.ledV * dt;
          if (p.fire) p.fire = Math.max(0, p.fire - dt * .8);
          var lv = Math.max(p.fire || 0, Math.pow(Math.max(0, Math.sin(p.led)), 6));
          if (lv > .02) {
            ctx.fillStyle = 'rgba(' + p.tone + ',' + (.25 + lv * .75) + ')';
            if (lv > .5) { ctx.shadowColor = 'rgba(' + p.tone + ',.9)'; ctx.shadowBlur = 8 * lv; }
            ctx.beginPath(); ctx.arc(a1[0] + 6, a1[1], 2.2, 0, 6.283); ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }
    }

    if (still) return;

    // сигналы
    for (var j = pulses.length - 1; j >= 0; j--) {
      var u = pulses[j];
      u.d += u.v * dt;
      if (u.d < 0) continue;               // сигнал из «веера» ждёт своей очереди
      var tone = u.tone || u.p.tone;
      var head = pos(u, Math.min(u.d, u.p.len));
      // хвост — сплошная линия, ярче к голове
      var steps = 14, prev = null;
      for (var s = steps; s >= 0; s--) {
        var d = Math.max(0, Math.min(u.p.len, u.d - u.tail * s / steps));
        var q = pos(u, d), al = 1 - s / steps;
        if (prev) {
          ctx.strokeStyle = 'rgba(' + tone + ',' + (al * .95) + ')';
          ctx.lineWidth = .8 + al * 1.8;
          ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
        }
        prev = q;
      }
      if (u.d <= u.p.len) {
        ctx.shadowColor = 'rgba(' + tone + ',.9)'; ctx.shadowBlur = 12;
        ctx.fillStyle = '#eafcff';
        ctx.beginPath(); ctx.arc(head[0], head[1], 2.6, 0, 6.283); ctx.fill();
        ctx.shadowBlur = 0;
      }
      if (u.d - u.tail > u.p.len) {
        flashes.push({ x: head[0], y: head[1], t: 0, tone: tone });
        pulses.splice(j, 1);
      }
    }
    // вспышка узла, куда дошёл сигнал
    for (var f = flashes.length - 1; f >= 0; f--) {
      var fl = flashes[f]; fl.t += dt;
      var k2 = fl.t / .7;
      if (k2 >= 1) { flashes.splice(f, 1); continue; }
      ctx.strokeStyle = 'rgba(' + fl.tone + ',' + (1 - k2) * .8 + ')';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(fl.x, fl.y, 3 + k2 * 14, 0, 6.283); ctx.stroke();
      ctx.fillStyle = 'rgba(' + fl.tone + ',' + (1 - k2) + ')';
      ctx.beginPath(); ctx.arc(fl.x, fl.y, 3, 0, 6.283); ctx.fill();
    }
    // круги от касания и от сработавшей микросхемы
    for (var r = rings.length - 1; r >= 0; r--) {
      var rg = rings[r]; rg.t += dt;
      var k3 = rg.t / 1.1;
      if (k3 >= 1) { rings.splice(r, 1); continue; }
      var e3 = 1 - Math.pow(1 - k3, 3);
      ctx.strokeStyle = 'rgba(' + rg.tone + ',' + (1 - k3) * .55 + ')';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(rg.x, rg.y, 6 + e3 * 70, 0, 6.283); ctx.stroke();
      ctx.strokeStyle = 'rgba(' + rg.tone + ',' + (1 - k3) * .3 + ')';
      ctx.beginPath(); ctx.arc(rg.x, rg.y, 4 + e3 * 36, 0, 6.283); ctx.stroke();
    }
    var max = W < 700 ? 4 : 8;
    if (pulses.length < max && Math.random() < dt * 2.2) spawn(off);
    nextCascade -= dt;
    if (nextCascade <= 0) { nextCascade = rnd(4, 8); if (pulses.length < max + 4) cascade(off); }
  }

  var last = 0, raf = 0;
  function loop(t) {
    var dt = Math.min(.05, (t - last) / 1000 || 0); last = t;
    draw(dt);
    raf = requestAnimationFrame(loop);
  }
  function resize() {
    var nw = window.innerWidth, nh = window.innerHeight;
    if (nw === W && Math.abs(nh - H) < 120 && paths.length) return; // мобильная адресная строка
    W = nw; H = nh; build(); draw(0);
  }

  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('load', function () { W = 0; resize(); });
  if (still) { window.addEventListener('scroll', function () { draw(0); }, { passive: true }); return; }
  window.addEventListener('pointermove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  // нажатие на пустое место фона — от ближайших узлов расходятся сигналы
  window.addEventListener('pointerdown', function (e) {
    if (e.target.closest && e.target.closest('a,button,input,label,select,textarea,summary,iframe,.node-card,.admin,.demo-card')) return;
    if (pulses.length > (W < 700 ? 10 : 16)) return;
    burst(e.clientX, e.clientY + window.scrollY * PAR, CELL * 3.5, W < 700 ? 3 : 5, Math.random() < .3 ? VIOLET : CYAN);
  }, { passive: true });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) cancelAnimationFrame(raf); else { last = performance.now(); raf = requestAnimationFrame(loop); }
  });
  raf = requestAnimationFrame(loop);
})();

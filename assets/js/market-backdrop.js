/* Decorative pixel-block market backdrop.
 * A grid of square "pixels" forms candlestick columns that drift slowly and
 * breathe: every block fades in and out on its own phase, with occasional
 * brighter flickers. The series is a synthetic mean-reverting random walk -
 * decoration, not market data.
 * Honours prefers-reduced-motion by painting a single static frame.
 */
(function () {
  'use strict';

  var canvas = document.getElementById('backdrop');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');

  var CELL = 31;        // block pitch in CSS px (block + gap), set in layout()
  var GAP = 6;          // gap, so blocks read as discrete pixels
  var NARROW = 700;     // below this width the grid is scaled down
  var DRIFT = 7;        // px per second of horizontal drift

  var UP = '93,138,168';     // steel blue
  var DOWN = '177,112,122';  // muted rose
  var WICK = '109,127,141';

  var BODY_ALPHA = 0.34;
  var WICK_ALPHA = 0.15;

  var cols = [];        // each: {open, close, high, low, rising, seed}
  var rows = 0, colCount = 0, mid = 0;
  var level = 0, nextSeed = 1;
  var width = 0, height = 0, dpr = 1;
  var offset = 0, last = 0, raf = null;
  var reduce = false;

  function rnd(seed) {            // deterministic pseudo-random from an integer
    var x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }

  function gauss(seed) {          // cheap bell-ish noise in roughly [-1, 1]
    return (rnd(seed) + rnd(seed * 1.7 + 3) + rnd(seed * 2.3 + 7) - 1.5) / 1.5;
  }

  function makeColumn() {
    var seed = nextSeed++;
    level += -0.55 * level + gauss(seed) * 1.5;        // mean-reverting walk
    var span = Math.max(2, Math.floor(rows * 0.34));
    var open = level;
    var close = level + gauss(seed * 3.1 + 11) * 1.6;
    var top = Math.max(open, close);
    var bottom = Math.min(open, close);
    return {
      open: open,
      close: close,
      high: top + rnd(seed * 5.3) * 1.8 + 0.4,
      low: bottom - rnd(seed * 7.9) * 1.8 - 0.4,
      rising: close >= open,
      seed: seed,
      span: span
    };
  }

  function layout() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;

    // Narrow screens get smaller, fainter blocks so the backdrop stays behind
    // the text rather than competing with it.
    var narrow = width < NARROW;
    CELL = narrow ? 22 : 31;
    GAP = narrow ? 5 : 6;
    BODY_ALPHA = narrow ? 0.26 : 0.34;
    WICK_ALPHA = narrow ? 0.12 : 0.15;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    rows = Math.ceil(height / CELL) + 2;
    colCount = Math.ceil(width / CELL) + 3;
    mid = rows / 2;

    cols = [];
    level = 0;
    nextSeed = 1;
    for (var i = 0; i < colCount; i++) cols.push(makeColumn());
  }

  // Row index (0 = top) for a walk value, clamped into the grid.
  function rowFor(value) {
    var r = Math.round(mid - value * (rows * 0.11));
    return Math.max(0, Math.min(rows - 1, r));
  }

  function cellAlpha(col, row, t) {
    if (reduce) return 0.8;
    // Slow column-wide swell: the whole candle rises and falls together, so the
    // grid reads as chart columns rather than random noise.
    var colPhase = rnd(col.seed * 5.17) * Math.PI * 2;
    var colWave = 0.5 + 0.5 * Math.sin(t * 0.38 + colPhase);
    var swell = 0.45 + 0.55 * colWave;

    // Faster per-cell shimmer layered on top of the column swell.
    var phase = rnd(col.seed * 31.7 + row * 7.31) * Math.PI * 2;
    var speed = 0.55 + rnd(col.seed * 13.1 + row * 2.7) * 0.9;
    var wave = 0.5 + 0.5 * Math.sin(t * speed + phase);
    var breathe = swell * (0.55 + 0.45 * wave * wave);
    var flickSeed = rnd(col.seed * 3.77 + row * 19.3);
    if (flickSeed > 0.93) {                                   // rare bright blink
      var blink = 0.5 + 0.5 * Math.sin(t * (1.9 + flickSeed) + phase * 1.7);
      breathe = Math.min(1, breathe + 0.55 * blink * blink * blink);
    }
    return breathe;
  }

  function draw(now) {
    var t = now / 1000;
    if (!reduce) {
      var dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      offset += dt * DRIFT;
      while (offset >= CELL) {                 // recycle the leftmost column
        offset -= CELL;
        cols.shift();
        cols.push(makeColumn());
      }
    }

    ctx.clearRect(0, 0, width, height);
    var size = CELL - GAP;

    for (var i = 0; i < cols.length; i++) {
      var col = cols[i];
      var x = Math.round(i * CELL - offset);
      if (x + size < 0 || x > width) continue;

      var bodyTop = rowFor(Math.max(col.open, col.close));
      var bodyBottom = rowFor(Math.min(col.open, col.close));
      var highRow = rowFor(col.high);
      var lowRow = rowFor(col.low);
      var colour = col.rising ? UP : DOWN;

      for (var row = highRow; row <= lowRow; row++) {
        var inBody = row >= bodyTop && row <= bodyBottom;
        var base = inBody ? BODY_ALPHA : WICK_ALPHA;
        var a = base * cellAlpha(col, row, t);
        if (a < 0.012) continue;
        var y = Math.round(row * CELL - CELL);
        ctx.fillStyle = 'rgba(' + (inBody ? colour : WICK) + ',' + a.toFixed(3) + ')';
        if (inBody) {
          ctx.fillRect(x, y, size, size);
        } else {
          var w = Math.round(size * 0.34);
          ctx.fillRect(x + Math.round((size - w) / 2), y, w, size);
        }
      }
    }

    if (!reduce) raf = requestAnimationFrame(draw);
  }

  function start() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    last = 0;
    layout();
    if (reduce) draw(performance.now());
    else raf = requestAnimationFrame(draw);
  }

  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  reduce = !!(mq && mq.matches);
  if (mq) {
    var onChange = function () { reduce = mq.matches; start(); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(start, 180);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    } else if (!raf && !reduce) {
      last = 0;
      raf = requestAnimationFrame(draw);
    }
  });

  canvas.setAttribute('data-backdrop-ready', 'true');
  start();
})();

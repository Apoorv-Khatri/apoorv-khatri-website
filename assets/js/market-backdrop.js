/* Decorative synthetic candles: fine red/green pixels and one shared breath.
 * No market data. Inert background; reduced motion paints a still frame.
 */
(function () {
  'use strict';
  var canvas = document.getElementById('backdrop');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;
  var GREEN = '22,153,100', RED = '218,67,76';
  var width, height, pitch, pixel, gap, bodyWidth, scale, dpr;
  var columns = [], level = 0, seed = 1, offset = 0;
  var raf = null, last = 0, elapsed = 0;
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduce = mq.matches;
  function random(n) {
    var x = Math.sin(n * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }
  function next() {
    var s = seed++;
    var open = level;
    var change = (random(s * 7.1) - 0.5) * 1.3 - level * 0.12;
    // Visible bodies, without turning the wick into the dominant feature.
    if (Math.abs(change) < 0.18) change = change < 0 ? -0.18 : 0.18;
    level = open + change;
    return {open: open, close: level,
      high: Math.max(open, level) + 0.12 + random(s * 5.3) * 0.36,
      low: Math.min(open, level) - 0.12 - random(s * 3.7) * 0.36,
      colour: level >= open ? GREEN : RED, seed: s};
  }
  function layout() {
    width = canvas.clientWidth; height = canvas.clientHeight;
    var narrow = width < 700;
    pitch = narrow ? 35 : 52;
    pixel = narrow ? 3 : 4;
    gap = 1;
    bodyWidth = narrow ? 15 : 24;
    scale = Math.min(height * 0.16, narrow ? 115 : 155);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    columns = []; level = 0; seed = 1; offset = 0;
    for (var i = 0; i < Math.ceil(width / pitch) + 3; i++) columns.push(next());
  }
  function y(value) { return height * 0.5 - value * scale; }
  function pixels(x, top, w, h, col, alpha) {
    // Fixed fine squares preserve a crisp pixel-art silhouette.
    for (var yy = 0; yy < h; yy += pixel + gap) {
      for (var xx = 0; xx < w; xx += pixel + gap) {
        var texture = 0.82 + 0.18 * random(col.seed * 11 + xx * 3 + yy);
        ctx.fillStyle = 'rgba(' + col.colour + ',' + (alpha * texture).toFixed(4) + ')';
        ctx.fillRect(Math.round(x + xx), Math.round(top + yy),
          Math.min(pixel, w - xx), Math.min(pixel, h - yy));
      }
    }
  }
  function draw(now) {
    if (!reduce) {
      var dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now; elapsed += dt; offset += dt * 3;
      while (offset >= pitch) {
        offset -= pitch; columns.shift(); columns.push(next());
      }
    }
    // One synchronised eight-second dim -> bright -> dim cycle. No blinking.
    var breath = reduce ? 0.65 : 0.14 + 0.86 * (0.5 - 0.5 * Math.cos(elapsed * Math.PI / 4));
    var alpha = (width < 700 ? 0.23 : 0.30) * breath;
    ctx.clearRect(0, 0, width, height);
    for (var i = 0; i < columns.length; i++) {
      var c = columns[i];
      var x = i * pitch - offset;
      var top = y(Math.max(c.open, c.close));
      var bottom = y(Math.min(c.open, c.close));
      pixels(x + (bodyWidth - pixel) / 2, y(c.high), pixel,
        Math.max(0, top - y(c.high)), c, alpha * 0.8);
      pixels(x, top, bodyWidth, Math.max(pixel, bottom - top), c, alpha);
      pixels(x + (bodyWidth - pixel) / 2, bottom, pixel,
        Math.max(0, y(c.low) - bottom), c, alpha * 0.8);
    }
    if (!reduce) raf = requestAnimationFrame(draw);
  }
  function start() {
    if (raf !== null) cancelAnimationFrame(raf);
    raf = null; last = 0;
    layout();
    if (!document.hidden) {
      if (reduce) draw(performance.now());
      else raf = requestAnimationFrame(draw);
    }
    canvas.setAttribute('data-backdrop-ready', 'true');
  }
  var timer;
  window.addEventListener('resize', function () {
    clearTimeout(timer); timer = setTimeout(start, 180);
  });
  mq.addEventListener('change', function () { reduce = mq.matches; start(); });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    } else {
      last = 0;
      if (reduce) draw(performance.now());
      else if (raf === null) raf = requestAnimationFrame(draw);
    }
  });
  start();
})();

"""Generate a decorative, seamlessly-tiling candlestick strip SVG.

Drawn at its final display height so nothing is scaled down. The series is a
deterministic mean-reverting random walk (fixed seed) that is de-trended so the
last close equals the first open, letting the tile repeat without a seam.
Decoration only - not market data.
"""
import random
from pathlib import Path

H = 74             # tile height == CSS display height, so no downscaling
W_STEP = 19        # horizontal distance between candles
BODY = 9           # candle body width
N = 70             # candles per tile
TILE_W = N * W_STEP
MID = H / 2
AMPLITUDE = 26     # max excursion from the midline, in px

random.seed(7)

# Mean-reverting (Ornstein-Uhlenbeck) walk: wanders visibly but stays in frame.
level = 0.0
levels = [level]
for _ in range(N):
    level += -0.62 * level + random.gauss(0, 1.0)
    levels.append(level)

# De-trend so the strip loops seamlessly.
drift = (levels[-1] - levels[0]) / N
levels = [v - drift * i for i, v in enumerate(levels)]

peak = max(abs(v) for v in levels) or 1.0
SCALE = AMPLITUDE / peak

UP = '#5d8aa8'      # muted steel blue
DOWN = '#b1707a'    # muted rose
WICK = '#6d7f8d'


def y(v):
    return MID - v * SCALE


parts = [
    f'<svg xmlns="http://www.w3.org/2000/svg" width="{TILE_W}" height="{H}" '
    f'viewBox="0 0 {TILE_W} {H}" fill="none">'
]

for i in range(N):
    o, c = levels[i], levels[i + 1]
    x = i * W_STEP + W_STEP / 2
    wick_up = random.uniform(0.3, 1.1)
    wick_dn = random.uniform(0.3, 1.1)
    rising = c >= o
    top, bottom = y(max(o, c)), y(min(o, c))
    height = max(bottom - top, 3.0)          # doji still gets a visible bar
    high_y = max(top - wick_up * SCALE, 1.0)
    low_y = min(bottom + wick_dn * SCALE, H - 1.0)
    parts.append(
        f'<path d="M{x:.1f} {high_y:.1f}V{low_y:.1f}" stroke="{WICK}" '
        f'stroke-width="1.5" stroke-linecap="round" opacity=".7"/>'
    )
    parts.append(
        f'<rect x="{x - BODY / 2:.1f}" y="{top:.1f}" width="{BODY}" '
        f'height="{height:.1f}" rx="1.5" fill="{UP if rising else DOWN}" '
        f'fill-opacity="{0.9 if rising else 0.85}"/>'
    )

parts.append('</svg>')
svg = ''.join(parts)

out = Path(__file__).resolve().parents[1] / 'assets' / 'images' / 'ticker.svg'
out.write_text(svg, encoding='utf-8')

bodies = [abs(levels[i + 1] - levels[i]) * SCALE for i in range(N)]
print('wrote', out)
print('tile', TILE_W, 'x', H, '| median body height %.1fpx' % sorted(bodies)[N // 2],
      '| max %.1fpx' % max(bodies))
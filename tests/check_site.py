"""Local-only browser checks; never deploys or modifies GitHub."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'test-results'
OUTPUT.mkdir(exist_ok=True)
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(ROOT)))
Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'
try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('console', lambda msg: errors.append(msg.text) if msg.type == 'error' else None)
        page.on('response', lambda response: errors.append(str(response.status) + ' ' + response.url) if response.status >= 400 else None)
        for width in (1440, 768, 390, 320):
            page.set_viewport_size({'width': width, 'height': 1000})
            for route, heading in (('/index.html', 'Home'), ('/working-papers/index.html', 'Working Papers')):
                page.goto(base + route, wait_until='networkidle')
                page.evaluate('document.fonts.ready')
                assert page.locator('nav a').all_text_contents() == ['Home', 'CV', 'Working Papers']
                assert page.locator('nav [aria-current="page"]').inner_text() == heading
                assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), (width, route)
                assert page.locator('img').evaluate_all('(images) => images.every(i => i.complete && i.naturalWidth > 0)')
                assert page.evaluate('document.fonts.check(\'18px Merriweather\')')
                assert '/blob/main/cv/Apoorv-Khatri-CV.pdf' in page.get_by_role('link', name='CV', exact=True).get_attribute('href')
                backdrop = page.locator('#backdrop')
                assert backdrop.count() == 1
                assert backdrop.get_attribute('aria-hidden') == 'true'
                page.wait_for_selector('#backdrop[data-backdrop-ready]', timeout=5000)
                assert page.evaluate("document.querySelector('#backdrop').width > 0")
                assert page.evaluate("getComputedStyle(document.querySelector('#backdrop')).position") == 'fixed'
                assert page.evaluate("getComputedStyle(document.querySelector('#backdrop')).pointerEvents") == 'none'
                assert 'Hong Kong University of Science and Technology' not in page.content()
                if heading == 'Home':
                    assert page.locator('.about p').all_text_contents() == [
                        'I am a first-year PhD student in Finance at HKUST Business School.',
                        'My research interests are Corporate Finance & Financial Intermediation.'
                    ]
                    assert page.locator('address p').all_text_contents() == [
                        'Email: akhatri@connect.ust.hk',
                        'Office: 5067, 5th Floor, Lee Shau Kee Business Building, HKUST.'
                    ]
                    assert page.get_by_role('link', name='akhatri@connect.ust.hk').get_attribute('href') == 'mailto:akhatri@connect.ust.hk'
                    assert 'blue bird' in page.locator('.portrait').get_attribute('alt')
                    assert 'You can find my research' not in page.content()
                if width in (1440, 390):
                    name = 'home' if heading == 'Home' else 'working-papers'
                    page.screenshot(path=str(OUTPUT / f'{name}-{width}.png'), full_page=True)
            page.get_by_role('link', name='Home', exact=True).click()
            assert page.title() == 'Home | Apoorv Khatri'
            page.locator('nav').get_by_role('link', name='Working Papers', exact=True).click()
            assert page.title() == 'Working Papers | Apoorv Khatri'
        response = page.request.get(base + '/cv/Apoorv-Khatri-CV.pdf')
        assert response.ok and response.body().startswith(b'%PDF-')
        assert not errors, errors
        browser.close()
        print('PASS: both HTML pages at 1440, 768, 390 and 320px; navigation; no overflow; images; local font; PDF; no browser or HTTP errors.')
finally:
    server.shutdown()
    server.server_close()

"""Smoke-test the reference-inspired academic website; never deploys."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'test-results'
OUT.mkdir(exist_ok=True)
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}'
try:
 with sync_playwright() as p:
  browser=p.chromium.launch()
  page=browser.new_page()
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('response',lambda r:errors.append(f'{r.status}: {r.url}') if r.status>=400 else None)
  for width in (1440,1024,768,390,320):
   page.set_viewport_size({'width':width,'height':1000})
   for route,name in [('/index.html','Home'),('/working-papers/index.html','Working Papers')]:
    page.goto(base+route,wait_until='networkidle')
    assert page.locator('nav a').all_text_contents()==['Home','CV','Working Papers']
    assert page.locator('nav [aria-current="page"]').inner_text()==name
    assert page.title()==name+' | Apoorv Khatri'
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,route)
    assert page.locator('canvas').count()==0
    assert page.locator('script').count()==0
    assert page.locator('img').evaluate_all('(xs)=>xs.every(x=>x.complete&&x.naturalWidth>0)')
    assert 'Pavel' not in page.content() and 'Simon Business School' not in page.content()
    assert page.locator('address li').all_text_contents()==['Email: akhatri@connect.ust.hk','Office: 5067, 5th Floor, Lee Shau Kee Business Building, HKUST.']
    assert '/blob/main/cv/Apoorv-Khatri-CV.pdf' in page.locator('nav').get_by_role('link',name='CV',exact=True).get_attribute('href')
    assert page.get_by_role('heading',name='Pre-PhD Working Paper',exact=True).count()==1
    assert page.locator('article.paper .paper-title').inner_text()=='Irrational Managers, Crises, and Rational Expectations Equilibrium'
    assert page.locator('article.paper p').inner_text()=='with Kaushalendra Kishore'
    if name=='Home':
     styles=page.locator('.introduction p').evaluate_all('(xs)=>xs.map(x=>{const s=getComputedStyle(x);return {font:s.font,color:s.color,margin:s.margin}})')
     assert styles[0]==styles[1],styles
     if width==1440: print('Welcome and biography computed styles:', styles)
     assert page.locator('.introduction p').all_text_contents()==['Welcome!', 'My name is Apoorv Khatri. I am a first-year Finance PhD student at The Hong Kong University of Science and Technology. I received my master’s degree in Economics from Delhi School of Economics.']
     assert page.locator('.profile-info > p').inner_text()=='Corporate Finance & Financial Intermediation'
     assert page.locator('.jumbotron').evaluate('(x)=>getComputedStyle(x).backgroundColor')=='rgb(247, 240, 225)'
     if width==1440:
      assert page.locator('.container').first.bounding_box()['width']==1000
      assert page.locator('.photo').bounding_box()['x']<page.locator('.profile-info').bounding_box()['x']
    if width in (1440,390):page.screenshot(path=str(OUT/f'redesign-{name.lower().replace(" ","-")}-{width}.png'),full_page=True)
   page.locator('nav').get_by_role('link',name='Home',exact=True).click()
   assert page.title()=='Home | Apoorv Khatri'
   page.locator('nav').get_by_role('link',name='Working Papers',exact=True).click()
   assert page.title()=='Working Papers | Apoorv Khatri'
  pdf=page.request.get(base+'/cv/Apoorv-Khatri-CV.pdf')
  assert pdf.ok and pdf.body().startswith(b'%PDF-')
  assert not errors,errors
  browser.close()
  print('PASS: 2 pages at 5 viewport sizes; reference layout, biography, contact, navigation, images, CV, no overflow or failed requests; no animation or analytics scripts.')
finally:
 server.shutdown()
 server.server_close()

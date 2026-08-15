from pathlib import Path
import re

root = Path('.')

# 1) Restore full branding anywhere newer resource pages regressed it.
for p in root.rglob('*.html'):
    s = p.read_text(encoding='utf-8')
    s = s.replace('<strong>Engineering Academy</strong>', "<strong>Sajjad's Engineering Academy</strong>")
    for old in [
        'SEA Reliability Faculty','SEA Automation Faculty','SEA Electrical Faculty',
        'SEA Energy Faculty','SEA Utilities Faculty','SEA Leadership Faculty'
    ]:
        s = s.replace(old, "Sajjad's Engineering Academy")
    p.write_text(s, encoding='utf-8')

# 2) Protect the resource hub and structured resource libraries.
protected = [Path('resources.html'), *Path('resource-library').glob('*.html')]
for p in protected:
    s = p.read_text(encoding='utf-8')
    if '<meta name="robots"' not in s:
        s = s.replace('</title>', '</title><meta name="robots" content="noindex,follow">', 1)
    else:
        s = re.sub(r'<meta name="robots"[^>]*>', '<meta name="robots" content="noindex,follow">', s, count=1)
    if 'src="/auth.js" data-protect' not in s:
        s = s.replace('</head>', '<script src="/auth.js" data-protect></script></head>', 1)
    p.write_text(s, encoding='utf-8')

# 3) Keep engineering guides public/indexable for SEO, while still showing account UI.
for p in Path('guides').rglob('*.html'):
    s = p.read_text(encoding='utf-8')
    s = s.replace('<script src="/auth.js" data-protect></script>', '')
    if 'src="/auth.js"' not in s:
        s = s.replace('</body>', '<script src="/auth.js"></script></body>', 1)
    p.write_text(s, encoding='utf-8')

# 4) Update browser account gate: protected resources/downloads only; mobile controls live in menu.
p = Path('auth.js')
s = p.read_text(encoding='utf-8')
s = s.replace(
    "return /(^|\\/)(resources\\.html|guides(?:\\/|$)|downloads(?:\\/|$))/.test(u.pathname);",
    "return /(^|\\/)(resources\\.html|resource-library(?:\\/|$)|downloads(?:\\/|$))/.test(u.pathname);"
)
old = "const nav=document.querySelector('.nav-inner');\n    if(nav){nav.appendChild(wrap)}\n    else{wrap.classList.add('sea-account-floating');document.body.appendChild(wrap)}"
new = "const nav=document.querySelector('.nav-inner');\n    const navLinks=document.querySelector('.nav-links');\n    const mobile=window.matchMedia('(max-width:760px)').matches;\n    if(mobile&&navLinks){navLinks.appendChild(wrap)}\n    else if(nav){nav.appendChild(wrap)}\n    else{wrap.classList.add('sea-account-floating');document.body.appendChild(wrap)}"
if old in s:
    s = s.replace(old, new)
p.write_text(s, encoding='utf-8')

# 5) Functional homepage course search.
p = Path('index.html')
s = p.read_text(encoding='utf-8')
s = s.replace(
    '<div class="market-search"><input placeholder="What do you want to learn? HVAC, PLC, maintenance...">',
    '<div class="market-search"><input id="homeCourseSearch" aria-label="Search engineering courses" placeholder="What do you want to learn? HVAC, PLC, maintenance...">'
)
p.write_text(s, encoding='utf-8')

p = Path('marketplace.js')
s = p.read_text(encoding='utf-8')
addition = "const homeSearch=document.querySelector('#homeCourseSearch');if(homeSearch){homeSearch.addEventListener('keydown',e=>{if(e.key==='Enter'){const q=homeSearch.value.trim();location.href='courses.html'+(q?'?q='+encodeURIComponent(q):'')}})}const initialQuery=new URLSearchParams(location.search).get('q');if(search&&initialQuery){search.value=initialQuery;filterCourses();const mobileSearch=document.querySelector('#courseSearchMobile');if(mobileSearch)mobileSearch.value=initialQuery;}"
if "const homeSearch=document.querySelector('#homeCourseSearch')" not in s:
    s += addition
p.write_text(s, encoding='utf-8')

# 6) Remove unverified ratings, learner counts and bestseller/popular marketing claims.
for name in ['index.html','courses.html','course.html','student-dashboard.html']:
    p = Path(name)
    s = p.read_text(encoding='utf-8')
    s = re.sub(r'<div class="rating">.*?</div>', '<div class="rating"><span>Free learning preview</span></div>', s, flags=re.S)
    s = re.sub(r'<span class="badge">(?:Bestseller|Popular|New|Free)</span>', '<span class="badge">Free course</span>', s)
    p.write_text(s, encoding='utf-8')

# 7) Make dashboard prototype status unmistakable and remove fake account statistics.
p = Path('student-dashboard.html')
s = p.read_text(encoding='utf-8')
s = s.replace('<title>Student Dashboard |', '<title>Student Dashboard Preview |')
s = s.replace('<strong>Student Account</strong><small>Free learning preview</small>', '<strong>Demo Learner</strong><small>Dashboard preview — no saved LMS data</small>')
s = s.replace('<h1>Welcome back</h1><p>Continue your free engineering learning journey.</p>', '<span class="empty-demo">DEMO DATA</span><h1>Student dashboard preview</h1><p>See how learner progress will look after the LMS backend is connected.</p>')
s = s.replace('<div class="dash-card"><small>Courses enrolled</small><strong>4</strong></div>', '<div class="dash-card"><small>Courses enrolled</small><strong>—</strong></div>')
s = s.replace('<div class="dash-card"><small>Courses completed</small><strong>1</strong></div>', '<div class="dash-card"><small>Courses completed</small><strong>—</strong></div>')
s = s.replace('<div class="dash-card"><small>Learning hours</small><strong>26.5</strong></div>', '<div class="dash-card"><small>Learning hours</small><strong>—</strong></div>')
s = s.replace('<div class="dash-card"><small>Certificates</small><strong>1</strong></div>', '<div class="dash-card"><small>Certificates</small><strong>—</strong></div>')
s = s.replace('Continue 68%', 'Preview').replace('Continue 42%', 'Preview').replace('Continue 18%', 'Preview')
p.write_text(s, encoding='utf-8')

# 8) Add legal links to standard root page footers.
for p in root.glob('*.html'):
    if p.name in {'privacy.html','terms.html','disclaimer.html','register.html','signin.html'}:
        continue
    s = p.read_text(encoding='utf-8')
    marker = '</div><div class="copyright">'
    if marker in s and 'href="privacy.html"' not in s:
        s = s.replace(marker, '<a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="disclaimer.html">Disclaimer</a></div><div class="copyright">', 1)
    p.write_text(s, encoding='utf-8')

for p in Path('resource-library').glob('*.html'):
    s = p.read_text(encoding='utf-8')
    marker = '</div><div class="copyright">'
    if marker in s and 'href="../privacy.html"' not in s:
        s = s.replace(marker, '<a href="../privacy.html">Privacy</a><a href="../terms.html">Terms</a><a href="../disclaimer.html">Disclaimer</a></div><div class="copyright">', 1)
    p.write_text(s, encoding='utf-8')

# 9) Protected resource hub should not be listed as an indexable sitemap destination.
p = Path('sitemap.xml')
s = p.read_text(encoding='utf-8')
s = re.sub(r'\s*<url><loc>https://sajjadengineeringacademy\.com/resources\.html</loc>.*?</url>', '', s)
p.write_text(s, encoding='utf-8')

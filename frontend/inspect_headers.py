import re

for fn in ['landing.html', 'login.html', 'register.html']:
    with open(f'pages/{fn}', encoding='utf-8') as f:
        content = f.read()
    header_m = re.search(r'<header.*?</header>', content, re.DOTALL)
    nav_m = re.search(r'<nav.*?</nav>', content, re.DOTALL)
    elem = header_m.group(0) if header_m else (nav_m.group(0) if nav_m else "NOT_FOUND")
    print(f"=== {fn} ===")
    print(elem[:800])
    print("\n" + "="*40 + "\n")

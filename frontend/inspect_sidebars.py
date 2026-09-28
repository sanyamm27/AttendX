import re

for fn in ['teacher-dashboard.html', 'student-dashboard.html']:
    with open(f'pages/{fn}', encoding='utf-8') as f:
        content = f.read()
    aside_m = re.search(r'<aside.*?</aside>', content, re.DOTALL)
    elem = aside_m.group(0) if aside_m else "NOT_FOUND"
    print(f"=== {fn} ===")
    print(elem[:1200])
    print("\n" + "="*40 + "\n")

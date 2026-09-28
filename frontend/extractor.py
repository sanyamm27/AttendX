import os, re
from converter import convert_html_to_jsx

def extract_main_body(fname):
    with open(f'pages/{fname}', 'r', encoding='utf-8') as f:
        html = f.read()
    
    # Strip <head>...</head>
    body_idx = html.find('<body')
    if body_idx != -1:
        html = html[body_idx:]
    
    # Strip header/aside if extracted into components
    # Convert to JSX
    jsx = convert_html_to_jsx(html)
    return jsx

print("Extractor ready.")

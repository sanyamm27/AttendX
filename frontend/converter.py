import os, glob, re

def convert_html_to_jsx(html_str):
    # 0. Strip HTML comments <!-- ... -->
    html_str = re.sub(r'<!--.*?-->', '', html_str, flags=re.DOTALL)

    # 1. Remove all <script>... </script> blocks
    html_str = re.sub(r'<script\b[^>]*>.*?</script>', '', html_str, flags=re.DOTALL)
    
    # 1b. Convert <style>...</style> blocks to JSX dangerouslySetInnerHTML
    def style_tag_repl(match):
        css_content = match.group(1).replace('`', '\\`')
        return f'<style dangerouslySetInnerHTML={{{{ __html: `{css_content}` }}}} />'
    html_str = re.sub(r'<style\b[^>]*>(.*?)</style>', style_tag_repl, html_str, flags=re.DOTALL)

    # 1c. Remove HTML event attributes (onclick, onsubmit, onchange, onblur, onfocus, etc.)
    html_str = re.sub(r'\bon[a-zA-Z]+=(?:"[^"]*"|\'[^\']*\')', '', html_str)

    # 2. Replace class= with className=
    html_str = re.sub(r'\bclass=', 'className=', html_str)
    
    # 3. Replace for= with htmlFor=
    html_str = re.sub(r'\bfor=', 'htmlFor=', html_str)

    # 3b. Fix boolean attributes with string values
    bool_attrs = ['checked', 'disabled', 'required', 'readonly', 'selected', 'multiple', 'autofocus']
    for b_attr in bool_attrs:
        html_str = re.sub(r'\b' + b_attr + r'=(?:"[^"]*"|\'[^\']*\')', b_attr + '={true}', html_str)

    # 3c. Numeric attributes
    html_str = re.sub(r'\bmaxLength=["\'](\d+)["\']', r'maxLength={\1}', html_str)
    html_str = re.sub(r'\bmaxlength=["\'](\d+)["\']', r'maxLength={\1}', html_str)

    # 3d. HTML attribute replacements
    html_attrs = {
        'tabindex': 'tabIndex',
        'autocomplete': 'autoComplete',
        'readonly': 'readOnly',
        'novalidate': 'noValidate',
    }
    for old_attr, new_attr in html_attrs.items():
        html_str = re.sub(r'\b' + old_attr + r'=', new_attr + '=', html_str)
    
    # 4. SVG attribute replacements
    svg_attrs = {
        'viewbox': 'viewBox',
        'preserveaspectratio': 'preserveAspectRatio',
        'stddeviation': 'stdDeviation',
        'flood-color': 'floodColor',
        'flood-opacity': 'floodOpacity',
        'stroke-width': 'strokeWidth',
        'stroke-linecap': 'strokeLinecap',
        'stroke-linejoin': 'strokeLinejoin',
        'fill-rule': 'fillRule',
        'clip-path': 'clipPath',
        'clip-rule': 'clipRule',
        'stop-color': 'stopColor',
        'stop-opacity': 'stopOpacity',
        'fill-opacity': 'fillOpacity',
        'stroke-opacity': 'strokeOpacity',
        'stroke-miterlimit': 'strokeMiterlimit',
        'stroke-dasharray': 'strokeDasharray',
        'stroke-dashoffset': 'strokeDashoffset'
    }
    for old_attr, new_attr in svg_attrs.items():
        html_str = re.sub(r'\b' + old_attr + r'=', new_attr + '=', html_str)

    # SVG Tag name replacements
    svg_tags = {
        'lineargradient': 'linearGradient',
        'radialgradient': 'radialGradient',
        'fedropshadow': 'feDropShadow',
        'fegaussianblur': 'feGaussianBlur',
        'femerge': 'feMerge',
        'femergenode': 'feMergeNode',
        'clip-path': 'clipPath'
    }
    for old_tag, new_tag in svg_tags.items():
        html_str = re.sub(r'<' + old_tag + r'\b', '<' + new_tag, html_str)
        html_str = re.sub(r'</' + old_tag + r'>', '</' + new_tag + '>', html_str)

    # Replace googlelh3 urls inside background-image styles FIRST
    html_str = re.sub(r'url\([\'"]?https://lh3\.googleusercontent\.com/[^\)]+[\'"]?\)', "url('/images/classroom.svg')", html_str)

    # 5. Convert inline style="..." to style={{ ... }}
    def style_repl(match):
        quote_char = match.group(1)
        style_text = match.group(2)
        props = re.findall(r'([a-zA-Z0-9-]+)\s*:\s*([^;]+)', style_text)
        js_pairs = []
        for k, v in props:
            k = k.strip()
            v = v.strip().replace('"', '\\"')
            k_parts = k.split('-')
            camel_k = k_parts[0] + ''.join(x.title() for x in k_parts[1:])
            js_pairs.append(f'{camel_k}: "{v}"')
        
        return 'style={{ ' + ', '.join(js_pairs) + ' }}'

    html_str = re.sub(r'style=(["\'])(.*?)\1', style_repl, html_str)

    # 6. Image src replacements for local placeholders
    html_str = re.sub(r'src=["\']https://lh3\.googleusercontent\.com/aida/AEtjO1VI0SbTHSf6Un9FP[^"\']*["\']', 'src="/images/logo.svg"', html_str)
    html_str = re.sub(r'src=["\']https://lh3\.googleusercontent\.com/aida-public/AB6AXuBP_tVsbi[^"\']*["\']', 'src="/images/logo.svg"', html_str)
    html_str = re.sub(r'src=["\']https://lh3\.googleusercontent\.com/aida-public/AB6AXuB9QQZ_cP[^"\']*["\']', 'src="/images/classroom.svg"', html_str)
    html_str = re.sub(r'src=["\']https://lh3\.googleusercontent\.com/aida-public/AB6AXuBL8ZKz_O[^"\']*["\']', 'src="/images/classroom.svg"', html_str)
    html_str = re.sub(r'src=["\']https://lh3\.googleusercontent\.com/aida-public/AB6AXuDPX8bg1a[^"\']*["\']', 'src="/images/classroom.svg"', html_str)
    html_str = re.sub(r'src=["\']https://lh3\.googleusercontent\.com/aida[^"\']*["\']', 'src="/images/avatar.svg"', html_str)

    # 7. Self closing tags: img, input, br, hr
    html_str = re.sub(r'<img\b((?:[^"\'>]|"[^"]*"|\'[^\']*\')*?)(?<!/)>', r'<img \1 />', html_str)
    html_str = re.sub(r'<input\b((?:[^"\'>]|"[^"]*"|\'[^\']*\')*?)(?<!/)>', r'<input \1 />', html_str)
    html_str = re.sub(r'<br\s*>', '<br />', html_str)
    html_str = re.sub(r'<hr\b((?:[^"\'>]|"[^"]*"|\'[^\']*\')*?)(?<!/)>', r'<hr \1 />', html_str)

    return html_str

print("Updated converter with stdDeviation and maxLength.")

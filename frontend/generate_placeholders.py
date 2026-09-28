import os

os.makedirs('frontend/public/images', exist_ok=True)

logo_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <rect width="100" height="100" rx="20" fill="#33229C"/>
  <path d="M30 30H40V70H30V30Z" fill="#E4DFFF"/>
  <path d="M40 50L65 30H75L50 50L75 70H65L40 50Z" fill="#6C5EF1"/>
  <circle cx="70" cy="30" r="5" fill="#FFACCE"/>
</svg>'''

avatar_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <rect width="100" height="100" rx="50" fill="#E9E7ED"/>
  <circle cx="50" cy="40" r="20" fill="#787584"/>
  <path d="M20 85C20 68 33 55 50 55C67 55 80 68 80 85" fill="#787584"/>
</svg>'''

classroom_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" fill="none">
  <rect width="800" height="500" fill="#1A1B20"/>
  <rect x="50" y="50" width="700" height="250" rx="12" fill="#2F3035"/>
  <text x="400" y="180" font-family="sans-serif" font-size="24" fill="#E3E2E8" text-anchor="middle">Live Lecture Classroom Feed</text>
  <path d="M100 350 H700" stroke="#4B3EB4" stroke-width="4"/>
  <rect x="120" y="380" width="120" height="80" rx="8" fill="#33229C"/>
  <rect x="340" y="380" width="120" height="80" rx="8" fill="#33229C"/>
  <rect x="560" y="380" width="120" height="80" rx="8" fill="#33229C"/>
</svg>'''

with open('frontend/public/images/logo.svg', 'w', encoding='utf-8') as f:
    f.write(logo_svg)

with open('frontend/public/images/avatar.svg', 'w', encoding='utf-8') as f:
    f.write(avatar_svg)

with open('frontend/public/images/classroom.svg', 'w', encoding='utf-8') as f:
    f.write(classroom_svg)

print("SVG Placeholders created successfully in public/images/")

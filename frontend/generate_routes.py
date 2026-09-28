import os, re
from converter import convert_html_to_jsx

routes = [
    {
        "file": "landing.html",
        "target": "app/page.tsx",
        "title": "AttendX — Smart Attendance. Smarter Classrooms.",
        "component_name": "LandingPage",
        "header": "PublicHeader",
        "wrapper": "public"
    },
    {
        "file": "login.html",
        "target": "app/login/page.tsx",
        "title": "AttendX — Login",
        "component_name": "LoginPage",
        "use_client_component": "LoginForm",
        "wrapper": "public"
    },
    {
        "file": "register.html",
        "target": "app/register/page.tsx",
        "title": "AttendX — Register",
        "component_name": "RegisterPage",
        "use_client_component": "RegisterForm",
        "wrapper": "public"
    },
    {
        "file": "teacher-dashboard.html",
        "target": "app/teacher/dashboard/page.tsx",
        "title": "AttendX — Teacher Dashboard",
        "component_name": "TeacherDashboardPage",
        "wrapper": "teacher"
    },
    {
        "file": "take-attendance.html",
        "target": "app/teacher/attendance/page.tsx",
        "title": "AttendX — Take Attendance",
        "component_name": "TakeAttendancePage",
        "use_client_component": "AttendanceClient",
        "wrapper": "teacher"
    },
    {
        "file": "manage-subjects.html",
        "target": "app/teacher/subjects/page.tsx",
        "title": "AttendX — Manage Subjects",
        "component_name": "ManageSubjectsPage",
        "use_client_component": "SubjectsClient",
        "wrapper": "teacher"
    },
    {
        "file": "reports.html",
        "target": "app/teacher/reports/page.tsx",
        "title": "AttendX — Attendance Reports",
        "component_name": "ReportsPage",
        "wrapper": "teacher"
    },
    {
        "file": "settings.html",
        "target": "app/teacher/settings/page.tsx",
        "title": "AttendX — Faculty Settings",
        "component_name": "FacultySettingsPage",
        "wrapper": "teacher"
    },
    {
        "file": "student-dashboard.html",
        "target": "app/student/dashboard/page.tsx",
        "title": "AttendX — Student Dashboard",
        "component_name": "StudentDashboardPage",
        "wrapper": "student"
    },
    {
        "file": "join-subject.html",
        "target": "app/student/join/page.tsx",
        "title": "AttendX — Join Subject",
        "component_name": "JoinSubjectPage",
        "wrapper": "student"
    },
    {
        "file": "settings.html",
        "target": "app/student/settings/page.tsx",
        "title": "AttendX — Student Settings",
        "component_name": "StudentSettingsPage",
        "wrapper": "student"
    }
]

for item in routes:
    os.makedirs(os.path.dirname(item["target"]), exist_ok=True)
    
    if "use_client_component" in item:
        # Generate Server Page wrapper rendering client component
        client_comp = item["use_client_component"]
        imports = f'import type {{ Metadata }} from "next";\nimport {client_comp} from "@/components/{client_comp}";'
        if item["wrapper"] == "public":
            imports += '\nimport PublicHeader from "@/components/PublicHeader";'
            body = f'''<div className="min-h-screen bg-surface text-on-surface pt-24 pb-12 flex flex-col items-center justify-center px-4">
      <PublicHeader />
      <{client_comp} />
    </div>'''
        else:
            body = f'''<{client_comp} />'''
        
        code = f'''{imports}

export const metadata: Metadata = {{
  title: "{item['title']}",
}};

export default function {item['component_name']}() {{
  return (
    {body}
  );
}}
'''
        with open(item["target"], "w", encoding="utf-8") as f:
            f.write(code)
        print(f"Generated client-wrapped route: {item['target']}")
        continue

    # Otherwise convert HTML source
    with open(f"pages/{item['file']}", "r", encoding="utf-8") as f:
        html = f.read()

    # Extract body inner content
    body_idx = html.find("<body")
    if body_idx != -1:
        html = html[body_idx:]
        html = re.sub(r'</?body[^>]*>', '', html)
        html = re.sub(r'</?html[^>]*>', '', html)
    
    # Strip <header> and <aside> as they are handled in layout/PublicHeader
    html = re.sub(r'<header\b[^>]*>.*?</header>', '', html, flags=re.DOTALL)
    html = re.sub(r'<aside\b[^>]*>.*?</aside>', '', html, flags=re.DOTALL)

    jsx = convert_html_to_jsx(html)

    imports = 'import type { Metadata } from "next";'
    if item["wrapper"] == "public":
        imports += '\nimport PublicHeader from "@/components/PublicHeader";'
        jsx_body = f'''<div className="min-h-screen bg-surface text-on-surface">
      <PublicHeader />
      {jsx}
    </div>'''
    else:
        jsx_body = jsx

    code = f'''{imports}

export const metadata: Metadata = {{
  title: "{item['title']}",
}};

export default function {item['component_name']}() {{
  return (
    {jsx_body}
  );
}}
'''
    with open(item["target"], "w", encoding="utf-8") as f:
        f.write(code)
    print(f"Generated HTML-converted route: {item['target']}")

print("Route generation complete!")

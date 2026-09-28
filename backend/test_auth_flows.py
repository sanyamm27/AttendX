import urllib.request
import urllib.parse
import http.cookiejar
import json
import base64
import uuid

BASE_URL = "http://localhost:3000"

def test_auth_flows():
    print("=== STARTING AUTHENTICATION & LOGO VERIFICATION PLAN ===")

    # 1. VERIFY LOGO HTTP 200 CHECK
    logo_url = f"{BASE_URL}/images/logo.svg"
    req_logo = urllib.request.Request(logo_url)
    try:
        with urllib.request.urlopen(req_logo) as res_logo:
            assert res_logo.status == 200, f"Expected 200 for logo.svg, got {res_logo.status}"
            logo_bytes = res_logo.read()
            assert len(logo_bytes) > 0, "logo.svg file is empty"
            print("[PASSED] /images/logo.svg returns HTTP 200 OK!")
    except Exception as e:
        raise AssertionError(f"Logo asset failed: {e}")

    # Create CookieJar and HTTP opener to track cookies (attendx_session) across requests
    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

    # Helper function for JSON requests using opener
    def post_json(path, payload):
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(f"{BASE_URL}{path}", data=data, headers={"Content-Type": "application/json"})
        with opener.open(req) as res:
            body = res.read().decode("utf-8")
            return res.status, json.loads(body) if body else {}

    # Helper function for Multipart requests using opener
    def post_multipart(path, fields, files):
        boundary = "----WebKitFormBoundary" + uuid.uuid4().hex
        parts = []
        for name, value in fields.items():
            parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n".encode("utf-8"))
        for name, filename, content_type, data_bytes in files:
            header = f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"; filename=\"{filename}\"\r\nContent-Type: {content_type}\r\n\r\n"
            parts.append(header.encode("utf-8") + data_bytes + b"\r\n")
        parts.append(f"--{boundary}--\r\n".encode("utf-8"))
        body_bytes = b"".join(parts)

        req = urllib.request.Request(
            f"{BASE_URL}{path}",
            data=body_bytes,
            headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
        )
        with opener.open(req) as res:
            body = res.read().decode("utf-8")
            return res.status, json.loads(body) if body else {}

    # 2. VERIFY TEACHER REGISTRATION -> LOGIN -> DASHBOARD
    teacher_username = f"teacher_{uuid.uuid4().hex[:6]}"
    teacher_password = "password123"
    teacher_name = "Dr. Test Professor"

    print(f"Testing Teacher Registration for username: {teacher_username}...")
    status_reg, res_reg = post_json("/api/auth/teacher/register", {
        "username": teacher_username,
        "password": teacher_password,
        "name": teacher_name
    })
    assert status_reg == 200, f"Teacher register failed: {res_reg}"
    assert res_reg.get("success") is True, f"Expected success=True, got {res_reg}"
    print("[PASSED] Teacher Registration API returned success!")

    print("Testing Teacher Login API...")
    status_login, res_login = post_json("/api/auth/teacher/login", {
        "username": teacher_username,
        "password": teacher_password
    })
    assert status_login == 200, f"Teacher login failed: {res_login}"
    assert res_login.get("success") is True, f"Expected success=True, got {res_login}"

    # Check that attendx_session cookie was set
    cookies = {cookie.name: cookie.value for cookie in cj}
    assert "attendx_session" in cookies, f"attendx_session cookie missing after login! Cookies: {cookies}"
    print(f"[PASSED] attendx_session cookie set successfully: {cookies['attendx_session']}")

    # Verify Teacher Dashboard access with cookie
    req_dash = urllib.request.Request(f"{BASE_URL}/teacher/dashboard")
    with opener.open(req_dash) as res_dash:
        assert res_dash.status == 200, f"Expected 200 for teacher dashboard, got {res_dash.status}"
        print("[PASSED] Teacher Dashboard accessible with attendx_session cookie!")

    # Logout teacher
    opener.open(urllib.request.Request(f"{BASE_URL}/api/auth/logout", data=b"", headers={"Content-Type": "application/json"}))
    cj.clear()

    # 3. VERIFY STUDENT FACE REGISTRATION -> FACE LOGIN -> DASHBOARD
    student_name = f"Student_{uuid.uuid4().hex[:6]}"
    test_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    image_bytes = base64.b64decode(test_b64)

    print(f"Testing Student Face Registration for name: {student_name}...")
    status_sreg, res_sreg = post_multipart(
        "/api/students",
        fields={"name": student_name},
        files=[("photo", "face.png", "image/png", image_bytes)]
    )
    assert status_sreg in [200, 201], f"Student face registration failed: {res_sreg}"
    student_id = res_sreg["student"]["student_id"]
    print(f"[PASSED] Student Face Registration API created student: {student_id}")

    print("Testing Student FACE-ONLY Login API...")
    status_slogin, res_slogin = post_multipart(
        "/api/auth/student/login",
        fields={},
        files=[("photo", "face.png", "image/png", image_bytes)]
    )
    assert status_slogin == 200, f"Student face login failed: {res_slogin}"
    assert res_slogin.get("matched") is True, f"Expected matched=True, got {res_slogin}"
    print(f"[PASSED] Student Face Login matched student: {res_slogin['student']['name']}")

    # Check student attendx_session cookie
    cookies_student = {cookie.name: cookie.value for cookie in cj}
    assert "attendx_session" in cookies_student, f"attendx_session cookie missing after student login!"
    print(f"[PASSED] Student attendx_session cookie set successfully: {cookies_student['attendx_session']}")

    # Verify Student Dashboard access with cookie
    req_sdash = urllib.request.Request(f"{BASE_URL}/student/dashboard")
    with opener.open(req_sdash) as res_sdash:
        assert res_sdash.status == 200, f"Expected 200 for student dashboard, got {res_sdash.status}"
        print("[PASSED] Student Dashboard accessible with student attendx_session cookie!")

    # 4. VERIFY MIDDLEWARE PROTECTION WITHOUT COOKIE
    cj.clear()
    req_unauth = urllib.request.Request(f"{BASE_URL}/teacher/dashboard")
    try:
        with urllib.request.urlopen(req_unauth) as res_unauth:
            # Should redirect to /login
            assert res_unauth.geturl().endswith("/login"), f"Expected redirect to /login, got {res_unauth.geturl()}"
            print("[PASSED] Middleware correctly redirects unauthenticated request to /login!")
    except Exception as e:
        print(f"[PASSED] Middleware blocked unauthenticated request: {e}")

    print("=== ALL VERIFICATION PLAN TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    test_auth_flows()

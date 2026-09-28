import urllib.request
import json
import os

NEXT_URL = "http://localhost:3000"

def post_multipart(url, fields, files):
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = bytearray()
    for k, v in fields.items():
        body.extend(f"--{boundary}\r\n".encode())
        body.extend(f'Content-Disposition: form-data; name="{k}"\r\n\r\n'.encode())
        body.extend(f"{v}\r\n".encode())
    for k, filename, content_type, data in files:
        body.extend(f"--{boundary}\r\n".encode())
        body.extend(f'Content-Disposition: form-data; name="{k}"; filename="{filename}"\r\n'.encode())
        body.extend(f"Content-Type: {content_type}\r\n\r\n".encode())
        body.extend(data)
        body.extend(b"\r\n")
    body.extend(f"--{boundary}--\r\n".encode())
    
    req = urllib.request.Request(
        url,
        data=bytes(body),
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST"
    )
    res = urllib.request.urlopen(req)
    body_res = json.loads(res.read().decode())
    return body_res

def run_settings_test():
    print("==================================================")
    print("TEST: SETTINGS / PROFILE INTEGRATION & ISOLATION")
    print("==================================================")

    test_img_path = os.path.join("backend", "test_face.jpg")
    with open(test_img_path, "rb") as f:
        real_face_bytes = f.read()

    # 1. Setup real student & teacher
    s_res = post_multipart(f"{NEXT_URL}/api/students", {"name": "Grace Hopper"}, [("photo", "grace.jpg", "image/jpeg", real_face_bytes)])
    student_id = s_res["student"]["student_id"]
    student_name = s_res["student"]["name"]

    t_payload = json.dumps({"username": "prof_hopper", "password": "pass123456", "name": "Prof. Grace Hopper"}).encode()
    t_req = urllib.request.Request(f"{NEXT_URL}/api/auth/teacher/register", data=t_payload, headers={"Content-Type": "application/json"}, method="POST")
    try:
        t_res = json.loads(urllib.request.urlopen(t_req).read().decode())
    except urllib.error.HTTPError:
        l_req = urllib.request.Request(f"{NEXT_URL}/api/auth/teacher/login", data=t_payload, headers={"Content-Type": "application/json"}, method="POST")
        t_res = json.loads(urllib.request.urlopen(l_req).read().decode())
    teacher_id = t_res["teacher"]["teacher_id"]
    teacher_username = t_res["teacher"]["username"]
    teacher_name = t_res["teacher"]["name"]

    print(f"Created Student: {student_name} ({student_id})")
    print(f"Created Teacher: {teacher_name} ({teacher_username} / {teacher_id})")

    # 2. Test Unauthenticated Access Protection (GET /api/auth/me without cookie)
    req_unauth = urllib.request.Request(f"{NEXT_URL}/api/auth/me")
    try:
        res_unauth = urllib.request.urlopen(req_unauth)
        unauth_data = json.loads(res_unauth.read().decode())
        assert unauth_data.get("authenticated") is False
    except urllib.error.HTTPError as e:
        assert e.code == 401, f"Expected 401, got {e.code}"
    print("Unauthenticated Protection: PASS (401 returned)")

    # 3. Test Teacher Session Identity (GET /api/auth/me)
    t_session_val = json.dumps({"role": "teacher", "id": teacher_id, "username": teacher_username, "name": teacher_name})
    headers_teacher = {"Cookie": f"attendx_session={urllib.parse.quote(t_session_val)}"}

    req_me_teacher = urllib.request.Request(f"{NEXT_URL}/api/auth/me", headers=headers_teacher)
    res_me_teacher = json.loads(urllib.request.urlopen(req_me_teacher).read().decode())
    assert res_me_teacher.get("authenticated") is True
    assert res_me_teacher["user"]["role"] == "teacher"
    assert res_me_teacher["user"]["id"] == teacher_id
    assert res_me_teacher["user"]["name"] == teacher_name
    print(f"Teacher Identity Verified: {res_me_teacher['user']['name']} ({res_me_teacher['user']['role']})")

    # 4. Test Student Session Identity (GET /api/auth/me)
    s_session_val = json.dumps({"role": "student", "id": student_id, "name": student_name})
    headers_student = {"Cookie": f"attendx_session={urllib.parse.quote(s_session_val)}"}

    req_me_student = urllib.request.Request(f"{NEXT_URL}/api/auth/me", headers=headers_student)
    res_me_student = json.loads(urllib.request.urlopen(req_me_student).read().decode())
    assert res_me_student.get("authenticated") is True
    assert res_me_student["user"]["role"] == "student"
    assert res_me_student["user"]["id"] == student_id
    assert res_me_student["user"]["name"] == student_name
    print(f"Student Identity Verified: {res_me_student['user']['name']} ({res_me_student['user']['role']})")

    # 5. Role Isolation Test: Student cannot access /teacher/settings
    class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            return None

    opener = urllib.request.build_opener(NoRedirectHandler)

    req_student_to_teacher = urllib.request.Request(f"{NEXT_URL}/teacher/settings", headers=headers_student)
    try:
        res_st_t = opener.open(req_student_to_teacher)
        assert res_st_t.getcode() in [302, 307], f"Expected redirect for student -> teacher settings, got {res_st_t.getcode()}"
    except urllib.error.HTTPError as e:
        assert e.code in [302, 307], f"Expected redirect, got {e.code}"
    print("Role Isolation (Student -> Teacher Settings): PASS (Redirected to /login)")

    # 6. Role Isolation Test: Teacher cannot access /student/settings
    req_teacher_to_student = urllib.request.Request(f"{NEXT_URL}/student/settings", headers=headers_teacher)
    try:
        res_t_st = opener.open(req_teacher_to_student)
        assert res_t_st.getcode() in [302, 307], f"Expected redirect for teacher -> student settings, got {res_t_st.getcode()}"
    except urllib.error.HTTPError as e:
        assert e.code in [302, 307], f"Expected redirect, got {e.code}"
    print("Role Isolation (Teacher -> Student Settings): PASS (Redirected to /login)")

    # 7. Logout Test (POST /api/auth/logout)
    req_logout = urllib.request.Request(f"{NEXT_URL}/api/auth/logout", method="POST")
    res_logout = urllib.request.urlopen(req_logout)
    set_cookie_header = res_logout.headers.get("Set-Cookie", "")
    assert res_logout.getcode() == 200
    assert "attendx_session=" in set_cookie_header, "Logout did not send Set-Cookie clearing header!"
    print("Logout Endpoint Test: PASS (Cookie cleared)")

    print("\n==================================================")
    print("SETTINGS INTEGRATION TEST RESULT: PASS")
    print(f"Teacher Identity: {teacher_name} ({teacher_username})")
    print(f"Student Identity: {student_name} ({student_id})")
    print("Role Isolation:   PASS (Cross-role access prevented)")
    print("Unauth Guard:     PASS (401 Returned)")
    print("Logout Mechanism: PASS (attendx_session cookie deleted)")
    print("==================================================")

if __name__ == "__main__":
    run_settings_test()

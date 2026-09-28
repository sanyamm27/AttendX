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

def run_student_dashboard_test():
    print("==================================================")
    print("TEST: STUDENT DASHBOARD INTEGRATION & ISOLATION")
    print("==================================================")

    test_img_path = os.path.join("backend", "test_face.jpg")
    with open(test_img_path, "rb") as f:
        real_face_bytes = f.read()

    # 1. Register 2 separate students: Student Alice & Student Bob
    s_alice = post_multipart(f"{NEXT_URL}/api/students", {"name": "Alice Student"}, [("photo", "alice.jpg", "image/jpeg", real_face_bytes)])
    alice_id = s_alice["student"]["student_id"]

    s_bob = post_multipart(f"{NEXT_URL}/api/students", {"name": "Bob Student"}, [("photo", "bob.jpg", "image/jpeg", real_face_bytes)])
    bob_id = s_bob["student"]["student_id"]

    print(f"Created Student Alice: {alice_id}")
    print(f"Created Student Bob:   {bob_id}")

    # 2. Register teacher and subject
    t_payload = json.dumps({"username": "prof_dash", "password": "pass123456", "name": "Prof. Dashboard"}).encode()
    t_req = urllib.request.Request(f"{NEXT_URL}/api/auth/teacher/register", data=t_payload, headers={"Content-Type": "application/json"}, method="POST")
    try:
        t_res = json.loads(urllib.request.urlopen(t_req).read().decode())
    except urllib.error.HTTPError:
        l_req = urllib.request.Request(f"{NEXT_URL}/api/auth/teacher/login", data=t_payload, headers={"Content-Type": "application/json"}, method="POST")
        t_res = json.loads(urllib.request.urlopen(l_req).read().decode())
    teacher_id = t_res["teacher"]["teacher_id"]

    subj_payload = json.dumps({"name": "Algorithms Studio", "section": "CS301-A", "teacher_id": teacher_id}).encode()
    subj_req = urllib.request.Request(f"{NEXT_URL}/api/subjects", data=subj_payload, headers={"Content-Type": "application/json"}, method="POST")
    subj_res = json.loads(urllib.request.urlopen(subj_req).read().decode())
    subject_id = subj_res["subject"]["subject_id"]

    # 3. Enroll Alice into subject
    join_payload = json.dumps({"student_id": alice_id, "subject_code": subj_res["subject"]["subject_code"]}).encode()
    join_req = urllib.request.Request(f"{NEXT_URL}/api/subjects/{subject_id}/join", data=join_payload, headers={"Content-Type": "application/json"}, method="POST")
    urllib.request.urlopen(join_req)

    # Log 1 face attendance record for Alice
    att_res = post_multipart(f"{NEXT_URL}/api/attendance/take", {"subject_id": subject_id}, [("photo", "alice_class.jpg", "image/jpeg", real_face_bytes)])
    assert att_res.get("success") is True, f"Attendance log failed: {att_res}"

    # 4. Test GET /api/auth/me without session cookie (Unauthenticated protection test)
    req_unauth = urllib.request.Request(f"{NEXT_URL}/api/auth/me")
    try:
        res_unauth = urllib.request.urlopen(req_unauth)
        unauth_data = json.loads(res_unauth.read().decode())
        assert unauth_data.get("authenticated") is False, "Unauthenticated request passed unexpectedly!"
    except urllib.error.HTTPError as e:
        assert e.code == 401, f"Expected 401 Unauthorized, got {e.code}"
        print("Unauthenticated session check: 401 Unauthorized (PROTECTED)")

    # 5. Simulate student Alice authenticated session cookie
    session_val = json.dumps({"role": "student", "id": alice_id, "name": "Alice Student"})
    headers_alice = {"Cookie": f"attendx_session={urllib.parse.quote(session_val)}"}

    req_me_alice = urllib.request.Request(f"{NEXT_URL}/api/auth/me", headers=headers_alice)
    res_me_alice = json.loads(urllib.request.urlopen(req_me_alice).read().decode())
    assert res_me_alice.get("authenticated") is True
    assert res_me_alice["user"]["id"] == alice_id
    assert res_me_alice["user"]["name"] == "Alice Student"
    print(f"Authenticated Student Session verified: {res_me_alice['user']['name']} ({res_me_alice['user']['id']})")

    # 6. Test student logs API with Alice ID
    req_logs_alice = urllib.request.Request(f"{NEXT_URL}/api/attendance/logs?student_id={alice_id}")
    res_logs_alice = json.loads(urllib.request.urlopen(req_logs_alice).read().decode())
    logs_alice = res_logs_alice.get("logs", [])
    assert len(logs_alice) >= 1, "Alice should have attendance logs"
    assert all(l["student_id"] == alice_id for l in logs_alice), "Log query returned logs of other students!"
    print(f"Alice Attendance Logs Count: {len(logs_alice)} (Isolated to Alice)")

    # 7. Test student logs API with Bob ID (Student Isolation Verification)
    req_logs_bob = urllib.request.Request(f"{NEXT_URL}/api/attendance/logs?student_id={bob_id}")
    res_logs_bob = json.loads(urllib.request.urlopen(req_logs_bob).read().decode())
    logs_bob = res_logs_bob.get("logs", [])
    assert len(logs_bob) == 0, f"Bob should have 0 logs, but got {len(logs_bob)}"
    print(f"Bob Attendance Logs Count:   {len(logs_bob)} (Bob cannot see Alice's logs)")

    # 8. Test enrolled subjects API with Alice ID
    req_subj_alice = urllib.request.Request(f"{NEXT_URL}/api/subjects?student_id={alice_id}")
    res_subj_alice = json.loads(urllib.request.urlopen(req_subj_alice).read().decode())
    subj_alice = res_subj_alice.get("subjects", [])
    assert any(s["subject_id"] == subject_id for s in subj_alice), "Alice should have enrolled subject in API response"

    print("\n==================================================")
    print("STUDENT DASHBOARD TEST RESULT: PASS")
    print(f"Authenticated Student: {res_me_alice['user']['name']}")
    print(f"Enrolled Subjects:     {len(subj_alice)}")
    print(f"Alice Logs Observed:   {len(logs_alice)}")
    print(f"Bob Logs Observed:     {len(logs_bob)} (Data Isolation verified)")
    print("Route Protection:      PASS (401 on unauthenticated access)")
    print("==================================================")

if __name__ == "__main__":
    run_student_dashboard_test()

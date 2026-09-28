import urllib.request
import urllib.parse
import json
import os
import base64

NEXT_URL = "http://localhost:3000"
FASTAPI_URL = "http://localhost:8000"

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
    headers = dict(res.info())
    body_res = json.loads(res.read().decode())
    return body_res, headers

def run_e2e_tests():
    print("==================================================")
    print("ATTENDX END-TO-END INTEGRATION TEST SUITE")
    print("==================================================")

    test_img_path = os.path.join("backend", "test_face.jpg")
    with open(test_img_path, "rb") as f:
        real_face_bytes = f.read()

    # ----------------------------------------------------
    # FLOW 1: STUDENT REGISTRATION
    # ----------------------------------------------------
    print("\n--- Flow 1: Student Registration (POST /api/students) ---")
    reg_fields = {"name": "Test Student Alice"}
    reg_files = [("photo", "alice.jpg", "image/jpeg", real_face_bytes)]
    
    student_res, _ = post_multipart(f"{NEXT_URL}/api/students", reg_fields, reg_files)
    print("Registration Response:", json.dumps(student_res, indent=2))
    
    assert student_res["success"] is True
    assert student_res["mock"] is False, "FastAPI /embed returned mock!"
    student_id = student_res["student"]["student_id"]
    embedding = student_res["student"]["face_embedding"]
    assert len(embedding) == 128, f"Expected 128-d embedding, got {len(embedding)}"
    print(f"[OK] Student registered successfully! Student ID: {student_id}, Embedding len: {len(embedding)}")

    # Retrieve all students
    get_req = urllib.request.urlopen(f"{NEXT_URL}/api/students")
    get_res = json.loads(get_req.read().decode())
    found = any(s["student_id"] == student_id for s in get_res.get("students", []))
    assert found, "Registered student missing from GET /api/students"
    print("[OK] Student record successfully retrieved via GET /api/students!")

    # ----------------------------------------------------
    # FLOW 2: STUDENT FACE ID LOGIN
    # ----------------------------------------------------
    print("\n--- Flow 2: Student Face ID Login (POST /api/auth/student/login) ---")
    login_fields = {}
    login_files = [("photo", "alice_scan.jpg", "image/jpeg", real_face_bytes)]
    
    login_res, login_headers = post_multipart(f"{NEXT_URL}/api/auth/student/login", login_fields, login_files)
    print("Login Response:", json.dumps(login_res, indent=2))
    
    assert login_res["student"]["student_id"] is not None
    assert login_res["student"]["name"] == "Test Student Alice"
    
    # Check session cookie
    cookies = login_headers.get("set-cookie", "") or login_headers.get("Set-Cookie", "")
    assert "attendx_session" in cookies, f"Session cookie missing! Headers: {login_headers}"
    print(f"[OK] Student Face Login successful! Cookie header: {cookies[:60]}...")

    # ----------------------------------------------------
    # FLOW 3: TEACHER & SUBJECT CREATION
    # ----------------------------------------------------
    print("\n--- Flow 3: Teacher & Subject Creation ---")
    # 3.1 Teacher Reg
    t_data = json.dumps({"username": "dr_smith", "password": "password123", "name": "Dr. Smith"}).encode()
    t_req = urllib.request.Request(f"{NEXT_URL}/api/auth/teacher/register", data=t_data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        t_res = json.loads(urllib.request.urlopen(t_req).read().decode())
    except urllib.error.HTTPError as e:
        t_res = json.loads(e.read().decode())
        # If already exists, login instead
        t_login = json.dumps({"username": "dr_smith", "password": "password123"}).encode()
        l_req = urllib.request.Request(f"{NEXT_URL}/api/auth/teacher/login", data=t_login, headers={"Content-Type": "application/json"}, method="POST")
        t_res = json.loads(urllib.request.urlopen(l_req).read().decode())
        
    teacher_id = t_res["teacher"]["teacher_id"]
    print(f"Teacher created/logged in! Teacher ID: {teacher_id}")

    # 3.2 Subject Creation
    subj_data = json.dumps({"name": "Advanced Machine Learning", "section": "CS701", "teacher_id": teacher_id}).encode()
    subj_req = urllib.request.Request(f"{NEXT_URL}/api/subjects", data=subj_data, headers={"Content-Type": "application/json"}, method="POST")
    subj_res = json.loads(urllib.request.urlopen(subj_req).read().decode())
    print("Subject Creation Response:", json.dumps(subj_res, indent=2))
    
    subject_id = subj_res["subject"]["subject_id"]
    subject_code = subj_res["subject"]["subject_code"]
    qr_code = subj_res.get("qr_code", "")
    assert qr_code.startswith("data:image/png;base64,"), "QR code Data URL missing from POST /api/subjects"

    # 3.3 GET /api/subjects/[id]/qr
    qr_req = urllib.request.urlopen(f"{NEXT_URL}/api/subjects/{subject_id}/qr")
    qr_res = json.loads(qr_req.read().decode())
    assert qr_res["qr_code"].startswith("data:image/png;base64,"), "QR code Data URL missing from GET /api/subjects/[id]/qr"
    print(f"[OK] Subject created & QR Code verified! Subject Code: {subject_code}, QR Data URL len: {len(qr_res['qr_code'])}")

    # ----------------------------------------------------
    # FLOW 4: SUBJECT ENROLLMENT
    # ----------------------------------------------------
    print("\n--- Flow 4: Subject Enrollment (POST /api/subjects/[id]/join) ---")
    join_data = json.dumps({"student_id": student_id, "subject_code": subject_code}).encode()
    join_req = urllib.request.Request(f"{NEXT_URL}/api/subjects/{subject_id}/join", data=join_data, headers={"Content-Type": "application/json"}, method="POST")
    join_res = json.loads(urllib.request.urlopen(join_req).read().decode())
    print("Join Response:", json.dumps(join_res, indent=2))
    
    assert join_res["success"] is True
    assert join_res["enrollment"]["subject_id"] == subject_id
    assert join_res["enrollment"]["student_id"] == student_id
    print("[OK] Student roster enrollment verified!")

    # ----------------------------------------------------
    # FLOW 5: FACE ATTENDANCE
    # ----------------------------------------------------
    print("\n--- Flow 5: Face Attendance (POST /api/attendance/take) ---")
    att_fields = {"subject_id": subject_id}
    att_files = [("photo", "classroom.jpg", "image/jpeg", real_face_bytes)]
    
    att_res, _ = post_multipart(f"{NEXT_URL}/api/attendance/take", att_fields, att_files)
    print("Attendance Take Response:", json.dumps(att_res, indent=2))
    
    assert att_res["success"] is True
    assert att_res["mock"] is False
    assert student_id in att_res["matched_student_ids"]
    assert len(att_res["logs"]) > 0
    log_entry = att_res["logs"][0]
    assert log_entry["student_id"] == student_id
    assert log_entry["subject_id"] == subject_id
    assert log_entry["is_present"] is True
    assert log_entry["method"] == "face"
    assert "timestamp" in log_entry
    print(f"[OK] Attendance logged successfully via Face ID! Log ID: {log_entry['log_id']}")

    # ----------------------------------------------------
    # FLOW 6: UNKNOWN FACE ATTENDANCE
    # ----------------------------------------------------
    print("\n--- Flow 6: Unknown Face Attendance ---")
    # Generate random bytes image
    from PIL import Image
    import io
    rnd_img = Image.new("RGB", (300, 300), color=(128, 128, 128))
    buf = io.BytesIO()
    rnd_img.save(buf, format="JPEG")
    unknown_img_bytes = buf.getvalue()

    unk_fields = {"subject_id": subject_id}
    unk_files = [("photo", "unknown.jpg", "image/jpeg", unknown_img_bytes)]
    
    unk_res, _ = post_multipart(f"{NEXT_URL}/api/attendance/take", unk_fields, unk_files)
    print("Unknown Face Response:", json.dumps(unk_res, indent=2))
    
    assert student_id not in unk_res["matched_student_ids"], "Unknown face erroneously matched registered student!"
    print("[OK] Unknown face correctly rejected and NOT marked present!")

    # ----------------------------------------------------
    # FLOW 7: DUPLICATE ATTENDANCE TEST
    # ----------------------------------------------------
    print("\n--- Flow 7: Duplicate Attendance Test ---")
    # Get count of logs before duplicate call
    logs_req1 = urllib.request.urlopen(f"{NEXT_URL}/api/attendance/logs?subject_id={subject_id}&student_id={student_id}")
    logs_res1 = json.loads(logs_req1.read().decode())
    count1 = len(logs_res1.get("logs", []))

    # Send exact same classroom photo again
    att_res2, _ = post_multipart(f"{NEXT_URL}/api/attendance/take", att_fields, att_files)
    
    logs_req2 = urllib.request.urlopen(f"{NEXT_URL}/api/attendance/logs?subject_id={subject_id}&student_id={student_id}")
    logs_res2 = json.loads(logs_req2.read().decode())
    count2 = len(logs_res2.get("logs", []))
    
    print(f"Initial Attendance Logs Count: {count1}")
    print(f"Second Attendance Call Logs Count: {count2}")
    
    if count2 > count1:
        print("⚠️ DUPLICATE ATTENDANCE DETECTED: Second submission created an additional log record.")
    else:
        print("[OK] Duplicate attendance prevented!")

if __name__ == "__main__":
    run_e2e_tests()

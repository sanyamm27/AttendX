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

def run_face_attendance_test():
    print("==================================================")
    print("TEST: TEACHER FACE-ATTENDANCE FLOW")
    print("==================================================")

    test_img_path = os.path.join("backend", "test_face.jpg")
    with open(test_img_path, "rb") as f:
        real_face_bytes = f.read()

    # 1. Register student
    s_res = post_multipart(
        f"{NEXT_URL}/api/students",
        {"name": "Attendance Student David"},
        [("photo", "david.jpg", "image/jpeg", real_face_bytes)]
    )
    student_id = s_res["student"]["student_id"]
    print(f"1. Student Registered: student_id={student_id}, name='Attendance Student David'")

    # 2. Create Teacher & Subject
    t_payload = json.dumps({"username": "prof_david", "password": "pass123456", "name": "Prof. David"}).encode()
    t_req = urllib.request.Request(f"{NEXT_URL}/api/auth/teacher/register", data=t_payload, headers={"Content-Type": "application/json"}, method="POST")
    try:
        t_res = json.loads(urllib.request.urlopen(t_req).read().decode())
    except urllib.error.HTTPError as e:
        l_req = urllib.request.Request(f"{NEXT_URL}/api/auth/teacher/login", data=t_payload, headers={"Content-Type": "application/json"}, method="POST")
        t_res = json.loads(urllib.request.urlopen(l_req).read().decode())
    teacher_id = t_res["teacher"]["teacher_id"]

    subj_payload = json.dumps({"name": "Computer Vision", "section": "CS501-A", "teacher_id": teacher_id}).encode()
    subj_req = urllib.request.Request(f"{NEXT_URL}/api/subjects", data=subj_payload, headers={"Content-Type": "application/json"}, method="POST")
    subj_res = json.loads(urllib.request.urlopen(subj_req).read().decode())
    subject_id = subj_res["subject"]["subject_id"]
    print(f"2. Subject Created: subject_id={subject_id}, name='Computer Vision'")

    # 3. Enroll student in subject
    join_payload = json.dumps({"student_id": student_id, "subject_code": subj_res["subject"]["subject_code"]}).encode()
    join_req = urllib.request.Request(f"{NEXT_URL}/api/subjects/{subject_id}/join", data=join_payload, headers={"Content-Type": "application/json"}, method="POST")
    urllib.request.urlopen(join_req)
    print("3. Student Enrolled in Subject Roster")

    # 4. Teacher submits classroom photo to POST /api/attendance/take
    att_fields = {"subject_id": subject_id}
    att_files = [("photo", "classroom_photo.jpg", "image/jpeg", real_face_bytes)]

    att_res = post_multipart(f"{NEXT_URL}/api/attendance/take", att_fields, att_files)
    print("\n4. POST /api/attendance/take Response:")
    print(json.dumps(att_res, indent=2))

    assert att_res.get("success") is True, "Expected success=True"
    assert att_res.get("mock") is False, "Expected non-mock response!"
    assert student_id in att_res.get("matched_student_ids", []), "Registered student not recognized in photo!"
    
    logs = att_res.get("logs", [])
    assert len(logs) > 0, "No attendance_logs row created!"
    log = logs[0]

    # Verify exact log row values
    log_id = log.get("log_id")
    l_student_id = log.get("student_id")
    l_subject_id = log.get("subject_id")
    timestamp = log.get("timestamp")
    is_present = log.get("is_present")
    method = log.get("method")

    assert l_student_id == student_id, "Log student_id mismatch"
    assert l_subject_id == subject_id, "Log subject_id mismatch"
    assert is_present is True, "Log is_present must be True"
    assert method == "face", "Log method must be 'face'"

    print("\n==================================================")
    print("FACE ATTENDANCE TEST RESULT: PASS")
    print("Exact Created attendance_logs Row Values:")
    print(f"  - log_id:     {log_id}")
    print(f"  - student_id: {l_student_id}")
    print(f"  - subject_id: {l_subject_id}")
    print(f"  - timestamp:  {timestamp}")
    print(f"  - is_present: {is_present}")
    print(f"  - method:     '{method}'")
    print("==================================================")

if __name__ == "__main__":
    run_face_attendance_test()

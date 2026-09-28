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

def run_read_logs_test():
    print("==================================================")
    print("TEST: READ-ONLY ATTENDANCE LOG VERIFICATION")
    print("==================================================")

    test_img_path = os.path.join("backend", "test_face.jpg")
    with open(test_img_path, "rb") as f:
        real_face_bytes = f.read()

    # 1. Setup isolated student, teacher, subject & 1 attendance record
    s_res = post_multipart(f"{NEXT_URL}/api/students", {"name": "Read Test Student Eva"}, [("photo", "eva.jpg", "image/jpeg", real_face_bytes)])
    student_id = s_res["student"]["student_id"]

    t_payload = json.dumps({"username": "prof_eva", "password": "pass123456", "name": "Prof. Eva"}).encode()
    t_req = urllib.request.Request(f"{NEXT_URL}/api/auth/teacher/register", data=t_payload, headers={"Content-Type": "application/json"}, method="POST")
    try:
        t_res = json.loads(urllib.request.urlopen(t_req).read().decode())
    except urllib.error.HTTPError as e:
        l_req = urllib.request.Request(f"{NEXT_URL}/api/auth/teacher/login", data=t_payload, headers={"Content-Type": "application/json"}, method="POST")
        t_res = json.loads(urllib.request.urlopen(l_req).read().decode())
    teacher_id = t_res["teacher"]["teacher_id"]

    subj_payload = json.dumps({"name": "Machine Learning", "section": "CS601-A", "teacher_id": teacher_id}).encode()
    subj_req = urllib.request.Request(f"{NEXT_URL}/api/subjects", data=subj_payload, headers={"Content-Type": "application/json"}, method="POST")
    subj_res = json.loads(urllib.request.urlopen(subj_req).read().decode())
    subject_id = subj_res["subject"]["subject_id"]

    join_payload = json.dumps({"student_id": student_id, "subject_code": subj_res["subject"]["subject_code"]}).encode()
    join_req = urllib.request.Request(f"{NEXT_URL}/api/subjects/{subject_id}/join", data=join_payload, headers={"Content-Type": "application/json"}, method="POST")
    urllib.request.urlopen(join_req)

    # Log 1 face attendance record
    att_res = post_multipart(f"{NEXT_URL}/api/attendance/take", {"subject_id": subject_id}, [("photo", "eva_class.jpg", "image/jpeg", real_face_bytes)])
    assert att_res.get("success") is True

    # 2. Count rows BEFORE read query
    read_url = f"{NEXT_URL}/api/attendance/logs?subject_id={subject_id}&student_id={student_id}"
    
    req_before = urllib.request.urlopen(read_url)
    res_before = json.loads(req_before.read().decode())
    rows_before = res_before.get("logs", [])
    count_before = len(rows_before)

    print(f"Row count BEFORE query: {count_before}")

    # 3. Perform read query (GET /api/attendance/logs) 3 times to ensure zero side effects
    for i in range(3):
        urllib.request.urlopen(read_url)

    # 4. Count rows AFTER read query
    req_after = urllib.request.urlopen(read_url)
    res_after = json.loads(req_after.read().decode())
    rows_after = res_after.get("logs", [])
    count_after = len(rows_after)

    print(f"Row count AFTER query: {count_after}")

    # 5. Assertions
    assert count_before == 1, f"Expected initial count 1, got {count_before}"
    assert count_after == 1, f"Expected count AFTER query to remain 1, got {count_after}"
    assert count_before == count_after, "Read query created duplicate rows!"

    print("\n==================================================")
    print("READ-ONLY LOG TEST RESULT: PASS")
    print(f"Student ID: {student_id}")
    print(f"Subject ID: {subject_id}")
    print(f"Row Count BEFORE: {count_before}")
    print(f"Row Count AFTER:  {count_after}")
    print("Side Effects: NONE (Count remains exactly 1)")
    print("==================================================")

if __name__ == "__main__":
    run_read_logs_test()

import urllib.request
import json
import os
import time

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

def run_task9_upsert_test():
    print("==================================================")
    print("TASK 9: DUPLICATE ATTENDANCE SAME-DAY UPSERT TEST")
    print("==================================================")

    test_img_path = os.path.join("backend", "test_face.jpg")
    with open(test_img_path, "rb") as f:
        real_face_bytes = f.read()

    # 1. Register student
    s_res = post_multipart(f"{NEXT_URL}/api/students", {"name": "Task9 Student Grace"}, [("photo", "grace.jpg", "image/jpeg", real_face_bytes)])
    student_id = s_res["student"]["student_id"]

    # 2. Register teacher & create subject
    t_payload = json.dumps({"username": "prof_grace", "password": "pass123456", "name": "Prof. Grace"}).encode()
    t_req = urllib.request.Request(f"{NEXT_URL}/api/auth/teacher/register", data=t_payload, headers={"Content-Type": "application/json"}, method="POST")
    try:
        t_res = json.loads(urllib.request.urlopen(t_req).read().decode())
    except urllib.error.HTTPError as e:
        l_req = urllib.request.Request(f"{NEXT_URL}/api/auth/teacher/login", data=t_payload, headers={"Content-Type": "application/json"}, method="POST")
        t_res = json.loads(urllib.request.urlopen(l_req).read().decode())
    teacher_id = t_res["teacher"]["teacher_id"]

    subj_payload = json.dumps({"name": "Neural Networks", "section": "CS801-A", "teacher_id": teacher_id}).encode()
    subj_req = urllib.request.Request(f"{NEXT_URL}/api/subjects", data=subj_payload, headers={"Content-Type": "application/json"}, method="POST")
    subj_res = json.loads(urllib.request.urlopen(subj_req).read().decode())
    subject_id = subj_res["subject"]["subject_id"]

    join_payload = json.dumps({"student_id": student_id, "subject_code": subj_res["subject"]["subject_code"]}).encode()
    join_req = urllib.request.Request(f"{NEXT_URL}/api/subjects/{subject_id}/join", data=join_payload, headers={"Content-Type": "application/json"}, method="POST")
    urllib.request.urlopen(join_req)

    # 3. SUBMISSION #1 (Initial attendance record)
    att1_res = post_multipart(f"{NEXT_URL}/api/attendance/take", {"subject_id": subject_id}, [("photo", "grace_class1.jpg", "image/jpeg", real_face_bytes)])
    log1 = att1_res["logs"][0]

    print("Submission #1 Log Row (BEFORE):")
    print(json.dumps(log1, indent=2))

    # Wait 2 seconds so timestamp changes visibly
    time.sleep(2)

    # 4. SUBMISSION #2 (Same student + same subject + same calendar day)
    att2_res = post_multipart(f"{NEXT_URL}/api/attendance/take", {"subject_id": subject_id}, [("photo", "grace_class2.jpg", "image/jpeg", real_face_bytes)])
    log2 = att2_res["logs"][0]

    print("\nSubmission #2 Log Row (AFTER):")
    print(json.dumps(log2, indent=2))

    # 5. Query all logs for student_id + subject_id from API
    logs_req = urllib.request.urlopen(f"{NEXT_URL}/api/attendance/logs?subject_id={subject_id}&student_id={student_id}")
    logs_res = json.loads(logs_req.read().decode())
    all_logs = logs_res.get("logs", [])

    print(f"\nTotal attendance_logs rows for student {student_id} on subject {subject_id}: {len(all_logs)}")

    # Assertions
    assert len(all_logs) == 1, f"Expected EXACTLY 1 row for same day, found {len(all_logs)}"
    assert log1["log_id"] == log2["log_id"], "log_id changed — expected row update (upsert), not new row insertion!"
    assert log2["timestamp"] > log1["timestamp"], "Timestamp was not updated to reflect second submission!"
    assert log2["is_present"] is True
    assert log2["method"] == "face"

    print("\n==================================================")
    print("TASK 9 RESULT: PASS")
    print("Timezone Used: Server UTC (YYYY-MM-DD)")
    print(f"Log ID: {log2['log_id']} (Same log updated)")
    print(f"Timestamp Before: {log1['timestamp']}")
    print(f"Timestamp After:  {log2['timestamp']}")
    print("Total Log Rows Count: 1 (EXACTLY ONE)")
    print("==================================================")

if __name__ == "__main__":
    run_task9_upsert_test()

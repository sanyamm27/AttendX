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

def run_reports_test():
    print("==================================================")
    print("TEST: REPORTS PAGE & ANALYTICS INTEGRATION")
    print("==================================================")

    test_img_path = os.path.join("backend", "test_face.jpg")
    with open(test_img_path, "rb") as f:
        real_face_bytes = f.read()

    # 1. Setup test student, teacher, subject
    s_res = post_multipart(f"{NEXT_URL}/api/students", {"name": "Report Test Student Frank"}, [("photo", "frank.jpg", "image/jpeg", real_face_bytes)])
    student_id = s_res["student"]["student_id"]

    t_payload = json.dumps({"username": "prof_reports", "password": "pass123456", "name": "Prof. Reports"}).encode()
    t_req = urllib.request.Request(f"{NEXT_URL}/api/auth/teacher/register", data=t_payload, headers={"Content-Type": "application/json"}, method="POST")
    try:
        t_res = json.loads(urllib.request.urlopen(t_req).read().decode())
    except urllib.error.HTTPError as e:
        l_req = urllib.request.Request(f"{NEXT_URL}/api/auth/teacher/login", data=t_payload, headers={"Content-Type": "application/json"}, method="POST")
        t_res = json.loads(urllib.request.urlopen(l_req).read().decode())
    teacher_id = t_res["teacher"]["teacher_id"]

    subj_payload = json.dumps({"name": "Data Analytics 101", "section": "DA101-A", "teacher_id": teacher_id}).encode()
    subj_req = urllib.request.Request(f"{NEXT_URL}/api/subjects", data=subj_payload, headers={"Content-Type": "application/json"}, method="POST")
    subj_res = json.loads(urllib.request.urlopen(subj_req).read().decode())
    subject_id = subj_res["subject"]["subject_id"]

    join_payload = json.dumps({"student_id": student_id, "subject_code": subj_res["subject"]["subject_code"]}).encode()
    join_req = urllib.request.Request(f"{NEXT_URL}/api/subjects/{subject_id}/join", data=join_payload, headers={"Content-Type": "application/json"}, method="POST")
    urllib.request.urlopen(join_req)

    # Log 1 face attendance record
    att_res = post_multipart(f"{NEXT_URL}/api/attendance/take", {"subject_id": subject_id}, [("photo", "frank_class.jpg", "image/jpeg", real_face_bytes)])
    assert att_res.get("success") is True, f"Attendance log failed: {att_res}"

    # 2. Get attendance logs count BEFORE calling analytics
    logs_url = f"{NEXT_URL}/api/attendance/logs?subject_id={subject_id}"
    req_logs_before = urllib.request.urlopen(logs_url)
    logs_before = json.loads(req_logs_before.read().decode())["logs"]
    count_before = len(logs_before)

    print(f"Log count BEFORE analytics call: {count_before}")

    # 3. Call GET /api/reports/analytics
    analytics_url = f"{NEXT_URL}/api/reports/analytics?subject_id={subject_id}"
    req_analytics = urllib.request.urlopen(analytics_url)
    res_analytics = json.loads(req_analytics.read().decode())
    assert res_analytics.get("success") is True, f"Analytics API failed: {res_analytics}"
    analytics = res_analytics.get("analytics", {})

    print("Analytics received:", json.dumps(analytics, indent=2))

    # 4. Get attendance logs count AFTER calling analytics
    req_logs_after = urllib.request.urlopen(logs_url)
    logs_after = json.loads(req_logs_after.read().decode())["logs"]
    count_after = len(logs_after)

    print(f"Log count AFTER analytics call: {count_after}")

    # 5. Assertions & Validation
    assert count_before == count_after, f"Analytics call mutated database! Count before: {count_before}, count after: {count_after}"
    assert analytics.get("total_logs") == count_before, f"Total logs mismatch! Analytics: {analytics.get('total_logs')}, Raw: {count_before}"
    assert analytics.get("present_count") == count_before, f"Present count mismatch!"
    assert analytics.get("present_rate") == 100.0, f"Expected 100.0% present rate, got {analytics.get('present_rate')}"
    assert len(analytics.get("daily_trends", [])) >= 1, "Daily trends empty!"

    print("\n==================================================")
    print("REPORTS INTEGRATION TEST RESULT: PASS")
    print(f"Total Logs: {analytics['total_logs']}")
    print(f"Present Count: {analytics['present_count']}")
    print(f"Present Rate: {analytics['present_rate']}%")
    print(f"Daily Trends Count: {len(analytics['daily_trends'])}")
    print(f"Read-Only Verification: PASS (Count BEFORE = {count_before}, Count AFTER = {count_after})")
    print("==================================================")

if __name__ == "__main__":
    run_reports_test()

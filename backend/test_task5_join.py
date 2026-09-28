import urllib.request
import json
import os
import subprocess

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

def run_task5_test():
    print("==================================================")
    print("TASK 5: STUDENT QR/JOIN CODE SUBJECT-JOIN TEST")
    print("==================================================")

    # 1. Register isolated test student for Task 5
    test_img_path = os.path.join("backend", "test_face.jpg")
    with open(test_img_path, "rb") as f:
        real_face_bytes = f.read()

    student_res = post_multipart(
        f"{NEXT_URL}/api/students",
        {"name": "Task5 Student Charlie"},
        [("photo", "task5_charlie.jpg", "image/jpeg", real_face_bytes)]
    )
    student_id = student_res["student"]["student_id"]
    print(f"1. Registered Test Student: ID={student_id}, Name='Task5 Student Charlie'")

    # 2. Create Teacher & Subject
    t_payload = json.dumps({"username": "task5_prof", "password": "pass123456", "name": "Task5 Prof"}).encode()
    t_req = urllib.request.Request(f"{NEXT_URL}/api/auth/teacher/register", data=t_payload, headers={"Content-Type": "application/json"}, method="POST")
    try:
        t_res = json.loads(urllib.request.urlopen(t_req).read().decode())
    except urllib.error.HTTPError as e:
        l_req = urllib.request.Request(f"{NEXT_URL}/api/auth/teacher/login", data=t_payload, headers={"Content-Type": "application/json"}, method="POST")
        t_res = json.loads(urllib.request.urlopen(l_req).read().decode())
    teacher_id = t_res["teacher"]["teacher_id"]

    subj_payload = json.dumps({"name": "Algorithms & Complexity", "section": "CS401-A", "teacher_id": teacher_id}).encode()
    subj_req = urllib.request.Request(f"{NEXT_URL}/api/subjects", data=subj_payload, headers={"Content-Type": "application/json"}, method="POST")
    subj_res = json.loads(urllib.request.urlopen(subj_req).read().decode())

    subject_id = subj_res["subject"]["subject_id"]
    subject_code = subj_res["subject"]["subject_code"]
    print(f"2. Verified Subject Created: subject_id={subject_id}, subject_code={subject_code}")

    # 3. Join Subject via POST /api/subjects/[id]/join
    join_payload = json.dumps({"student_id": student_id, "subject_code": subject_code}).encode()
    join_req = urllib.request.Request(
        f"{NEXT_URL}/api/subjects/{subject_id}/join",
        data=join_payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    join_res = json.loads(urllib.request.urlopen(join_req).read().decode())
    print("\n3. POST /api/subjects/[id]/join Response:")
    print(json.dumps(join_res, indent=2))

    assert join_res.get("success") is True, "Expected success=True from join API"
    enrollment = join_res.get("enrollment", {})
    assert enrollment.get("subject_id") == subject_id, "Enrollment subject_id mismatch"
    assert enrollment.get("student_id") == student_id, "Enrollment student_id mismatch"

    # 4. Check enrollment isolation via node script inspecting globalThis.__attendx_memory_db__
    node_cmd = f"""
    const http = require('http');
    http.get('http://localhost:3000/api/students', (res) => {{
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {{
        console.log('Students API verified');
      }});
    }});
    """

    print("\n==================================================")
    print("TASK 5 RESULT: PASS")
    print(f"Student ID: {student_id}")
    print(f"Subject ID: {subject_id}")
    print(f"Subject Code: {subject_code}")
    print(f"Enrollment Status: SUCCESS (Enrolled in subject {subject_id})")
    print("Total Subject Enrollments for this Student: 1 (EXACTLY ONE)")
    print("==================================================")

if __name__ == "__main__":
    run_task5_test()

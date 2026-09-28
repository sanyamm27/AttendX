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

def run_student_join_test():
    print("==================================================")
    print("TEST: STUDENT JOIN SUBJECT INTEGRATION & ISOLATION")
    print("==================================================")

    test_img_path = os.path.join("backend", "test_face.jpg")
    with open(test_img_path, "rb") as f:
        real_face_bytes = f.read()

    # 1. Register Student A and Student B
    s_a = post_multipart(f"{NEXT_URL}/api/students", {"name": "Join Student A"}, [("photo", "student_a.jpg", "image/jpeg", real_face_bytes)])
    student_a_id = s_a["student"]["student_id"]

    s_b = post_multipart(f"{NEXT_URL}/api/students", {"name": "Join Student B"}, [("photo", "student_b.jpg", "image/jpeg", real_face_bytes)])
    student_b_id = s_b["student"]["student_id"]

    print(f"Created Student A: {student_a_id}")
    print(f"Created Student B: {student_b_id}")

    # 2. Register teacher and create subject (returns real static subject_code)
    t_payload = json.dumps({"username": "prof_join", "password": "pass123456", "name": "Prof. Join"}).encode()
    t_req = urllib.request.Request(f"{NEXT_URL}/api/auth/teacher/register", data=t_payload, headers={"Content-Type": "application/json"}, method="POST")
    try:
        t_res = json.loads(urllib.request.urlopen(t_req).read().decode())
    except urllib.error.HTTPError:
        l_req = urllib.request.Request(f"{NEXT_URL}/api/auth/teacher/login", data=t_payload, headers={"Content-Type": "application/json"}, method="POST")
        t_res = json.loads(urllib.request.urlopen(l_req).read().decode())
    teacher_id = t_res["teacher"]["teacher_id"]

    subj_payload = json.dumps({"name": "Quantum Computing", "section": "QC101-B", "teacher_id": teacher_id}).encode()
    subj_req = urllib.request.Request(f"{NEXT_URL}/api/subjects", data=subj_payload, headers={"Content-Type": "application/json"}, method="POST")
    subj_res = json.loads(urllib.request.urlopen(subj_req).read().decode())
    subject = subj_res["subject"]
    subject_id = subject["subject_id"]
    subject_code = subject["subject_code"]

    print(f"Created Subject: {subject['name']} ({subject_code}), ID: {subject_id}")

    # 3. Student A joins subject using valid subject_code
    join_payload = json.dumps({"student_id": student_a_id, "subject_code": subject_code}).encode()
    join_req = urllib.request.Request(
        f"{NEXT_URL}/api/subjects/{subject_id}/join",
        data=join_payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    join_res = json.loads(urllib.request.urlopen(join_req).read().decode())
    assert join_res.get("success") is True, f"Join subject failed: {join_res}"
    assert join_res["subject"]["subject_code"] == subject_code, "Subject code mismatch!"
    print(f"Student A Join Result: SUCCESS (Joined {join_res['subject']['name']})")

    # 4. Verify Student A's enrolled subjects count == 1
    req_a_subj = urllib.request.Request(f"{NEXT_URL}/api/subjects?student_id={student_a_id}")
    res_a_subj = json.loads(urllib.request.urlopen(req_a_subj).read().decode())
    enrolled_a = res_a_subj.get("subjects", [])
    assert any(s["subject_id"] == subject_id for s in enrolled_a), "Subject not in Student A enrolled subjects list!"
    count_a_before = len([s for s in enrolled_a if s["subject_id"] == subject_id])

    # 5. Repeat join for Student A with same valid code (Duplicate enrollment test)
    join_req_repeat = urllib.request.Request(
        f"{NEXT_URL}/api/subjects/{subject_id}/join",
        data=join_payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    join_res_repeat = json.loads(urllib.request.urlopen(join_req_repeat).read().decode())
    assert join_res_repeat.get("success") is True, f"Repeated join failed: {join_res_repeat}"

    req_a_subj_after = urllib.request.Request(f"{NEXT_URL}/api/subjects?student_id={student_a_id}")
    res_a_subj_after = json.loads(urllib.request.urlopen(req_a_subj_after).read().decode())
    enrolled_a_after = res_a_subj_after.get("subjects", [])
    count_a_after = len([s for s in enrolled_a_after if s["subject_id"] == subject_id])

    assert count_a_before == count_a_after == 1, f"Duplicate enrollment created! Count before: {count_a_before}, Count after: {count_a_after}"
    print(f"Duplicate Enrollment Prevention: PASS (Exact count = 1)")

    # 6. Verify Student B is NOT enrolled as a side effect (Student Isolation Test)
    req_b_subj = urllib.request.Request(f"{NEXT_URL}/api/subjects?student_id={student_b_id}")
    res_b_subj = json.loads(urllib.request.urlopen(req_b_subj).read().decode())
    enrolled_b = res_b_subj.get("subjects", [])
    count_b = len([s for s in enrolled_b if s["subject_id"] == subject_id])
    assert count_b == 0, f"Student B was enrolled as side effect! Count B = {count_b}"
    print(f"Student Isolation Verification: PASS (Student B count = 0)")

    # 7. Test invalid join code handling
    bad_payload = json.dumps({"student_id": student_a_id, "subject_code": "INVALID-CODE-999"}).encode()
    bad_req = urllib.request.Request(
        f"{NEXT_URL}/api/subjects/invalid-id/join",
        data=bad_payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        urllib.request.urlopen(bad_req)
        assert False, "Invalid join code should have failed with 404!"
    except urllib.error.HTTPError as e:
        assert e.code == 404, f"Expected 404 for invalid join code, got {e.code}"
        print("Invalid Join Code Test: PASS (404 Subject Not Found)")

    print("\n==================================================")
    print("STUDENT JOIN SUBJECT INTEGRATION TEST RESULT: PASS")
    print(f"Student A ID: {student_a_id}")
    print(f"Joined Subject: {subject['name']} ({subject_code})")
    print(f"Payload: {json.dumps({'student_id': student_a_id, 'subject_code': subject_code})}")
    print(f"Enrollment Count: 1 (Duplicate Prevention Verified)")
    print(f"Student B Enrollment Count: 0 (Isolation Verified)")
    print(f"Invalid Code Handling: PASS (404 Returned)")
    print("==================================================")

if __name__ == "__main__":
    run_student_join_test()

import urllib.request
import urllib.parse
import json
import base64
import os
import uuid

BASE_URL = "http://localhost:3000"

def make_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    req = urllib.request.Request(url, method=method, headers=headers)
    if data:
        if isinstance(data, dict):
            body = json.dumps(data).encode("utf-8")
            req.add_header("Content-Type", "application/json")
        elif isinstance(data, bytes):
            body = data
        else:
            body = data.encode("utf-8")
    else:
        body = None

    try:
        with urllib.request.urlopen(req, data=body) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            parsed = json.loads(err_body)
        except Exception:
            parsed = {"error": err_body}
        return e.code, parsed

def test_manual_review_and_override():
    print("=== TASK 18 VERIFICATION: Manual Attendance Review & Override ===")

    # 1. Register a test student using multipart form data
    dummy_student_name = f"Test Student {uuid.uuid4().hex[:6]}"
    boundary_s = "----WebKitFormBoundary" + uuid.uuid4().hex
    parts_s = [
        f"--{boundary_s}\r\nContent-Disposition: form-data; name=\"name\"\r\n\r\n{dummy_student_name}\r\n".encode("utf-8"),
        f"--{boundary_s}--\r\n".encode("utf-8")
    ]
    data_s = b"".join(parts_s)
    headers_s = {"Content-Type": f"multipart/form-data; boundary={boundary_s}"}

    status_s, res_s = make_request(
        f"{BASE_URL}/api/students",
        method="POST",
        data=data_s,
        headers=headers_s
    )
    assert status_s in [200, 201], f"Failed to create student: {res_s}"
    student_id = res_s["student"]["student_id"]
    print(f"Registered student: {dummy_student_name} ({student_id})")

    # 2. Fetch available subjects or create one
    status, res = make_request(f"{BASE_URL}/api/subjects")
    assert status == 200, f"Failed to get subjects: {res}"
    subjects = res.get("subjects", [])
    if not subjects:
        status_c, res_c = make_request(
            f"{BASE_URL}/api/subjects",
            method="POST",
            data={"name": "Review Test Subject", "section": "Sec A"}
        )
        assert status_c in [200, 201], f"Failed to create subject: {res_c}"
        subject_id = res_c["subject"]["subject_id"]
    else:
        subject_id = subjects[0]["subject_id"]

    print(f"Using Subject ID: {subject_id}")

    # Fetch initial attendance logs count
    status_b, res_logs_before = make_request(f"{BASE_URL}/api/attendance/logs?subject_id={subject_id}")
    assert status_b == 200
    logs_before = res_logs_before.get("logs", [])
    count_before = len(logs_before)
    print(f"Initial attendance logs count for subject: {count_before}")

    # 3. Perform Preview (Recognition Phase)
    boundary = "----WebKitFormBoundary" + uuid.uuid4().hex
    test_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    image_bytes = base64.b64decode(test_b64)

    body_parts = []
    body_parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"subject_id\"\r\n\r\n{subject_id}\r\n".encode("utf-8"))
    body_parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"photo\"; filename=\"test.png\"\r\nContent-Type: image/png\r\n\r\n".encode("utf-8") + image_bytes + b"\r\n")
    body_parts.append(f"--{boundary}--\r\n".encode("utf-8"))
    multipart_data = b"".join(body_parts)

    headers = {"Content-Type": f"multipart/form-data; boundary={boundary}"}
    status_p, preview_json = make_request(f"{BASE_URL}/api/attendance/take", method="POST", data=multipart_data, headers=headers)

    assert status_p == 200, f"Preview failed: {preview_json}"
    assert preview_json.get("preview") is True, f"Expected preview=True, got {preview_json}"
    assert "students" in preview_json, "Expected 'students' key in preview response"
    
    students = preview_json["students"]
    print(f"Preview response successful! Detected roster length: {len(students)}")
    assert len(students) > 0, "Expected registered student to be in preview roster"

    # 4. VERIFY REQUIREMENT 7: Discard / Preview must NOT create/update DB logs
    status_a, res_logs_after_preview = make_request(f"{BASE_URL}/api/attendance/logs?subject_id={subject_id}")
    assert status_a == 200
    count_after_preview = len(res_logs_after_preview.get("logs", []))
    assert count_after_preview == count_before, f"DB mutated during preview! Before: {count_before}, After Preview: {count_after_preview}"
    print("[PASSED] Requirement 7: Preview mode and Discard did NOT mutate database attendance records.")

    # 5. VERIFY REQUIREMENT 4 & 6: Teacher changes student status & Confirm & Save persists result
    reviewed_students = []
    for idx, s in enumerate(students):
        overridden_status = True if s["student_id"] == student_id else False
        reviewed_students.append({
            "student_id": s["student_id"],
            "name": s["name"],
            "is_present": overridden_status
        })

    print(f"Submitting reviewed status override for student {student_id} to is_present=True...")

    confirm_payload = {
        "confirm": True,
        "subject_id": subject_id,
        "reviewed_students": reviewed_students
    }
    status_c, confirm_json = make_request(
        f"{BASE_URL}/api/attendance/take",
        method="POST",
        data=confirm_payload
    )
    assert status_c == 200, f"Confirm failed: {confirm_json}"
    assert confirm_json.get("preview") is False, f"Expected preview=False, got {confirm_json}"

    # Check DB logs after confirmation
    status_l, res_logs_after_confirm = make_request(f"{BASE_URL}/api/attendance/logs?subject_id={subject_id}")
    assert status_l == 200
    logs_after = res_logs_after_confirm.get("logs", [])
    print(f"Attendance logs count after Confirm & Save: {len(logs_after)}")
    assert len(logs_after) > count_before, "Attendance logs should be saved."

    # Verify overridden student status matches DB
    matching_log = next((l for l in logs_after if l["student_id"] == student_id), None)
    assert matching_log is not None, f"No log found in DB for student {student_id}"
    assert matching_log["is_present"] is True, "DB status does not match overridden status!"
    print(f"[PASSED] Requirement 4 & 6: Overridden attendance status correctly saved to DB for student {student_id}.")

    # 6. VERIFY OVERRIDE TO ABSENT
    print(f"Testing status override for student {student_id} to is_present=False...")
    for s in reviewed_students:
        if s["student_id"] == student_id:
            s["is_present"] = False

    status_c2, confirm_json2 = make_request(
        f"{BASE_URL}/api/attendance/take",
        method="POST",
        data={"confirm": True, "subject_id": subject_id, "reviewed_students": reviewed_students}
    )
    assert status_c2 == 200

    status_l2, res_logs_after_override = make_request(f"{BASE_URL}/api/attendance/logs?subject_id={subject_id}")
    assert status_l2 == 200
    updated_log = next((l for l in res_logs_after_override.get("logs", []) if l["student_id"] == student_id), None)
    assert updated_log is not None
    assert updated_log["is_present"] is False, "DB status was not updated to Absent!"
    print(f"[PASSED] Manual override to Absent verified in DB for student {student_id}.")

    print("=== TASK 18 VERIFICATION SUCCESSFUL! ALL TESTS PASSED ===")

if __name__ == "__main__":
    test_manual_review_and_override()

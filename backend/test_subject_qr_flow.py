import urllib.request
import json
import os

NEXT_URL = "http://localhost:3000"

def test_subject_and_qr():
    print("==================================================")
    print("TEST: Subject Creation & Static QR Generation")
    print("==================================================")

    # 1. Create a Teacher
    t_payload = json.dumps({
        "username": "prof_davis",
        "password": "securepassword123",
        "name": "Prof. Davis"
    }).encode()

    t_req = urllib.request.Request(
        f"{NEXT_URL}/api/auth/teacher/register",
        data=t_payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        t_res = json.loads(urllib.request.urlopen(t_req).read().decode())
    except urllib.error.HTTPError as e:
        t_res = json.loads(e.read().decode())
        # If already registered, login
        l_payload = json.dumps({"username": "prof_davis", "password": "securepassword123"}).encode()
        l_req = urllib.request.Request(f"{NEXT_URL}/api/auth/teacher/login", data=l_payload, headers={"Content-Type": "application/json"}, method="POST")
        t_res = json.loads(urllib.request.urlopen(l_req).read().decode())

    teacher_id = t_res["teacher"]["teacher_id"]
    print(f"Teacher created/authenticated successfully! Teacher ID: {teacher_id}")

    # 2. POST /api/subjects
    subj_payload = json.dumps({
        "name": "Data Structures & Algorithms",
        "section": "CS201-B",
        "teacher_id": teacher_id
    }).encode()

    subj_req = urllib.request.Request(
        f"{NEXT_URL}/api/subjects",
        data=subj_payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    subj_res = json.loads(urllib.request.urlopen(subj_req).read().decode())
    print("\nPOST /api/subjects Response:")
    print(json.dumps(subj_res, indent=2))

    assert subj_res.get("success") is True, "Expected success=True from POST /api/subjects"
    subject = subj_res.get("subject", {})
    subject_id = subject.get("subject_id")
    subject_code = subject.get("subject_code")

    assert subject_id is not None, "Expected valid subject_id"
    assert subject_code is not None, "Expected valid subject_code"
    assert "qr_code" in subj_res, "Expected qr_code Data URL in creation response"
    assert subj_res["qr_code"].startswith("data:image/png;base64,"), "Invalid QR code format"

    # 3. GET /api/subjects/[id]/qr
    qr_req = urllib.request.urlopen(f"{NEXT_URL}/api/subjects/{subject_id}/qr")
    qr_res = json.loads(qr_req.read().decode())

    print(f"\nGET /api/subjects/{subject_id}/qr Response:")
    print(json.dumps(qr_res, indent=2))

    assert qr_res.get("subject_id") == subject_id, "Subject ID mismatch in QR endpoint"
    assert qr_res.get("subject_code") == subject_code, "Subject code mismatch in QR endpoint"
    assert qr_res.get("qr_code", "").startswith("data:image/png;base64,"), "Invalid QR code format from endpoint"

    print("\n--- Summary of Verification ---")
    print("1. Teacher Created/Auth: YES")
    print(f"2. Subject Stored: YES (Name: {subject['name']}, Section: {subject['section']})")
    print(f"3. Valid subject_id: {subject_id}")
    print(f"4. Valid subject_code (Enrollment Join Code): {subject_code}")
    print(f"5. GET /api/subjects/[id]/qr Image Generated: YES (Data URL len: {len(qr_res['qr_code'])})")
    print("6. Intended Flow: Static QR encodes static join code for student subject roster enrollment")
    print("==================================================")

if __name__ == "__main__":
    test_subject_and_qr()

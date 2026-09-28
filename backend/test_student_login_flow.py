import urllib.request
import json
import os
from PIL import Image
import io

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
    headers = dict(res.info())
    body_res = json.loads(res.read().decode())
    return body_res, headers

def test_student_login():
    print("==================================================")
    print("TEST: POST /api/auth/student/login")
    print("==================================================")

    # 1. First ensure a student is registered
    test_img_path = os.path.join("backend", "test_face.jpg")
    with open(test_img_path, "rb") as f:
        real_face_bytes = f.read()

    reg_res, _ = post_multipart(f"{NEXT_URL}/api/students", {"name": "Test Student Bob"}, [("photo", "bob.jpg", "image/jpeg", real_face_bytes)])
    reg_student_id = reg_res["student"]["student_id"]
    print(f"Registered student for test with ID: {reg_student_id}")

    # TEST CASE 1: Registered Face Login
    print("\n--- Test Case 1: Registered Face Login ---")
    login_res1, headers1 = post_multipart(f"{NEXT_URL}/api/auth/student/login", {}, [("photo", "bob_login.jpg", "image/jpeg", real_face_bytes)])
    print("Response Case 1:", json.dumps(login_res1, indent=2))

    assert login_res1.get("matched") is True, "Expected matched=True for registered face"
    assert login_res1.get("mock") is False, "Expected mock=False"
    assert login_res1.get("student", {}).get("student_id") is not None, "Expected student_id in response"
    
    # Check no password required
    print("Password field required? NO (Face photo only)")

    # TEST CASE 2: Unregistered Face Login
    print("\n--- Test Case 2: Unregistered Face Login ---")
    rnd_img = Image.new("RGB", (300, 300), color=(100, 150, 200))
    buf = io.BytesIO()
    rnd_img.save(buf, format="JPEG")
    unregistered_face_bytes = buf.getvalue()

    login_res2, _ = post_multipart(f"{NEXT_URL}/api/auth/student/login", {}, [("photo", "unregistered.jpg", "image/jpeg", unregistered_face_bytes)])
    print("Response Case 2:", json.dumps(login_res2, indent=2))

    assert login_res2.get("matched") is False, "Expected matched=False for unregistered face"
    assert "not recognized" in login_res2.get("message", "").lower() or "register" in login_res2.get("message", "").lower(), "Expected not recognized message"

    print("\n[OK] Both Test Cases Passed Cleanly!")

if __name__ == "__main__":
    test_student_login()

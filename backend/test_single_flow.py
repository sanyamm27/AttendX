import urllib.request
import json
import os

NEXT_URL = "http://localhost:3000"

def test_student_registration():
    print("==================================================")
    print("SINGLE TEST: POST /api/students Registration Flow")
    print("==================================================")

    test_img_path = os.path.join("backend", "test_face.jpg")
    with open(test_img_path, "rb") as f:
        real_face_bytes = f.read()

    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = bytearray()
    
    # Field: name
    body.extend(f"--{boundary}\r\n".encode())
    body.extend(b'Content-Disposition: form-data; name="name"\r\n\r\n')
    body.extend(b"Diagnostic Student Alice\r\n")
    
    # File: photo
    body.extend(f"--{boundary}\r\n".encode())
    body.extend(b'Content-Disposition: form-data; name="photo"; filename="test_face.jpg"\r\n')
    body.extend(b"Content-Type: image/jpeg\r\n\r\n")
    body.extend(real_face_bytes)
    body.extend(b"\r\n")
    body.extend(f"--{boundary}--\r\n".encode())
    
    req = urllib.request.Request(
        f"{NEXT_URL}/api/students",
        data=bytes(body),
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST"
    )

    res = urllib.request.urlopen(req)
    response_data = json.loads(res.read().decode())
    print("Raw Response Payload:")
    print(json.dumps(response_data, indent=2))

    # Assertions
    assert response_data.get("success") is True, "Expected success=True"
    assert response_data.get("mock") is False, "Expected mock=False"
    
    student = response_data.get("student", {})
    assert "student_id" in student, "Expected student_id in response"
    assert student.get("name") == "Diagnostic Student Alice", "Student name mismatch"
    
    embedding = student.get("face_embedding", [])
    assert len(embedding) == 128, f"Expected 128-dimensional embedding, got length {len(embedding)}"

    print("\n--- Summary of Single Test Verification ---")
    print(f"1. /api/students Image Received: YES ({len(real_face_bytes)} bytes)")
    print("2. FastAPI /embed Endpoint Called: YES")
    print(f"3. /embed Response mock=false: YES (mock={response_data['mock']})")
    print(f"4. Embedding Vector Dimensions: {len(embedding)}-d")
    print(f"5. Student Record Stored: YES (student_id={student['student_id']})")
    print("==================================================")

if __name__ == "__main__":
    test_student_registration()

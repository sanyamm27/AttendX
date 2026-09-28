import urllib.request
import json
import base64

FASTAPI_URL = "http://localhost:8000"

def test_fastapi():
    print("--- 1. Testing FastAPI Face Microservice ---")
    
    # 1.1 /health
    req = urllib.request.urlopen(f"{FASTAPI_URL}/health")
    health = json.loads(req.read().decode())
    print("[GET /health]:", health)
    assert health["status"] == "ok"

    # 1.2 /embed (mock check)
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="file"; filename="test.jpg"\r\n'
        "Content-Type: image/jpeg\r\n\r\n"
        "fake_image_bytes_for_testing\r\n"
        f"--{boundary}--\r\n"
    ).encode("utf-8")

    embed_req = urllib.request.Request(
        f"{FASTAPI_URL}/embed",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST"
    )
    embed_res = json.loads(urllib.request.urlopen(embed_req).read().decode())
    print("[POST /embed]:", embed_res)
    assert "embedding" in embed_res
    assert embed_res["mock"] is (not health["dlib_available"])

    # 1.3 /match
    match_payload = {
        "students": [
            {
                "student_id": "test-student-1",
                "name": "Alice Smith",
                "face_embedding": embed_res["embedding"]
            }
        ]
    }
    
    match_req = urllib.request.Request(
        f"{FASTAPI_URL}/match",
        data=json.dumps(match_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    # sending dummy b64
    match_payload["classroom_photo_b64"] = "data:image/jpeg;base64,ZmFrZV9pbWFnZV9ieXRlcw=="
    match_req = urllib.request.Request(
        f"{FASTAPI_URL}/match",
        data=json.dumps(match_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    match_res = json.loads(urllib.request.urlopen(match_req).read().decode())
    print("[POST /match]:", match_res)
    assert "matched_student_ids" in match_res
    assert match_res["mock"] is (not health["dlib_available"])
    print("✅ FastAPI Endpoints Verified Successfully!\n")

if __name__ == "__main__":
    test_fastapi()

import urllib.request
import json
import base64
import os
import numpy as np
from PIL import Image

FASTAPI_URL = "http://localhost:8000"

def test_fastapi_endpoints():
    print("==================================================")
    print("9. FASTAPI INTEGRATION TESTS")
    print("==================================================")

    # 1. GET /health
    req = urllib.request.urlopen(f"{FASTAPI_URL}/health")
    health = json.loads(req.read().decode())
    print("[GET /health]:", health)
    assert health["status"] == "ok"
    assert health["dlib_available"] is True, "dlib_available must be True!"

    # 2. POST /embed with real face image file
    test_img_path = os.path.join("backend", "test_face.jpg")
    with open(test_img_path, "rb") as f:
        img_bytes = f.read()

    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="file"; filename="test_face.jpg"\r\n'
        "Content-Type: image/jpeg\r\n\r\n"
    ).encode("utf-8") + img_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")

    embed_req = urllib.request.Request(
        f"{FASTAPI_URL}/embed",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST"
    )

    embed_res = json.loads(urllib.request.urlopen(embed_req).read().decode())
    print("[POST /embed]: mock =", embed_res.get("mock"), "| detected =", embed_res.get("detected"), "| embedding len =", len(embed_res.get("embedding", [])))
    print("First 5 embedding values from API:", [round(x, 4) for x in embed_res.get("embedding", [])[:5]])
    
    assert embed_res["mock"] is False, "Response must not be mock!"
    assert embed_res["detected"] is True
    assert len(embed_res["embedding"]) == 128

    # 3. POST /match with real candidate embeddings & real classroom photo
    real_embedding = embed_res["embedding"]
    
    # Encode test_face.jpg as base64 data url
    b64_img = "data:image/jpeg;base64," + base64.b64encode(img_bytes).decode()

    match_payload = {
        "classroom_photo_b64": b64_img,
        "students": [
            {
                "student_id": "student-alice-id",
                "name": "Alice Smith",
                "face_embedding": real_embedding
            }
        ]
    }

    match_req = urllib.request.Request(
        f"{FASTAPI_URL}/match",
        data=json.dumps(match_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    match_res = json.loads(urllib.request.urlopen(match_req).read().decode())
    print("[POST /match]:", json.dumps(match_res, indent=2))

    assert match_res["mock"] is False
    assert "student-alice-id" in match_res["matched_student_ids"]
    assert match_res["matches"][0]["verified"] is True
    print("\n✅ All FastAPI Integration Checks Passed Non-Mock!")

if __name__ == "__main__":
    test_fastapi_endpoints()

import io
import math
import numpy as np
from PIL import Image, ImageOps
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.svm import LinearSVC

DLIB_AVAILABLE = False
detector = None
pose_predictor = None
face_rec_model = None

try:
    import dlib
    import face_recognition_models

    detector = dlib.get_frontal_face_detector()
    pose_predictor_location = face_recognition_models.pose_predictor_model_location()
    pose_predictor = dlib.shape_predictor(pose_predictor_location)
    face_rec_model_location = face_recognition_models.face_recognition_model_location()
    face_rec_model = dlib.face_recognition_model_v1(face_rec_model_location)

    DLIB_AVAILABLE = True
except Exception as e:
    print(f"dlib native initialization note: {e}")
    DLIB_AVAILABLE = False

app = FastAPI(
    title="AttendX Face Recognition Microservice",
    description="FastAPI service for 128-d face embedding generation and multi-face classroom matching.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StudentCandidate(BaseModel):
    student_id: str = ""
    name: Optional[str] = ""
    face_embedding: List[float]

class MatchRequest(BaseModel):
    classroom_photo_b64: Optional[str] = None
    students: List[StudentCandidate]

def generate_fallback_embedding(img_bytes: bytes) -> List[float]:
    import hashlib
    seed = hashlib.sha256(img_bytes).digest()
    vec = []
    for i in range(128):
        byte_val = seed[i % len(seed)]
        val = (byte_val / 127.5) - 1.0
        vec.append(round(val, 6))
    norm = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [round(x / norm, 6) for x in vec]

def check_face_quality(img_np: np.ndarray, rect, shape) -> Dict[str, Any]:
    """
    Quality gate checking face image for:
    1. Low resolution (< 50x50 px face bounding box)
    2. Motion blur / out-of-focus (Laplacian variance < 15.0)
    3. Extreme viewing angle / head pose (yaw ratio > 0.60, pitch out of [0.12, 1.3])
    4. Face occlusion (mask, hand, or heavy object covering face quadrants)
    """
    top = max(0, rect.top())
    bottom = min(img_np.shape[0], rect.bottom())
    left = max(0, rect.left())
    right = min(img_np.shape[1], rect.right())

    w = right - left
    h = bottom - top

    # 1. Resolution Check
    if w < 50 or h < 50:
        return {
            "passed": False,
            "reason": "low_resolution",
            "message": f"Face resolution ({w}x{h}px) is below minimum quality threshold (50x50px)."
        }

    # 2. Blur Check (Numpy 2D Laplacian Variance)
    face_crop = img_np[top:bottom, left:right]
    gray = 0.299 * face_crop[:, :, 0] + 0.587 * face_crop[:, :, 1] + 0.114 * face_crop[:, :, 2]
    if gray.shape[0] > 2 and gray.shape[1] > 2:
        laplacian = (gray[1:-1, 1:-1] * -4.0 + 
                     gray[0:-2, 1:-1] + gray[2:, 1:-1] + 
                     gray[1:-1, 0:-2] + gray[1:-1, 2:])
        blur_score = float(np.var(laplacian))
    else:
        blur_score = 0.0

    if blur_score < 15.0:
        return {
            "passed": False,
            "reason": "blurred_image",
            "message": f"Face image is too blurry (blur score {blur_score:.1f} < 15.0 threshold)."
        }

    # 3. Extreme Viewing Angle / Pose Check (Yaw & Pitch)
    nose_tip = np.array([shape.part(30).x, shape.part(30).y])
    left_eye = np.array([shape.part(36).x, shape.part(36).y])
    right_eye = np.array([shape.part(45).x, shape.part(45).y])
    nose_top = np.array([shape.part(27).x, shape.part(27).y])
    chin = np.array([shape.part(8).x, shape.part(8).y])

    d_left = float(np.linalg.norm(nose_tip - left_eye))
    d_right = float(np.linalg.norm(nose_tip - right_eye))
    yaw_ratio = abs(d_left - d_right) / max(d_left, d_right, 1e-5)

    d_nose_bridge = abs(float(nose_tip[1] - nose_top[1]))
    d_nose_chin = abs(float(chin[1] - nose_tip[1]))
    pitch_ratio = d_nose_bridge / max(d_nose_chin, 1e-5)

    if yaw_ratio > 0.60:
        return {
            "passed": False,
            "reason": "extreme_viewing_angle",
            "message": f"Extreme horizontal viewing angle detected (yaw ratio {yaw_ratio:.2f} > 0.60). Face must be front-facing."
        }

    if pitch_ratio < 0.12 or pitch_ratio > 1.3:
        return {
            "passed": False,
            "reason": "extreme_viewing_angle",
            "message": f"Extreme vertical viewing angle detected (pitch ratio {pitch_ratio:.2f} out of range [0.12, 1.3]). Face must be front-facing."
        }

    # 4. Face Occlusion Check (Mask/Hand/Object covering face)
    q_h, q_w = gray.shape[0] // 2, gray.shape[1] // 2
    q1 = gray[0:q_h, 0:q_w]
    q2 = gray[0:q_h, q_w:gray.shape[1]]
    q3 = gray[q_h:gray.shape[0], 0:q_w]
    q4 = gray[q_h:gray.shape[0], q_w:gray.shape[1]]

    std_q = [float(np.std(q)) for q in [q1, q2, q3, q4] if q.size > 0]
    if any(s < 4.0 for s in std_q):
        return {
            "passed": False,
            "reason": "face_occlusion",
            "message": f"Face occlusion detected: quadrant texture variance ({min(std_q):.1f}) is too uniform."
        }

    mean_q = [float(np.mean(q)) for q in [q1, q2, q3, q4] if q.size > 0]
    if (max(mean_q) - min(mean_q)) > 85:
        return {
            "passed": False,
            "reason": "face_occlusion",
            "message": f"Face occlusion detected: quadrant brightness disparity ({max(mean_q) - min(mean_q):.1f}) exceeds threshold 85."
        }

    return {
        "passed": True,
        "reason": "pass",
        "message": "High quality face image."
    }

def extract_dlib_embeddings(img_bytes: bytes) -> List[List[float]]:
    pil_img = Image.open(io.BytesIO(img_bytes))
    pil_img = ImageOps.exif_transpose(pil_img).convert('RGB')
    img_np = np.array(pil_img)
    dets = detector(img_np, 1)

    # Multi-angle fallback if head is tilted (e.g. studio portrait at -15 deg angle)
    if not dets:
        for angle in [-15, 15, -10, 10, -30, 30]:
            img_rot = pil_img.rotate(angle, expand=True)
            arr_rot = np.array(img_rot)
            dets_rot = detector(arr_rot, 1)
            if dets_rot:
                img_np = arr_rot
                dets = dets_rot
                break

    if not dets:
        return []
    embeddings = []
    for d in dets:
        shape = pose_predictor(img_np, d)
        descriptor = face_rec_model.compute_face_descriptor(img_np, shape)
        embeddings.append([float(x) for x in descriptor])
    return embeddings

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "dlib_available": DLIB_AVAILABLE,
        "service": "AttendX Face Recognition API"
    }

@app.post("/embed")
async def get_embedding(file: UploadFile = File(...)):
    """
    Accepts an image file upload, detects face, validates face quality gate (resolution, blur, viewing angle, occlusion),
    and returns a 128-dimensional embedding if quality checks pass.
    """
    try:
        img_bytes = await file.read()

        if DLIB_AVAILABLE:
            pil_img = Image.open(io.BytesIO(img_bytes))
            pil_img = ImageOps.exif_transpose(pil_img).convert('RGB')
            img_np = np.array(pil_img)
            dets = detector(img_np, 1)

            if not dets:
                for angle in [-15, 15, -10, 10, -30, 30]:
                    img_rot = pil_img.rotate(angle, expand=True)
                    arr_rot = np.array(img_rot)
                    dets_rot = detector(arr_rot, 1)
                    if dets_rot:
                        img_np = arr_rot
                        dets = dets_rot
                        break

            if not dets:
                return {
                    "embedding": [],
                    "detected": False,
                    "quality_passed": False,
                    "reason": "no_face_detected",
                    "mock": False,
                    "message": "No face detected in image."
                }

            # Evaluate face quality gate on detected face
            shape = pose_predictor(img_np, dets[0])
            quality = check_face_quality(img_np, dets[0], shape)

            if not quality["passed"]:
                return {
                    "embedding": [],
                    "detected": True,
                    "quality_passed": False,
                    "reason": quality["reason"],
                    "mock": False,
                    "message": quality["message"]
                }

            descriptor = face_rec_model.compute_face_descriptor(img_np, shape)
            embedding = [float(x) for x in descriptor]

            return {
                "embedding": embedding,
                "detected": True,
                "quality_passed": True,
                "reason": "pass",
                "mock": False,
                "message": "Face embedding generated successfully via dlib."
            }
        else:
            embedding = generate_fallback_embedding(img_bytes)
            return {
                "embedding": embedding,
                "detected": True,
                "quality_passed": True,
                "reason": "pass",
                "mock": True,
                "message": "dlib unavailable. Returned deterministic fallback embedding."
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/match")
async def match_classroom_faces(
    request: Request,
    file: Optional[UploadFile] = File(None),
    students_json: Optional[str] = Form(None)
):
    """
    Accepts a classroom photo and candidate student embeddings.
    1. Fits LinearSVC model on candidate student embeddings.
    2. Detects faces in classroom photo.
    3. Predicts closest student and verifies Euclidean distance <= 0.6.
    4. Returns matched student IDs and match details.
    """
    try:
        import json
        import base64

        candidates: List[StudentCandidate] = []
        img_bytes = None

        content_type = request.headers.get("content-type", "")

        if "application/json" in content_type:
            body_json = await request.json()
            req_data = MatchRequest(**body_json)
            candidates = req_data.students
            if req_data.classroom_photo_b64:
                b64_str = req_data.classroom_photo_b64
                if "," in b64_str:
                    b64_str = b64_str.split(",", 1)[1]
                img_bytes = base64.b64decode(b64_str)

        if file:
            img_bytes = await file.read()

        if students_json:
            parsed = json.loads(students_json)
            candidates = [StudentCandidate(**s) for s in parsed]

        if not img_bytes:
            raise HTTPException(status_code=400, detail="Classroom image file or base64 photo required.")

        if not candidates:
            return {
                "matched_student_ids": [],
                "matches": [],
                "detections_count": 0,
                "mock": not DLIB_AVAILABLE,
                "message": "No candidate students provided for matching."
            }

        X_train = np.array([c.face_embedding for c in candidates])
        y_train = np.array([c.student_id for c in candidates])

        matched_student_ids = []
        matches_detail = []
        detections_count = 0

        if DLIB_AVAILABLE:
            detected_encodings = extract_dlib_embeddings(img_bytes)
            detections_count = len(detected_encodings)

            for face_enc in detected_encodings:
                face_vec = np.array(face_enc)
                distances = np.linalg.norm(X_train - face_vec, axis=1)
                min_idx = int(np.argmin(distances))
                min_dist = float(distances[min_idx])
                predicted_id = candidates[min_idx].student_id

                # Distance threshold check (<= 0.6)
                if min_dist <= 0.6:
                    if predicted_id not in matched_student_ids:
                        matched_student_ids.append(predicted_id)
                    matches_detail.append({
                        "student_id": predicted_id,
                        "distance": round(min_dist, 4),
                        "verified": True
                    })
                else:
                    matches_detail.append({
                        "student_id": predicted_id,
                        "distance": round(min_dist, 4),
                        "verified": False,
                        "reason": "Exceeds distance threshold 0.6"
                    })

            return {
                "matched_student_ids": matched_student_ids,
                "matches": matches_detail,
                "detections_count": detections_count,
                "mock": False,
                "message": f"Processed {detections_count} faces in classroom image."
            }

        else:
            fallback_enc = np.array(generate_fallback_embedding(img_bytes))
            distances = np.linalg.norm(X_train - fallback_enc, axis=1)
            min_idx = int(np.argmin(distances))
            min_dist = float(distances[min_idx])
            best_candidate = candidates[min_idx]

            verified = min_dist <= 0.8
            if verified:
                matched_student_ids.append(best_candidate.student_id)

            return {
                "matched_student_ids": matched_student_ids,
                "matches": [{
                    "student_id": best_candidate.student_id,
                    "distance": round(min_dist, 4),
                    "verified": verified
                }],
                "detections_count": 1,
                "mock": True,
                "message": "dlib unavailable. Returned mock matching result."
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

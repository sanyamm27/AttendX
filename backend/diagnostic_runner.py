import sys
import os
import io
import json
import urllib.request
import numpy as np
from PIL import Image

def run_diagnostics():
    print("==================================================")
    print("1. ENVIRONMENT DIAGNOSTICS")
    print("==================================================")
    
    import pip
    import setuptools
    import numpy
    import sklearn
    import fastapi
    import PIL
    import dlib
    import face_recognition_models

    print(f"Python Version: {sys.version}")
    print(f"pip Version: {pip.__version__}")
    print(f"setuptools Version: {setuptools.__version__}")
    print(f"dlib Version: {dlib.__version__}")
    print(f"face_recognition_models Version: {face_recognition_models.__version__}")
    print(f"numpy Version: {numpy.__version__}")
    print(f"scikit-learn Version: {sklearn.__version__}")
    print(f"FastAPI Version: {fastapi.__version__}")
    print(f"Pillow Version: {PIL.__version__}")

    pose_loc = face_recognition_models.pose_predictor_model_location()
    face_rec_loc = face_recognition_models.face_recognition_model_location()
    
    print(f"\n[Location] pose_predictor: {pose_loc}")
    print(f"[Location] face_rec_model: {face_rec_loc}")

    print("\n==================================================")
    print("2. MODEL-FILE DIAGNOSTICS")
    print("==================================================")
    
    pose_exists = os.path.isfile(pose_loc)
    face_rec_exists = os.path.isfile(face_rec_loc)

    pose_size = os.path.getsize(pose_loc) if pose_exists else 0
    face_rec_size = os.path.getsize(face_rec_loc) if face_rec_exists else 0

    print(f"shape_predictor_68_face_landmarks.dat: exists={pose_exists}, readable={os.access(pose_loc, os.R_OK)}, size={pose_size} bytes ({pose_size/1e6:.2f} MB)")
    print(f"dlib_face_recognition_resnet_model_v1.dat: exists={face_rec_exists}, readable={os.access(face_rec_loc, os.R_OK)}, size={face_rec_size} bytes ({face_rec_size/1e6:.2f} MB)")

    print("\n==================================================")
    print("3. INDEPENDENT DLIB STAGE DIAGNOSTICS")
    print("==================================================")

    detector = None
    sp = None
    facerec = None

    try:
        detector = dlib.get_frontal_face_detector()
        print("Stage A [dlib.get_frontal_face_detector()]: SUCCESS")
    except Exception as e:
        print(f"Stage A [dlib.get_frontal_face_detector()]: FAILED -> {e}")

    try:
        sp = dlib.shape_predictor(pose_loc)
        print("Stage B [dlib.shape_predictor(...)]: SUCCESS (Loaded by dlib)")
    except Exception as e:
        print(f"Stage B [dlib.shape_predictor(...)]: FAILED -> {e}")

    try:
        facerec = dlib.face_recognition_model_v1(face_rec_loc)
        print("Stage C [dlib.face_recognition_model_v1(...)]: SUCCESS (Loaded by dlib)")
    except Exception as e:
        print(f"Stage C [dlib.face_recognition_model_v1(...)]: FAILED -> {e}")

    # Fetch/create a real sample face image for diagnostic
    print("\n==================================================")
    print("4. REAL IMAGE DIAGNOSTICS")
    print("==================================================")
    
    # Download a sample face image from standard public URL or create test face
    test_img_path = os.path.join("backend", "test_face.jpg")
    if not os.path.exists(test_img_path):
        # Fetch sample face photo
        try:
            url = "https://raw.githubusercontent.com/ageitgey/face_recognition/master/examples/biden.jpg"
            urllib.request.urlretrieve(url, test_img_path)
            print(f"Downloaded test face image to {test_img_path}")
        except Exception as e:
            print(f"Could not download test face image: {e}")

    if os.path.exists(test_img_path):
        pil_img = Image.open(test_img_path).convert('RGB')
        img_np = np.array(pil_img)

        print(f"Image Path: {test_img_path}")
        print(f"Image Dimensions: {pil_img.size} (Width x Height)")
        print(f"Image Array Shape: {img_np.shape} (Height, Width, Channels)")
        print(f"Image Mode: {pil_img.mode}")

        # Stage D: detector(image)
        try:
            dets = detector(img_np, 1)
            print(f"Stage D [detector(img_np, 1)]: SUCCESS -> Detected {len(dets)} face(s)")
            for i, d in enumerate(dets):
                print(f"  Face #{i+1} Bounding Box: left={d.left()}, top={d.top()}, right={d.right()}, bottom={d.bottom()}")
            
            if len(dets) > 0:
                # Stage E: predictor(image, face_rect)
                d = dets[0]
                shape = sp(img_np, d)
                print(f"Stage E [sp(img_np, face_rect)]: SUCCESS -> Extracted {shape.num_parts} landmarks")
                
                # Stage F: compute_face_descriptor
                descriptor = facerec.compute_face_descriptor(img_np, shape)
                vec = list(descriptor)
                print(f"Stage F [compute_face_descriptor]: SUCCESS -> Embedding Length = {len(vec)}")
                print(f"First 5 embedding values: {[round(x, 4) for x in vec[:5]]}")
        except Exception as e:
            print(f"Failed during face processing stages D/E/F: {e}")

    # Stage 5: Multi-face Detection
    print("\n==================================================")
    print("5. MULTI-FACE DETECTION DIAGNOSTICS")
    print("==================================================")
    multi_img_path = os.path.join("backend", "multi_face.jpg")
    if not os.path.exists(multi_img_path):
        try:
            url = "https://raw.githubusercontent.com/ageitgey/face_recognition/master/examples/alex-lacamoire.jpg"
            urllib.request.urlretrieve(url, multi_img_path)
        except Exception:
            pass

    if os.path.exists(multi_img_path):
        m_img = np.array(Image.open(multi_img_path).convert('RGB'))
        m_dets = detector(m_img, 1)
        print(f"Multi-face image detected {len(m_dets)} face(s)")
        for idx, d in enumerate(m_dets):
            try:
                s = sp(m_img, d)
                desc = facerec.compute_face_descriptor(m_img, s)
                print(f"  Face #{idx+1}: BBox={d}, Embedding generated len={len(desc)}")
            except Exception as ex:
                print(f"  Face #{idx+1} failed: {ex}")

    # Stage 6: SVC Stage Diagnostics
    print("\n==================================================")
    print("6. SVC STAGE DIAGNOSTICS")
    print("==================================================")
    from sklearn.svm import LinearSVC

    # Case A: 1 student (single class)
    X1 = np.random.randn(3, 128)
    y1 = ["student_A", "student_A", "student_A"]
    try:
        svc1 = LinearSVC()
        svc1.fit(X1, y1)
        print("SVC with 1 class: FIT SUCCESS")
    except Exception as e:
        print(f"SVC with 1 class: FAILED as expected -> {e}")
        print(" -> Diagnostic Note: LinearSVC requires at least 2 distinct classes to fit a decision boundary.")

    # Case B: 2 students
    X2 = np.random.randn(4, 128)
    y2 = ["student_A", "student_A", "student_B", "student_B"]
    try:
        svc2 = LinearSVC()
        svc2.fit(X2, y2)
        print("SVC with 2 classes: FIT SUCCESS")
    except Exception as e:
        print(f"SVC with 2 classes: FAILED -> {e}")

    # Case C: 3+ students
    X3 = np.random.randn(6, 128)
    y3 = ["student_A", "student_A", "student_B", "student_B", "student_C", "student_C"]
    try:
        svc3 = LinearSVC()
        svc3.fit(X3, y3)
        print("SVC with 3 classes: FIT SUCCESS")
    except Exception as e:
        print(f"SVC with 3 classes: FAILED -> {e}")

    # Stage 7: Matching Independently
    print("\n==================================================")
    print("7. MATCHING & DISTANCE THRESHOLD DIAGNOSTICS")
    print("==================================================")
    if os.path.exists(test_img_path):
        img_np = np.array(Image.open(test_img_path).convert('RGB'))
        dets = detector(img_np, 1)
        if len(dets) > 0:
            shape = sp(img_np, dets[0])
            known_emb = list(facerec.compute_face_descriptor(img_np, shape))
            
            # Test match against identical embedding (distance 0.0)
            dist_same = np.linalg.norm(np.array(known_emb) - np.array(known_emb))
            print(f"Self-match distance (same face): {dist_same:.4f} (Threshold 0.6 => Verified: {dist_same <= 0.6})")

            # Test match against random unknown embedding
            unknown_emb = np.random.randn(128)
            unknown_emb /= np.linalg.norm(unknown_emb)
            dist_unknown = np.linalg.norm(np.array(known_emb) - unknown_emb)
            print(f"Unknown match distance (random face): {dist_unknown:.4f} (Threshold 0.6 => Verified: {dist_unknown <= 0.6})")

if __name__ == "__main__":
    run_diagnostics()

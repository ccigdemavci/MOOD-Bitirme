import os
import face_recognition
import pickle
import base64
import numpy as np
from io import BytesIO
from PIL import Image

# Kayıtlı yüz verileri klasörü ve pickle dosyası
KNOWN_FACES_DIR = "known_faces"
ENCODINGS_FILE = "face_encodings.pkl"

# Klasör var mı kontrol et
os.makedirs(KNOWN_FACES_DIR, exist_ok=True)

def decode_base64_image(base64_string):
    header, encoded = base64_string.split(",", 1)
    img_bytes = base64.b64decode(encoded)
    img = Image.open(BytesIO(img_bytes)).convert("RGB")
    return np.array(img)

def encode_face_from_base64(base64_image):
    img = decode_base64_image(base64_image)
    encodings = face_recognition.face_encodings(img)
    if not encodings:
        return None
    return encodings[0]

def save_known_faces(base64_image, username):
    encoding = encode_face_from_base64(base64_image)
    if encoding is None:
        raise ValueError("Yüz bulunamadı.")

    if os.path.exists(ENCODINGS_FILE):
        with open(ENCODINGS_FILE, "rb") as f:
            known_faces = pickle.load(f)
    else:
        known_faces = {}

    known_faces[username] = encoding
    with open(ENCODINGS_FILE, "wb") as f:
        pickle.dump(known_faces, f)

def identify_face(base64_image):
    unknown_encoding = encode_face_from_base64(base64_image)
    if unknown_encoding is None:
        return None

    if not os.path.exists(ENCODINGS_FILE):
        return None

    with open(ENCODINGS_FILE, "rb") as f:
        known_faces = pickle.load(f)

    for username, known_encoding in known_faces.items():
        match = face_recognition.compare_faces([known_encoding], unknown_encoding, tolerance=0.5)[0]
        if match:
            return username

    return None

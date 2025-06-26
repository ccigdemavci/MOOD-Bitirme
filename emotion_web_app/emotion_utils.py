import torch
import torch.nn.functional as F
from torchvision import models, transforms
import cv2
import numpy as np
from PIL import Image
import base64
import io

# 📌 Duygu sınıfları
classes = ["Anger", "Contempt", "Disgust", "Fear", "Happy", "Neutral", "Sad", "Surprise"]

# 📦 Modeli yükle (yalnızca bir kez)
def load_model():
    model = models.resnet34(weights=None)
    model.fc = torch.nn.Sequential(
        torch.nn.Linear(model.fc.in_features, 256),
        torch.nn.ReLU(),
        torch.nn.Dropout(0.4),
        torch.nn.Linear(256, len(classes))
    )
    model.load_state_dict(torch.load("model/best_resnet34_emotion.pth", map_location="cpu"))
    model.eval()
    return model

model = load_model()

# 🔄 Görüntü dönüşümü
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.5]*3, [0.5]*3)
])

# 🔮 Ana tahmin fonksiyonu
def predict_emotion_from_base64(base64_img):
    try:
        # Base64 verisini çöz
        if "," in base64_img:
            header, base64_data = base64_img.split(",", 1)
        else:
            base64_data = base64_img
        img_bytes = base64.b64decode(base64_data)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            raise ValueError("Görüntü çözülemedi (frame is None).")

        # 🧠 Yüz tespiti
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=5)

        if len(faces) == 0:
            return "Yüz bulunamadı", 0.0, []

        # İlk yüzü al ve dönüştür
        (x, y, w, h) = faces[0]
        face_img = frame[y:y+h, x:x+w]
        pil_img = Image.fromarray(cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB))

        input_tensor = transform(pil_img).unsqueeze(0)
        with torch.no_grad():
            output = model(input_tensor)
            probs = F.softmax(output[0], dim=0)

        # En yüksek duyguyu al
        top_idx = torch.argmax(probs).item()
        top_emotion = classes[top_idx]
        top_conf = probs[top_idx].item()

        # %10'dan büyük olanları al
        significant_emotions = []
        for i, p in enumerate(probs):
            if p.item() >= 0.10:
                significant_emotions.append({
                    'label': classes[i],
                    'confidence': round(p.item() * 100, 1)
                })

        return top_emotion, top_conf, significant_emotions

    except Exception as e:
        print("Tahmin hatası:", e)
        return "Hata", 0.0, []

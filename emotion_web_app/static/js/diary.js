document.addEventListener("DOMContentLoaded", () => {
    const emotionChart = document.getElementById("emotionChart");
    const rawData = emotionChart ? JSON.parse(emotionChart.getAttribute("data-raw") || "[]") : [];

    const grouped = {};

    rawData.forEach(([date, emotion, count]) => {
        if (!grouped[emotion]) grouped[emotion] = {};
        grouped[emotion][date] = count;
    });

    const dates = [...new Set(rawData.map(([d]) => d))];

    const datasets = Object.entries(grouped).map(([emotion, counts]) => {
        const color = getColorForEmotion(emotion);
        return {
            label: emotion,
            data: dates.map(d => counts[d] || 0),
            borderWidth: 2,
            borderColor: color,
            backgroundColor: hexToRGBA(color, 0.3),
            fill: true,
            tension: 0.4
        };
    });

    const ctx = emotionChart ? emotionChart.getContext("2d") : null;

    if (ctx && datasets.length) {
        new Chart(ctx, {
            type: "line",
            data: {
                labels: dates,
                datasets: datasets
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: "Son 7 Günde Duygu Dağılımı"
                    },
                    legend: {
                        position: "bottom"
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: "Oran"
                        }
                    }
                }
            }
        });
    }

    // 📌 Gerekli değişkenleri tanımla
    let currentUsername = null;
    let stream = null;

    const modal = document.getElementById("cameraModal");
    const video = document.getElementById("video");
    const captureBtn = document.getElementById("captureBtn");

    // 👤 Kullanıcı kartına tıklanınca kamera aç
    document.querySelectorAll(".user-card").forEach(card => {
        card.addEventListener("click", () => {
            currentUsername = card.getAttribute("data-username");
            modal.style.display = "flex";

            navigator.mediaDevices.getUserMedia({ video: true })
                .then(s => {
                    stream = s;
                    video.srcObject = stream;
                })
                .catch(err => {
                    alert("Kamera açma hatası: " + err.message);
                    closeModal();
                });
        });
    });

    // 🎯 Yüz Doğrulama Butonu
    captureBtn.addEventListener("click", () => {
        if (!video || video.readyState !== 4) {
            alert("Kamera henüz hazır değil.");
            return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL("image/jpeg");

        fetch("/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: imageData })
            })
            .then(res => res.json())
            .then(data => {
                const detectedUser = data.user;

                if (detectedUser === currentUsername) {
                    // ✅ Doğru kişi → yönlendir
                    window.location.href = `/diary/${currentUsername}`;
                } else if (detectedUser) {
                    alert(`Bu yüz ${detectedUser} olarak tanındı ama ${currentUsername} değil.`);
                } else {
                    alert("Yüz tanınamadı.");
                }

                closeModal();
            })
            .catch(err => {
                alert("Doğrulama sırasında hata oluştu: " + err.message);
                closeModal();
            });
    });

    // 📦 Kamera ve modalı kapatma
    window.closeModal = function() {
        modal.style.display = "none";
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        video.srcObject = null;
    };

    // 🎨 Renk fonksiyonları
    function getColorForEmotion(emotion) {
        const colors = {
            Happy: "#f1c40f",
            Sad: "#3498db",
            Angry: "#e74c3c",
            Fear: "#8e44ad",
            Disgust: "#27ae60",
            Surprise: "#e67e22",
            Neutral: "#7f8c8d",
            Contempt: "#d35400",
            Hata: "#c0392b"
        };
        return colors[emotion] || "#34495e";
    }

    function hexToRGBA(hex, alpha) {
        const bigint = parseInt(hex.replace("#", ""), 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
});
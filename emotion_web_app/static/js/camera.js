document.addEventListener("DOMContentLoaded", () => {
    const video = document.getElementById("video");
    const usernameTag = document.getElementById("usernameTag");
    const emotionTag = document.getElementById("emotionTag");
    const result = document.getElementById("result");
    const recommendBtn = document.getElementById("recommendBtn");

    const cameraSection = document.getElementById("cameraSection");
    const recommendationSection = document.getElementById("recommendationSection");
    const quoteEl = document.getElementById("quote");
    const songList = document.getElementById("songList");

    let currentEmotion = null;
    let identifiedUser = null;
    let stream = null;

    // 🎥 Kamera aç
    if (video) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(s => {
                stream = s;
                video.srcObject = stream;

                setTimeout(() => {
                    captureAndRecognizeFace();
                }, 2000);

                setInterval(() => {
                    if (identifiedUser) {
                        captureAndAnalyzeEmotion();
                    }
                }, 5000);
            })
            .catch(err => {
                alert("Kamera açma hatası: " + err.message);
            });
    }

    function captureAndRecognizeFace() {
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
                if (data.user) {
                    identifiedUser = data.user;
                    usernameTag.textContent = `👤 Tanınan kişi: ${identifiedUser}`;
                } else {
                    const name = prompt("Yüzün tanınamadı. Lütfen adını gir:");
                    if (name) {
                        registerNewUser(name, imageData);
                    }
                }

                if (data.emotion) {
                    currentEmotion = data.emotion;
                    emotionTag.textContent = `Mod: ${data.emotion}`;
                    result.textContent = `🎝 ${data.emotion} (${data.confidence}%)`;
                }
            });
    }

    function registerNewUser(name, image) {
        fetch("/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: name, image: image })
            })
            .then(res => res.json())
            .then(data => {
                alert(`${name} başarıyla kaydedildi. Sayfayı yenileyebilirsin.`);
                location.reload();
            });
    }

    function captureAndAnalyzeEmotion() {
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
                if (data.emotion) {
                    currentEmotion = data.emotion;
                    emotionTag.textContent = `Mod: ${data.emotion}`;
                    result.textContent = `🎝 ${data.emotion} (${data.confidence}%)`;
                }
            });
    }

    recommendBtn.addEventListener("click", () => {
        if (!currentEmotion) {
            alert("Lütfen önce modun algılanmasını bekleyin.");
            return;
        }

        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }

        cameraSection.style.display = "none";
        recommendationSection.style.display = "block";

        fetch("/recommend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ emotion: currentEmotion })
            })
            .then(res => res.json())
            .then(data => {
                const quote = data.quote || "✨ Söz bulunamadı.";
                const songs = data.songs || [];

                quoteEl.textContent = `✨ ${quote}`;
                songList.innerHTML = "";

                songs.forEach(song => {
                    if (song && song.title && song.artist && song.url) {
                        const link = document.createElement("a");
                        link.href = song.url;
                        link.target = "_blank";
                        link.className = "song-button";
                        link.textContent = `🎷 ${song.artist} - ${song.title}`;
                        songList.appendChild(link);
                    } else {
                        const fallback = document.createElement("p");
                        fallback.textContent = JSON.stringify(song);
                        songList.appendChild(fallback);
                    }
                });
            })
            .catch(err => {
                quoteEl.textContent = "Bir hata oluştu: " + err.message;
            });
    });

    function extractURL(text) {
        const match = text.match(/https?:\/\/[^ -"<>\^`{|}\\]+/);
        return match ? match[0] : "#";
    }
});
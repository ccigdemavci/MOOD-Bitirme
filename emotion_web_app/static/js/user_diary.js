let currentChart;

function renderEmotionChart(rawData) {
    const chartEl = document.getElementById("emotionChart");
    const ctx = chartEl.getContext("2d");

    const grouped = {};
    rawData.forEach(([date, emotion, count]) => {
        if (!grouped[emotion]) grouped[emotion] = {};
        grouped[emotion][date] = count;
    });

    const dates = [...new Set(rawData.map(([d]) => d))].sort();
    const datasets = Object.entries(grouped).map(([emotion, counts]) => {
        const baseColor = getColorForEmotion(emotion);
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, hexToRGBA(baseColor, 0.5));
        gradient.addColorStop(1, hexToRGBA(baseColor, 0));

        return {
            label: emotion,
            data: dates.map(d => counts[d] || 0),
            borderColor: baseColor,
            backgroundColor: gradient,
            fill: true,
            tension: 0.45,
            pointBackgroundColor: baseColor,
            pointBorderColor: "#fff",
            pointHoverRadius: 7,
            pointRadius: 5,
            pointStyle: "circle"
        };
    });

    if (currentChart) currentChart.destroy();
    currentChart = new Chart(ctx, {
        type: "line",
        data: { labels: dates, datasets },
        options: {
            responsive: true,
            animation: {
                duration: 1500,
                easing: "easeOutBounce"
            },
            plugins: {
                title: {
                    display: true,
                    text: "✨ Günlük Duygu Değişimi",
                    font: {
                        size: 22,
                        weight: "bold",
                        family: "Arial"
                    },
                    color: "#4b0082",
                    padding: { top: 10, bottom: 20 }
                },
                tooltip: {
                    backgroundColor: "#fff",
                    borderColor: "#ccc",
                    borderWidth: 1,
                    titleColor: "#000",
                    bodyColor: "#000",
                    titleFont: { weight: "bold" },
                    padding: 10
                },
                legend: {
                    position: "bottom",
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                }
            },
            interaction: {
                mode: "nearest",
                axis: "x",
                intersect: false
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Tarih",
                        font: {
                            size: 14,
                            weight: "bold"
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Kayıt Sayısı",
                        font: {
                            size: 14,
                            weight: "bold"
                        }
                    },
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function generateCalendarGrid(year, month, notesByDate = {}) {
    const calendarContainer = document.querySelector(".calendar");
    calendarContainer.innerHTML = "";

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "calendar-cell empty";
        calendarContainer.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement("div");
        cell.className = "calendar-cell";
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        cell.setAttribute("data-date", dateStr);

        const dateEl = document.createElement("span");
        dateEl.className = "date";
        dateEl.textContent = day;

        const noteEl = document.createElement("div");
        noteEl.className = "note";
        noteEl.textContent = notesByDate[dateStr] || "";

        cell.appendChild(dateEl);
        cell.appendChild(noteEl);
        calendarContainer.appendChild(cell);
    }
}

function closeModal() {
    document.getElementById("noteModal").style.display = "none";
}

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

document.addEventListener("DOMContentLoaded", () => {
    const now = new Date();
    const raw = document.getElementById("emotionChart").getAttribute("data-raw") || "[]";
    const rawData = JSON.parse(raw);
    renderEmotionChart(rawData);

    const username = document.body.getAttribute("data-username");
    const notesEl = document.getElementById("calendarNotes");
    const notes = JSON.parse((notesEl && notesEl.getAttribute("data-notes")) || "{}");

    // 📆 AY GÖRÜNÜMÜ BAŞLANGIÇTA GİZLİ
    generateCalendarGrid(now.getFullYear(), now.getMonth(), notes);

    // 📌 Hücreye tıklayınca not modalı aç
    document.addEventListener("click", (e) => {
        const cell = e.target.closest(".calendar-cell:not(.empty)");
        if (cell) {
            const date = cell.getAttribute("data-date");
            document.getElementById("modalDate").textContent = date;
            document.getElementById("noteText").value = cell.querySelector(".note").textContent.trim();
            document.getElementById("noteModal").style.display = "flex";
        }
    });

    // ✅ Notu kaydet
    document.getElementById("saveNote").addEventListener("click", () => {
        const date = document.getElementById("modalDate").textContent;
        const note = document.getElementById("noteText").value.trim();

        fetch("/save-note", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date, note, username })
        }).then(res => {
            if (res.ok) {
                const cell = document.querySelector(`.calendar-cell[data-date='${date}'] .note`);
                if (cell) cell.textContent = note;
                closeModal();
            }
        });
    });

    // 🗓 Yıllık → Aylık görünüm geçişi
    document.querySelectorAll(".month-cell").forEach(cell => {
        cell.addEventListener("click", () => {
            const monthIndex = parseInt(cell.getAttribute("data-month")) - 1;
            const year = new Date().getFullYear();

            document.querySelector(".yearly-calendar").style.display = "none";
            document.querySelector(".monthly-wrapper").style.display = "block";

            const monthNames = [
                "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
                "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
            ];
            document.getElementById("selectedMonthTitle").textContent = monthNames[monthIndex];

            generateCalendarGrid(year, monthIndex, notes);
        });
    });

    // 🔙 Aydan tekrar yıla dön
    const backBtn = document.getElementById("backToYearly");
    if (backBtn) {
        backBtn.addEventListener("click", () => {
            document.querySelector(".yearly-calendar").style.display = "grid";
            document.querySelector(".monthly-wrapper").style.display = "none";
        });
    }
});
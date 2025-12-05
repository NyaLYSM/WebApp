import { sendToBot } from "./api.js";

const content = document.getElementById("content");

// Логика переключения разделов
function openSection(section) {
    if (section === "wardrobe") {
        content.innerHTML = `
            <h2>👗 Ваши вещи</h2>
            <p>Скоро здесь появится ваш гардероб.</p>
        `;
    }

    if (section === "add") {
        content.innerHTML = `
            <h2>📸 Добавить вещь</h2>
            <button class="btn" id="uploadBtn">Загрузить фото</button>
        `;

        document.getElementById("uploadBtn").addEventListener("click", () => {
            sendToBot({ action: "upload_item" });
        });
    }

    if (section === "looks") {
        content.innerHTML = `
            <h2>🎨 Генерация луков</h2>
            <p>Функция скоро будет доступна.</p>
        `;
    }

    if (section === "profile") {
        content.innerHTML = `
            <h2>⚙️ Профиль</h2>
            <p>Здесь будут настройки.</p>
        `;
    }
}

// Вешаем обработчики на кнопки
document.querySelectorAll(".btn").forEach(btn => {
    btn.addEventListener("click", () => {
        openSection(btn.dataset.section);
    });
});

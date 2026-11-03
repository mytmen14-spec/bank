#!/bin/bash

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   BANK HEIST — Настройка экспорта в видео   ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Проверяем Node.js
if ! command -v node &> /dev/null; then
    echo "[!] Node.js не найден!"
    echo "    Установите: brew install node"
    echo "    Или скачайте с https://nodejs.org"
    exit 1
fi
echo "[OK] Node.js найден: $(node --version)"

# Проверяем FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "[!] FFmpeg не найден!"
    echo "    Установите: brew install ffmpeg"
    echo ""
    echo "    Без FFmpeg можно записать видео через record.html"
    echo "    или через запись экрана (Cmd+Shift+5)."
    echo ""
else
    echo "[OK] FFmpeg найден"
    ffmpeg -version 2>&1 | head -1
fi

echo ""

# Устанавливаем зависимости
echo "[*] Устанавливаю зависимости..."
npm install
echo ""

# Создаём папки
mkdir -p frames output
echo "[OK] Папки созданы"

# Копируем HTML
if [ -f "../public/bank-heist.html" ]; then
    cp "../public/bank-heist.html" "index.html"
    echo "[OK] index.html скопирован"
else
    echo "[!] Файл bank-heist.html не найден в ../public/"
    echo "    Откройте record.html для записи через браузер"
fi

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   ГОТОВО!                                    ║"
echo "╠══════════════════════════════════════════════╣"
echo "║                                              ║"
echo "║   Способ 1: Puppeteer + FFmpeg               ║"
echo "║     npm run export                           ║"
echo "║                                              ║"
echo "║   Способ 2: Запись через браузер             ║"
echo "║     Откройте record.html                     ║"
echo "║                                              ║"
echo "║   Способ 3: Запись экрана                    ║"
echo "║     Откройте index.html, Cmd+Shift+5         ║"
echo "║                                              ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

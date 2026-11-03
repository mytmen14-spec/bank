#!/bin/bash

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   BANK HEIST — 4K Shorts Экспорт            ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "  Формат: 2160x3840 (4K 9:16)"
echo "  FPS: 60"
echo "  Длительность: ~90 сек"
echo ""

# Проверяем Node.js
if ! command -v node &> /dev/null; then
    echo "[!] Node.js не найден!"
    echo "    Установите: brew install node"
    exit 1
fi
echo "[OK] Node.js найден: $(node --version)"

# Проверяем FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "[!] FFmpeg не найден!"
    echo "    Установите: brew install ffmpeg"
    exit 1
fi
echo "[OK] FFmpeg найден"
echo ""

# Устанавливаем зависимости
echo "[*] Устанавливаю зависимости..."
npm install
echo ""

# Создаём папки
mkdir -p frames-shorts output
echo "[OK] Папки созданы"
echo ""

echo "╔══════════════════════════════════════════════╗"
echo "║   ЗАПУСК ЭКСПОРТА 4K SHORTS                 ║"
echo "╠══════════════════════════════════════════════╣"
echo "║                                              ║"
echo "║   Шаг 1: Захват кадров (~10-20 мин)         ║"
echo "║   Шаг 2: Сборка видео (~5-15 мин)           ║"
echo "║                                              ║"
echo "║   Результат:                                  ║"
echo "║   output/bank-heist-shorts-4k.mp4            ║"
echo "║                                              ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
read -p "Нажмите Enter для начала..."
echo ""

# Запуск экспорта
npm run export-shorts

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   ГОТОВО!                                    ║"
echo "╠══════════════════════════════════════════════╣"
echo "║                                              ║"
echo "║   Видео: output/bank-heist-shorts-4k.mp4    ║"
echo "║                                              ║"
echo "║   Загрузите на:                              ║"
echo "║   • YouTube Shorts                           ║"
echo "║   • TikTok                                   ║"
echo "║   • Instagram Reels                          ║"
echo "║                                              ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════╗
echo ║   BANK HEIST — 4K Shorts Экспорт            ║
echo ╚══════════════════════════════════════════════╝
echo.
echo   Формат: 2160x3840 (4K 9:16)
echo   FPS: 60
echo   Длительность: ~90 сек
echo.

:: Проверяем Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Node.js не найден!
    echo     Скачайте с https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js найден

:: Проверяем FFmpeg
where ffmpeg >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] FFmpeg не найден!
    echo     Скачайте с https://ffmpeg.org/download.html
    pause
    exit /b 1
)
echo [OK] FFmpeg найден
echo.

:: Устанавливаем зависимости
echo [*] Устанавливаю зависимости...
call npm install
echo.

:: Создаём папки
if not exist "frames-shorts" mkdir frames-shorts
if not exist "output" mkdir output
echo [OK] Папки созданы
echo.

echo ╔══════════════════════════════════════════════╗
echo ║   ЗАПУСК ЭКСПОРТА 4K SHORTS                 ║
echo ╠══════════════════════════════════════════════╣
echo ║                                              ║
echo ║   Шаг 1: Захват кадров (~10-20 мин)         ║
echo ║   Шаг 2: Сборка видео (~5-15 мин)           ║
echo ║                                              ║
echo ║   Результат:                                  ║
echo ║   output/bank-heist-shorts-4k.mp4            ║
echo ║                                              ║
echo ╚══════════════════════════════════════════════╝
echo.
echo Нажмите любую клавишу для начала...
pause >nul
echo.

:: Запуск экспорта
call npm run export-shorts

echo.
echo ╔══════════════════════════════════════════════╗
echo ║   ГОТОВО!                                    ║
echo ╠══════════════════════════════════════════════╣
echo ║                                              ║
echo ║   Видео: output/bank-heist-shorts-4k.mp4    ║
echo ║                                              ║
echo ║   Загрузите на:                              ║
echo ║   • YouTube Shorts                           ║
echo ║   • TikTok                                   ║
echo ║   • Instagram Reels                          ║
echo ║                                              ║
echo ╚══════════════════════════════════════════════╝
echo.
pause

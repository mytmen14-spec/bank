@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════╗
echo ║   BANK HEIST — Настройка экспорта в видео   ║
echo ╚══════════════════════════════════════════════╝
echo.

:: Проверяем Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Node.js не найден!
    echo     Скачайте с https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js найден
node --version

:: Проверяем FFmpeg
where ffmpeg >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] FFmpeg не найден!
    echo     Скачайте с https://ffmpeg.org/download.html
    echo     Добавьте в PATH
    echo.
    echo     Без FFmpeg можно записать видео через record.html
    echo     или через запись экрана ^(Win+Alt+R^).
    echo.
) else (
    echo [OK] FFmpeg найден
    ffmpeg -version 2>&1 | findstr "ffmpeg version"
)

echo.

:: Устанавливаем зависимости
echo [*] Устанавливаю зависимости...
call npm install
echo.

:: Создаём папки
if not exist "frames" mkdir frames
if not exist "output" mkdir output
echo [OK] Папки созданы

:: Копируем HTML
if exist "..\public\bank-heist.html" (
    copy "..\public\bank-heist.html" "index.html" >nul
    echo [OK] index.html скопирован
) else (
    echo [!] Файл bank-heist.html не найден в ..\public\
    echo     Откройте record.html для записи через браузер
)

echo.
echo ╔══════════════════════════════════════════════╗
echo ║   ГОТОВО!                                    ║
echo ╠══════════════════════════════════════════════╣
echo ║                                              ║
echo ║   Способ 1: Puppeteer + FFmpeg               ║
echo ║     npm run export                           ║
echo ║                                              ║
echo ║   Способ 2: Запись через браузер             ║
echo ║     Откройте record.html                     ║
echo ║                                              ║
echo ║   Способ 3: Запись экрана                    ║
echo ║     Откройте index.html, Win+Alt+R           ║
echo ║                                              ║
echo ╚══════════════════════════════════════════════╝
echo.
pause

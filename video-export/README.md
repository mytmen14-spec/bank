# 🎬 BANK HEIST — Экспорт в MP4

## Способы конвертации в видео

### Способ 1: Запись экрана (самый простой, 2 минуты)

1. Откройте `index.html` в браузере Chrome
2. Запустите запись экрана:
   - **Windows**: `Win + Alt + R` или OBS Studio
   - **macOS**: `Cmd + Shift + 5`
   - **Linux**: `gnome-screenshot --area` или SimpleScreenRecorder
3. Нажмите ▶ PLAY в анимации
4. Дождитесь окончания (~90 сек)
5. Остановите запись

**Настройки для лучшего качества:**
- Разрешение: 1920×1080
- FPS: 60
- Формат: MP4 (H.264)

---

### Способ 2: Puppeteer + FFmpeg (профессиональный, идеальное качество)

Каждый кадр рендерится отдельно — без просадок FPS.

#### Установка:

```bash
# 1. Установите Node.js с https://nodejs.org (если ещё не установлен)

# 2. Установите FFmpeg:
#    macOS:   brew install ffmpeg
#    Windows: https://ffmpeg.org/download.html (добавить в PATH)
#    Linux:   sudo apt install ffmpeg

# 3. Установите зависимости:
cd video-export
npm install
```

#### Запуск:

```bash
# Захват кадров + сборка видео
npm run export

# Или по шагам:
npm run capture   # захват кадров в папку frames/
npm run build     # сборка кадров в MP4
```

Результат: `output/bank-heist.mp4` (1920×1080, 30 FPS, ~90 сек)

---

### Способ 3: Запись через браузер (MediaRecorder)

1. Откройте `record.html` в Chrome
2. Нажмите "НАЧАТЬ ЗАПИСЬ"
3. Анимация запустится автоматически
4. По окончании — видео скачается как `.webm`
5. Конвертируйте в MP4:

```bash
ffmpeg -i bank-heist.webm -c:v libx264 -crf 18 bank-heist.mp4
```

---

## Структура файлов

```
video-export/
├── README.md           ← этот файл
├── index.html          ← автономная анимация (открыть в браузере)
├── record.html         ← запись через MediaRecorder
├── capture.js          ← скрипт захвата кадров (Puppeteer)
├── build-video.js      ← скрипт сборки видео (FFmpeg)
├── package.json        ← зависимости Node.js
├── frames/             ← папка для кадров (создастся автоматически)
└── output/             ← папка для готового видео
```

## Настройки качества

В `capture.js` можно изменить:
- `WIDTH` / `HEIGHT` — разрешение (по умолчанию 1920×1080)
- `FPS` — частота кадров (по умолчанию 30)
- `DURATION` — длительность в мс (по умолчанию 95000)

## Требования

- Node.js 16+
- FFmpeg (для Способа 2)
- Chrome/Chromium (устанавливается автоматически с Puppeteer)

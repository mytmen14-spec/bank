# 🚀 БЫСТРЫЙ СТАРТ — Экспорт BANK HEIST в MP4

## Самый простой способ (2 минуты)

1. Откройте `index.html` в Chrome
2. Нажмите ▶ PLAY
3. Запишите экран:
   - Windows: `Win + Alt + R`
   - Mac: `Cmd + Shift + 5`
4. Готово!

---

## Профессиональный способ (идеальное качество)

### Установка (один раз):

```bash
# Windows:
setup.bat

# Mac/Linux:
chmod +x setup.sh && ./setup.sh
```

### Экспорт:

```bash
npm run export
```

Результат: `output/bank-heist.mp4` (1920×1080, 30 FPS)

---

## Способ через браузер (без FFmpeg)

1. Откройте `record.html` в Chrome
2. Нажмите "🔴 НАЧАТЬ ЗАПИСЬ"
3. Дождитесь окончания (~90 сек)
4. Файл `bank-heist.webm` скачается автоматически
5. Конвертируйте в MP4:

```bash
ffmpeg -i bank-heist.webm -c:v libx264 -crf 18 output.mp4
```

---

## Структура папки

```
video-export/
├── index.html          ← анимация (открыть в браузере)
├── record.html         ← запись через MediaRecorder
├── capture.js          ← захват кадров (Puppeteer)
├── build-video.js      ← сборка MP4 (FFmpeg)
├── package.json        ← зависимости
├── setup.bat           ← настройка для Windows
├── setup.sh            ← настройка для Mac/Linux
├── frames/             ← кадры (создаётся автоматически)
└── output/             ← готовое видео
```

---

## Требования

- **Node.js 16+** — [nodejs.org](https://nodejs.org)
- **FFmpeg** — [ffmpeg.org](https://ffmpeg.org) (для способа 2)
- **Chrome** — для записи через браузер

---

## Настройки качества

В `capture.js` можно изменить:
```js
const WIDTH = 1920;    // ширина
const HEIGHT = 1080;   // высота
const FPS = 30;        // кадры в секунду
```

---

## Проблемы?

**Puppeteer не запускается:**
```bash
npx puppeteer browsers install chrome
```

**FFmpeg не найден:**
- Windows: скачайте с ffmpeg.org, добавьте в PATH
- Mac: `brew install ffmpeg`
- Linux: `sudo apt install ffmpeg`

**Видео чёрное:**
- Убедитесь, что Chrome не в режиме инкогнито
- Попробуйте `record.html` вместо Puppeteer

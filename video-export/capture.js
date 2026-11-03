const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Настройки
const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 30;
const DURATION = 95000; // 95 секунд в миллисекундах
const FRAME_INTERVAL = 1000 / FPS; // интервал между кадрами в мс

const FRAMES_DIR = path.join(__dirname, 'frames');
const HTML_FILE = path.join(__dirname, 'index.html');

async function capture() {
  console.log('🎬 BANK HEIST — Захват кадров для видео');
  console.log(`📐 Разрешение: ${WIDTH}x${HEIGHT}`);
  console.log(`🎞️ FPS: ${FPS}`);
  console.log(`⏱️ Длительность: ${DURATION/1000} сек`);
  console.log('');

  // Создаём папку для кадров
  if (!fs.existsSync(FRAMES_DIR)) {
    fs.mkdirSync(FRAMES_DIR, { recursive: true });
  }

  // Очищаем папку
  const existingFrames = fs.readdirSync(FRAMES_DIR);
  if (existingFrames.length > 0) {
    console.log(`🗑️ Удаляю ${existingFrames.length} старых кадров...`);
    existingFrames.forEach(f => fs.unlinkSync(path.join(FRAMES_DIR, f)));
  }

  console.log('🚀 Запускаю браузер...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      `--window-size=${WIDTH},${HEIGHT}`
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });

  console.log('📄 Загружаю анимацию...');
  await page.goto(`file://${HTML_FILE}`, { waitUntil: 'networkidle0' });

  // Ждём загрузки шрифтов и библиотек
  await page.waitForTimeout(2000);

  console.log('▶️ Запускаю анимацию...');
  await page.click('#playBtn');

  // Ждём начала рендеринга
  await page.waitForTimeout(1000);

  console.log('📸 Захватываю кадры...');
  console.log('');

  const startTime = Date.now();
  let frameCount = 0;
  const totalFrames = Math.floor(DURATION / FRAME_INTERVAL);

  // Захватываем кадры с фиксированным интервалом
  while (Date.now() - startTime < DURATION) {
    const frameNum = String(frameCount).padStart(5, '0');
    const framePath = path.join(FRAMES_DIR, `frame_${frameNum}.png`);

    // Скриншот canvas
    const canvas = await page.$('canvas');
    if (canvas) {
      await canvas.screenshot({ path: framePath, type: 'png' });
    } else {
      // Если canvas нет, делаем скриншот всей страницы
      await page.screenshot({ path: framePath, type: 'png' });
    }

    frameCount++;

    // Прогресс
    if (frameCount % 30 === 0) {
      const progress = Math.floor((frameCount / totalFrames) * 100);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  📸 Кадр ${frameCount}/${totalFrames} (${progress}%) — ${elapsed}с`);
    }

    // Ждём следующий интервал
    const nextFrameTime = startTime + (frameCount * FRAME_INTERVAL);
    const waitTime = nextFrameTime - Date.now();
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  console.log('');
  console.log(`✅ Захвачено ${frameCount} кадров`);
  console.log(`📁 Папка: ${FRAMES_DIR}`);
  console.log('');
  console.log('🎬 Теперь запустите сборку видео:');
  console.log('   npm run build');
  console.log('');

  await browser.close();
}

capture().catch(err => {
  console.error('❌ Ошибка:', err);
  process.exit(1);
});

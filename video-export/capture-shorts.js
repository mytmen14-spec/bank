const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// 4K Shorts настройки - вертикальный формат 9:16
const WIDTH = 2160;   // 4K ширина
const HEIGHT = 3840;  // 4K высота
const FPS = 60;       // 60 FPS для плавности
const DURATION = 95000; // 95 секунд
const FRAME_INTERVAL = 1000 / FPS;

const FRAMES_DIR = path.join(__dirname, 'frames-shorts');
const HTML_FILE = path.join(__dirname, 'shorts-4k.html');

async function capture() {
  console.log('🎬 BANK HEIST — 4K Shorts захват кадров');
  console.log(`📐 Разрешение: ${WIDTH}x${HEIGHT} (9:16)`);
  console.log(`🎞️ FPS: ${FPS}`);
  console.log(`⏱️ Длительность: ${DURATION/1000} сек`);
  console.log('');

  if (!fs.existsSync(FRAMES_DIR)) {
    fs.mkdirSync(FRAMES_DIR, { recursive: true });
  }

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
  await page.waitForTimeout(3000);

  console.log('▶️ Запускаю анимацию...');
  await page.click('#playBtn');
  await page.waitForTimeout(1000);

  console.log('📸 Захватываю кадры (4K)...');
  console.log('');

  const startTime = Date.now();
  let frameCount = 0;
  const totalFrames = Math.floor(DURATION / FRAME_INTERVAL);

  while (Date.now() - startTime < DURATION) {
    const frameNum = String(frameCount).padStart(5, '0');
    const framePath = path.join(FRAMES_DIR, `frame_${frameNum}.png`);

    const canvas = await page.$('canvas');
    if (canvas) {
      await canvas.screenshot({ path: framePath, type: 'png' });
    } else {
      await page.screenshot({ path: framePath, type: 'png' });
    }

    frameCount++;

    if (frameCount % 60 === 0) {
      const progress = Math.floor((frameCount / totalFrames) * 100);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  📸 Кадр ${frameCount}/${totalFrames} (${progress}%) — ${elapsed}с`);
    }

    const nextFrameTime = startTime + (frameCount * FRAME_INTERVAL);
    const waitTime = nextFrameTime - Date.now();
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  console.log('');
  console.log(`✅ Захвачено ${frameCount} кадров (4K)`);
  console.log(`📁 Папка: ${FRAMES_DIR}`);
  console.log('');
  console.log('🎬 Теперь запустите сборку видео:');
  console.log('   node build-shorts.js');
  console.log('');

  await browser.close();
}

capture().catch(err => {
  console.error('❌ Ошибка:', err);
  process.exit(1);
});

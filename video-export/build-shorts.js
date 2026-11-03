const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 4K Shorts настройки
const FPS = 60;
const FRAMES_DIR = path.join(__dirname, 'frames-shorts');
const OUTPUT_DIR = path.join(__dirname, 'output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'bank-heist-shorts-4k.mp4');

function checkFFmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function buildVideo() {
  console.log('🎬 BANK HEIST — Сборка 4K Shorts видео');
  console.log('');

  if (!checkFFmpeg()) {
    console.error('❌ FFmpeg не найден!');
    console.error('');
    console.error('Установите FFmpeg:');
    console.error('  macOS:   brew install ffmpeg');
    console.error('  Windows: https://ffmpeg.org/download.html');
    console.error('  Linux:   sudo apt install ffmpeg');
    process.exit(1);
  }

  if (!fs.existsSync(FRAMES_DIR)) {
    console.error('❌ Папка frames-shorts/ не найдена!');
    console.error('Сначала запустите: node capture-shorts.js');
    process.exit(1);
  }

  const frames = fs.readdirSync(FRAMES_DIR).filter(f => f.endsWith('.png'));
  if (frames.length === 0) {
    console.error('❌ Нет кадров в папке frames-shorts/!');
    console.error('Сначала запустите: node capture-shorts.js');
    process.exit(1);
  }

  console.log(`📸 Найдено ${frames.length} кадров`);
  console.log(`🎞️ FPS: ${FPS}`);
  console.log(`📐 Разрешение: 2160x3840 (4K 9:16)`);
  console.log(`⏱️ Длительность: ${(frames.length / FPS).toFixed(1)} сек`);
  console.log('');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('🔨 Собираю 4K Shorts видео...');
  console.log('');

  try {
    // FFmpeg команда для 4K Shorts (вертикальное видео)
    const ffmpegCmd = [
      'ffmpeg',
      '-y',
      '-framerate', FPS,
      '-i', path.join(FRAMES_DIR, 'frame_%05d.png'),
      '-c:v', 'libx264',
      '-preset', 'slow',
      '-crf', '16', // Высокое качество для 4K
      '-pix_fmt', 'yuv420p',
      '-vf', 'scale=2160:3840:force_original_aspect_ratio=decrease,pad=2160:3840:(ow-iw)/2:(oh-ih)/2',
      '-movflags', '+faststart',
      '-profile:v', 'high',
      '-level', '5.1',
      OUTPUT_FILE
    ].join(' ');

    console.log('Выполняю:', ffmpegCmd);
    console.log('');

    execSync(ffmpegCmd, { stdio: 'inherit' });

    console.log('');
    console.log('✅ 4K Shorts видео успешно создано!');
    console.log('');
    console.log(`📁 Файл: ${OUTPUT_FILE}`);
    console.log(`📐 Разрешение: 2160x3840 (4K 9:16)`);
    console.log(`🎞️ FPS: ${FPS}`);
    console.log(`⏱️ Длительность: ${(frames.length / FPS).toFixed(1)} сек`);
    console.log(`💾 Размер: ${(fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2)} MB`);
    console.log('');
    console.log('🎉 Готово для загрузки в:');
    console.log('   • YouTube Shorts');
    console.log('   • TikTok');
    console.log('   • Instagram Reels');
    console.log('');
  } catch (err) {
    console.error('❌ Ошибка при сборке видео:', err.message);
    process.exit(1);
  }
}

buildVideo();

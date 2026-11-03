const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Настройки
const FPS = 30;
const FRAMES_DIR = path.join(__dirname, 'frames');
const OUTPUT_DIR = path.join(__dirname, 'output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'bank-heist.mp4');

function checkFFmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function buildVideo() {
  console.log('🎬 BANK HEIST — Сборка видео из кадров');
  console.log('');

  // Проверяем FFmpeg
  if (!checkFFmpeg()) {
    console.error('❌ FFmpeg не найден!');
    console.error('');
    console.error('Установите FFmpeg:');
    console.error('  macOS:   brew install ffmpeg');
    console.error('  Windows: https://ffmpeg.org/download.html');
    console.error('  Linux:   sudo apt install ffmpeg');
    process.exit(1);
  }

  // Проверяем папку с кадрами
  if (!fs.existsSync(FRAMES_DIR)) {
    console.error('❌ Папка frames/ не найдена!');
    console.error('Сначала запустите: npm run capture');
    process.exit(1);
  }

  const frames = fs.readdirSync(FRAMES_DIR).filter(f => f.endsWith('.png'));
  if (frames.length === 0) {
    console.error('❌ Нет кадров в папке frames/!');
    console.error('Сначала запустите: npm run capture');
    process.exit(1);
  }

  console.log(`📸 Найдено ${frames.length} кадров`);
  console.log(`🎞️ FPS: ${FPS}`);
  console.log(`⏱️ Длительность: ${(frames.length / FPS).toFixed(1)} сек`);
  console.log('');

  // Создаём папку output
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Собираем видео с помощью FFmpeg
  console.log('🔨 Собираю видео...');
  console.log('');

  try {
    // Команда FFmpeg для сборки видео из PNG кадров
    const ffmpegCmd = [
      'ffmpeg',
      '-y', // перезаписать выходной файл
      '-framerate', FPS,
      '-i', path.join(FRAMES_DIR, 'frame_%05d.png'),
      '-c:v', 'libx264', // видеокодек H.264
      '-preset', 'slow', // качество/скорость кодирования
      '-crf', '18', // качество (18 = высокое)
      '-pix_fmt', 'yuv420p', // формат пикселей для совместимости
      '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2', // масштабирование
      '-movflags', '+faststart', // для быстрого старта в браузере
      OUTPUT_FILE
    ].join(' ');

    console.log('Выполняю:', ffmpegCmd);
    console.log('');

    execSync(ffmpegCmd, { stdio: 'inherit' });

    console.log('');
    console.log('✅ Видео успешно создано!');
    console.log('');
    console.log(`📁 Файл: ${OUTPUT_FILE}`);
    console.log(`📐 Разрешение: 1920x1080`);
    console.log(`🎞️ FPS: ${FPS}`);
    console.log(`⏱️ Длительность: ${(frames.length / FPS).toFixed(1)} сек`);
    console.log(`💾 Размер: ${(fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2)} MB`);
    console.log('');
    console.log('🎉 Готово! Можете открыть видео в любом плеере.');
  } catch (err) {
    console.error('❌ Ошибка при сборке видео:', err.message);
    process.exit(1);
  }
}

buildVideo();

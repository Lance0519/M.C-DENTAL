#!/usr/bin/env node
/**
 * Script to make logo images transparent by removing white/light backgrounds
 * Requires: npm install sharp
 * Usage: node make_logo_transparent.js
 */

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if sharp is available
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (error) {
  console.error('❌ Error: sharp is not installed');
  console.log('\nPlease install sharp first:');
  console.log('  npm install sharp');
  console.log('  or');
  console.log('  cd frontend && npm install sharp');
  process.exit(1);
}

async function makeTransparent(inputPath, outputPath = null, tolerance = 30) {
  try {
    if (!existsSync(inputPath)) {
      console.log(`⚠️  File not found: ${inputPath}`);
      return null;
    }

    console.log(`\nProcessing: ${inputPath}`);

    // Read the image
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    // Determine output path
    if (!outputPath) {
      const ext = path.extname(inputPath);
      const base = path.basename(inputPath, ext);
      const dir = path.dirname(inputPath);
      outputPath = path.join(dir, `${base}_transparent.png`);
    }

    // Process the image
    // Extract alpha channel and make white/light pixels transparent
    const { data, info } = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const channels = info.channels;
    const pixels = data.length / channels;
    const newData = Buffer.alloc(pixels * 4); // RGBA

    for (let i = 0; i < pixels; i++) {
      const idx = i * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = channels === 4 ? data[idx + 3] : 255;

      // Calculate distance from white (255, 255, 255)
      const distance = Math.sqrt(
        Math.pow(255 - r, 2) + Math.pow(255 - g, 2) + Math.pow(255 - b, 2)
      );

      // If close to white, make transparent
      const newIdx = i * 4;
      newData[newIdx] = r;
      newData[newIdx + 1] = g;
      newData[newIdx + 2] = b;
      newData[newIdx + 3] = distance < tolerance ? 0 : a;
    }

    // Save the processed image
    await sharp(newData, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4,
      },
    })
      .png()
      .toFile(outputPath);

    console.log(`✅ Saved: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error(`❌ Error processing ${inputPath}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Making logos transparent...');
  console.log('='.repeat(60));

  // Logo files to process
  const logoFiles = [
    path.join(__dirname, 'assets', 'images', 'logo.png'),
    path.join(__dirname, 'assets', 'images', 'blogo.png'),
    path.join(__dirname, 'frontend', 'public', 'assets', 'images', 'logo.png'),
    path.join(__dirname, 'frontend', 'public', 'assets', 'images', 'blogo.png'),
  ];

  // Filter to only existing files
  const existingFiles = logoFiles.filter((f) => existsSync(f));

  if (existingFiles.length === 0) {
    console.log('\n❌ No logo files found in default locations');
    console.log('\nUsage:');
    console.log('  node make_logo_transparent.js [image_path1] [image_path2] ...');
    process.exit(1);
  }

  console.log(`\nFound ${existingFiles.length} logo file(s) to process:`);
  existingFiles.forEach((f) => console.log(`  - ${f}`));

  // Settings
  const tolerance = 30; // How close to white should be transparent (0-255)

  console.log(`\nSettings:`);
  console.log(`  Tolerance: ${tolerance}`);
  console.log(`  Background color: RGB(255, 255, 255) - White`);

  // Process all files
  const results = [];
  for (const file of existingFiles) {
    const result = await makeTransparent(file, null, tolerance);
    if (result) {
      results.push(result);
    }
  }

  if (results.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('✅ All logos processed successfully!');
    console.log('='.repeat(60));
    console.log('\nProcessed files:');
    results.forEach((r) => console.log(`  ✓ ${r}`));
    console.log('\nNext steps:');
    console.log('1. Review the new transparent logo files');
    console.log('2. Replace the original files if they look good');
    console.log('3. Update your code to use the transparent versions');
  } else {
    console.log('\n❌ Failed to process logos');
  }
}

main().catch(console.error);


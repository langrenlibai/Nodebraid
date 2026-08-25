'use strict';

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const OUTPUT_DIRECTORY = path.resolve(__dirname, '..', 'assets');
const COLORS = {
  navy: [11, 18, 32, 255],
  teal: [45, 212, 191, 255],
  violet: [139, 92, 246, 255],
  white: [248, 250, 252, 255],
  shadow: [0, 0, 0, 70]
};

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function encodePng(width, height, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;

  const rows = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (width * 4 + 1);
    rows[rowOffset] = 0;
    pixels.copy(rows, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', zlib.deflateSync(rows, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}

function blendPixel(pixels, width, x, y, color, coverage = 1) {
  if (x < 0 || y < 0 || x >= width || y >= width || coverage <= 0) return;
  const offset = (y * width + x) * 4;
  const sourceAlpha = (color[3] / 255) * Math.min(1, coverage);
  const targetAlpha = pixels[offset + 3] / 255;
  const outputAlpha = sourceAlpha + targetAlpha * (1 - sourceAlpha);
  if (outputAlpha === 0) return;

  for (let channel = 0; channel < 3; channel += 1) {
    pixels[offset + channel] = Math.round(
      (color[channel] * sourceAlpha + pixels[offset + channel] * targetAlpha * (1 - sourceAlpha))
      / outputAlpha
    );
  }
  pixels[offset + 3] = Math.round(outputAlpha * 255);
}

function drawDisc(pixels, size, centerX, centerY, radius, color) {
  const minimumX = Math.max(0, Math.floor(centerX - radius - 1));
  const maximumX = Math.min(size - 1, Math.ceil(centerX + radius + 1));
  const minimumY = Math.max(0, Math.floor(centerY - radius - 1));
  const maximumY = Math.min(size - 1, Math.ceil(centerY + radius + 1));

  for (let y = minimumY; y <= maximumY; y += 1) {
    for (let x = minimumX; x <= maximumX; x += 1) {
      const distance = Math.hypot(x + 0.5 - centerX, y + 0.5 - centerY);
      blendPixel(pixels, size, x, y, color, radius + 0.75 - distance);
    }
  }
}

function cubicPoint(points, time) {
  const inverse = 1 - time;
  const weight0 = inverse ** 3;
  const weight1 = 3 * inverse ** 2 * time;
  const weight2 = 3 * inverse * time ** 2;
  const weight3 = time ** 3;
  return [
    points[0][0] * weight0 + points[1][0] * weight1 + points[2][0] * weight2 + points[3][0] * weight3,
    points[0][1] * weight0 + points[1][1] * weight1 + points[2][1] * weight2 + points[3][1] * weight3
  ];
}

function drawCurve(pixels, size, points, width, color) {
  const scale = size / 512;
  const scaled = points.map(([x, y]) => [x * scale, y * scale]);
  const steps = Math.max(80, Math.round(size / 2));
  for (let step = 0; step <= steps; step += 1) {
    const [x, y] = cubicPoint(scaled, step / steps);
    drawDisc(pixels, size, x, y, width * scale / 2, color);
  }
}

function insideRoundedSquare(x, y, size, inset, radius) {
  const left = inset;
  const right = size - inset;
  const top = inset;
  const bottom = size - inset;
  const nearestX = Math.max(left + radius, Math.min(x, right - radius));
  const nearestY = Math.max(top + radius, Math.min(y, bottom - radius));
  return Math.hypot(x - nearestX, y - nearestY) <= radius;
}

function generateLogo(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const scale = size / 512;
  const inset = 24 * scale;
  const radius = 112 * scale;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (insideRoundedSquare(x + 0.5, y + 0.5, size, inset, radius)) {
        const offset = (y * size + x) * 4;
        pixels[offset] = COLORS.navy[0];
        pixels[offset + 1] = COLORS.navy[1];
        pixels[offset + 2] = COLORS.navy[2];
        pixels[offset + 3] = 255;
      }
    }
  }

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const inOuterEdge = insideRoundedSquare(x + 0.5, y + 0.5, size, 34 * scale, 102 * scale);
      const inInnerEdge = insideRoundedSquare(x + 0.5, y + 0.5, size, 38 * scale, 98 * scale);
      if (inOuterEdge && !inInnerEdge) {
        blendPixel(pixels, size, x, y, [248, 250, 252, 20]);
      }
    }
  }

  const left = [[132, 390], [132, 300], [132, 210], [132, 122]];
  const diagonal = [[132, 122], [210, 162], [300, 350], [380, 390]];
  const right = [[380, 390], [380, 300], [380, 210], [380, 122]];
  drawCurve(pixels, size, left, 44, COLORS.teal);
  drawCurve(pixels, size, diagonal, 64, COLORS.navy);
  drawCurve(pixels, size, diagonal, 44, COLORS.violet);
  drawCurve(pixels, size, right, 64, COLORS.navy);
  drawCurve(pixels, size, right, 44, COLORS.white);

  const nodes = [
    [132, 390, COLORS.navy, COLORS.teal],
    [132, 122, COLORS.navy, COLORS.violet],
    [380, 390, COLORS.violet, COLORS.white],
    [380, 122, COLORS.navy, COLORS.white]
  ];
  for (const [x, y, stroke, fill] of nodes) {
    drawDisc(pixels, size, x * scale, y * scale, 15 * scale, stroke);
    drawDisc(pixels, size, x * scale, y * scale, 9 * scale, fill);
  }

  return encodePng(size, size, pixels);
}

function wrapIco(png) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header[6] = 0;
  header[7] = 0;
  header[8] = 0;
  header[9] = 0;
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18);
  return Buffer.concat([header, png]);
}

function wrapIcns(icons) {
  const chunks = icons.map(([type, png]) => {
    const header = Buffer.alloc(8);
    header.write(type, 0, 4, 'ascii');
    header.writeUInt32BE(png.length + 8, 4);
    return Buffer.concat([header, png]);
  });
  const header = Buffer.alloc(8);
  header.write('icns', 0, 4, 'ascii');
  header.writeUInt32BE(8 + chunks.reduce((total, chunk) => total + chunk.length, 0), 4);
  return Buffer.concat([header, ...chunks]);
}

fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
const icon16 = generateLogo(16);
const icon32 = generateLogo(32);
const icon64 = generateLogo(64);
const icon128 = generateLogo(128);
const icon1024 = generateLogo(1024);
const icon512 = generateLogo(512);
const icon256 = generateLogo(256);
fs.writeFileSync(path.join(OUTPUT_DIRECTORY, 'icon.png'), icon1024);
fs.writeFileSync(path.join(OUTPUT_DIRECTORY, 'icon-512.png'), icon512);
fs.writeFileSync(path.join(OUTPUT_DIRECTORY, 'icon-256.png'), icon256);
fs.writeFileSync(path.join(OUTPUT_DIRECTORY, 'icon.ico'), wrapIco(icon256));
fs.writeFileSync(path.join(OUTPUT_DIRECTORY, 'icon.icns'), wrapIcns([
  ['icp4', icon16],
  ['icp5', icon32],
  ['icp6', icon64],
  ['ic07', icon128],
  ['ic08', icon256],
  ['ic09', icon512],
  ['ic10', icon1024]
]));
process.stdout.write('Generated Nodebraid PNG, ICO, and ICNS assets.\n');

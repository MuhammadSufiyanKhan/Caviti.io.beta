const fs = require('fs');
const zlib = require('zlib');

const width = 32;
const height = 32;
const pixels = Buffer.alloc(width * height * 4);

// Fill background black
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    pixels[idx] = 0;
    pixels[idx + 1] = 0;
    pixels[idx + 2] = 0;
    pixels[idx + 3] = 255;
  }
}

// Draw white circle
const cx = 16;
const cy = 16;
const radius = 11.5;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const dx = x - cx;
    const dy = y - cy;
    if (dx * dx + dy * dy <= radius * radius) {
      const idx = (y * width + x) * 4;
      pixels[idx] = 255;
      pixels[idx + 1] = 255;
      pixels[idx + 2] = 255;
      pixels[idx + 3] = 255;
    }
  }
}

// Draw diagonal line
function distancePointToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) {
    const vx = px - x1;
    const vy = py - y1;
    return Math.sqrt(vx * vx + vy * vy);
  }
  const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
  const clamped = Math.max(0, Math.min(1, t));
  const cx2 = x1 + clamped * dx;
  const cy2 = y1 + clamped * dy;
  const vx = px - cx2;
  const vy = py - cy2;
  return Math.sqrt(vx * vx + vy * vy);
}

const x1 = 12;
const y1 = 12;
const x2 = 24;
const y2 = 20;
const lineWidth = 1.1;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const dist = distancePointToSegment(x + 0.5, y + 0.5, x1, y1, x2, y2);
    if (dist <= lineWidth) {
      const idx = (y * width + x) * 4;
      pixels[idx] = 0;
      pixels[idx + 1] = 0;
      pixels[idx + 2] = 0;
      pixels[idx + 3] = 255;
    }
  }
}

function crc32(buf) {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const header = Buffer.alloc(8);
  header.writeUInt32BE(data.length, 0);
  header.write(type, 4, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 0);
  return Buffer.concat([header, data, crc]);
}

const rows = [];
for (let y = 0; y < height; y++) {
  const row = Buffer.alloc(1 + width * 4);
  row[0] = 0;
  pixels.copy(row, 1, y * width * 4, (y + 1) * width * 4);
  rows.push(row);
}
const raw = Buffer.concat(rows);
const idat = zlib.deflateSync(raw);
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', Buffer.from([width >>> 24, (width >>> 16) & 255, (width >>> 8) & 255, width & 255, height >>> 24, (height >>> 16) & 255, (height >>> 8) & 255, height & 255, 8, 6, 0, 0, 0])),
  chunk('IDAT', idat),
  chunk('IEND', Buffer.alloc(0)),
]);

const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(1, 4);
const dirEntry = Buffer.alloc(16);
dirEntry.writeUInt8(width === 256 ? 0 : width, 0);
dirEntry.writeUInt8(height === 256 ? 0 : height, 1);
dirEntry.writeUInt8(0, 2);
dirEntry.writeUInt8(0, 3);
dirEntry.writeUInt16LE(1, 4);
dirEntry.writeUInt16LE(32, 6);
dirEntry.writeUInt32LE(png.length, 8);
dirEntry.writeUInt32LE(6 + 16, 12);

const ico = Buffer.concat([icoHeader, dirEntry, png]);
fs.writeFileSync('src/app/favicon.ico', ico);
fs.writeFileSync('public/favicon.ico', ico);
console.log('Updated src/app/favicon.ico and public/favicon.ico');

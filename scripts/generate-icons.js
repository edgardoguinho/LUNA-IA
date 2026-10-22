import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawPixel) {
  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // CRC32 implementation
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const chunkData = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(chunkData), 0);
    return Buffer.concat([len, chunkData, crcBuf]);
  }

  // IHDR chunk: 13 bytes
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth 8
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Scanlines with filter 0 (None)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawPixel(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate Luna icon with dark background, glowing moon & heart
function renderLunaIcon(x, y, w, h) {
  // Normalize to [-1, 1]
  const nx = (x / w) * 2 - 1;
  const ny = (y / h) * 2 - 1;

  // Background squircle
  const distSquircle = Math.pow(Math.abs(nx), 3.5) + Math.pow(Math.abs(ny), 3.5);
  if (distSquircle > 0.95) {
    return [0, 0, 0, 0]; // transparent outside
  }

  // Deep dark violet background gradient
  let bgR = Math.floor(18 + (ny + 1) * 8);
  let bgG = Math.floor(8 + (nx + 1) * 6);
  let bgB = Math.floor(35 + (ny + 1) * 15);

  // Heart formula: (x^2 + y^2 - 1)^3 - x^2 * y^3 <= 0
  // Scaled and shifted
  const hx = nx * 1.5;
  const hy = -ny * 1.5 + 0.15; // flip y and shift
  const heartEq = Math.pow(hx * hx + hy * hy - 0.7, 3) - hx * hx * Math.pow(hy, 3);

  // Moon crescent: circle centered at (0.2, -0.1) minus circle at (0.05, -0.2)
  const dMoon1 = Math.hypot(nx - 0.2, ny + 0.15);
  const dMoon2 = Math.hypot(nx - 0.05, ny + 0.05);
  const isMoon = dMoon1 < 0.45 && dMoon2 > 0.4;

  if (heartEq <= 0) {
    // Inside heart: vibrant pink-purple glow gradient
    const t = (hy + 0.8) / 1.6;
    const r = Math.min(255, Math.floor(255 * (1 - t * 0.3)));
    const g = Math.min(255, Math.floor(65 + 40 * t));
    const b = Math.min(255, Math.floor(140 + 100 * t));
    return [r, g, b, 255];
  } else if (isMoon) {
    // Moon crescent
    return [245, 185, 250, 240];
  } else {
    // Aura glow around heart
    if (heartEq < 0.2) {
      const glowFactor = (0.2 - heartEq) / 0.2;
      bgR = Math.min(255, bgR + Math.floor(180 * glowFactor));
      bgG = Math.min(255, bgG + Math.floor(40 * glowFactor));
      bgB = Math.min(255, bgB + Math.floor(160 * glowFactor));
    }
    return [bgR, bgG, bgB, 255];
  }
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate icons
const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'pwa-maskable-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

for (const item of sizes) {
  const buf = createPNG(item.size, item.size, renderLunaIcon);
  fs.writeFileSync(path.join(publicDir, item.name), buf);
  console.log(`Generated ${item.name} (${item.size}x${item.size})`);
}

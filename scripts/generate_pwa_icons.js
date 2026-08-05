const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// Script simples para gerar arquivos PNG válidos sem dependências externas
function createPng(width, height, r, g, b) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type (RGB)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = createChunk("IHDR", ihdr);

  // IDAT chunk (raw image data)
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter type byte per scanline
    for (let x = 0; x < width; x++) {
      // Cria um gradiente suave roxo/vinho
      const distFromCenter = Math.sqrt(Math.pow(x - width/2, 2) + Math.pow(y - height/2, 2));
      const factor = Math.max(0.5, 1 - distFromCenter / (width / 1.4));
      
      rawData.push(Math.round(r * factor));
      rawData.push(Math.round(g * factor));
      rawData.push(Math.round(b * factor));
    }
  }

  const compressed = zlib.deflateSync(Buffer.from(rawData));
  const idatChunk = createChunk("IDAT", compressed);

  // IEND chunk
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// Tabela de CRC32
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const iconsDir = path.join(__dirname, "..", "public", "icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Cor principal da Adega Cloud (Vinho/Rose 600: RGB 225, 29, 72)
const png192 = createPng(192, 192, 225, 29, 72);
const png512 = createPng(512, 512, 225, 29, 72);

fs.writeFileSync(path.join(iconsDir, "icon-192x192.png"), png192);
fs.writeFileSync(path.join(iconsDir, "icon-512x512.png"), png512);

console.log("✅ Ícones PWA gerados com sucesso em public/icons/");

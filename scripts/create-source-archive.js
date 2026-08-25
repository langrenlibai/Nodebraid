'use strict';

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { createHash } = require('node:crypto');
const packageData = require('../package.json');

const root = path.resolve(__dirname, '..');
const outputDirectory = path.join(root, 'dist');
const outputName = `nodebraid-${packageData.version}-source.tar.gz`;
const excludedTopLevel = new Set(['.git', 'dist', 'node_modules']);

function archiveEntries(directory = root, prefix = '') {
  const entries = [];
  for (const name of fs.readdirSync(directory).sort((left, right) => left.localeCompare(right))) {
    if (!prefix && excludedTopLevel.has(name)) continue;
    const absolutePath = path.join(directory, name);
    const relativePath = prefix ? `${prefix}/${name}` : name;
    const info = fs.lstatSync(absolutePath);
    if (info.isSymbolicLink()) {
      throw new Error(`Refusing to archive symbolic link: ${relativePath}`);
    }
    if (info.isDirectory()) entries.push(...archiveEntries(absolutePath, relativePath));
    else if (info.isFile()) entries.push({ absolutePath, relativePath, info });
  }
  return entries;
}

function writeOctal(buffer, offset, length, value) {
  const encoded = Math.max(0, value).toString(8).padStart(length - 1, '0');
  buffer.write(encoded.slice(-(length - 1)), offset, length - 1, 'ascii');
  buffer[offset + length - 1] = 0;
}

function tarHeader(entry, size) {
  const archivePath = `Nodebraid-${packageData.version}/${entry.relativePath}`;
  const nameBytes = Buffer.byteLength(archivePath);
  if (nameBytes > 100) throw new Error(`Archive path is too long: ${archivePath}`);

  const header = Buffer.alloc(512);
  header.write(archivePath, 0, 100, 'utf8');
  writeOctal(header, 100, 8, entry.info.mode & 0o777);
  writeOctal(header, 108, 8, 0);
  writeOctal(header, 116, 8, 0);
  writeOctal(header, 124, 12, size);
  writeOctal(header, 136, 12, Number(process.env.SOURCE_DATE_EPOCH) || 0);
  header.fill(0x20, 148, 156);
  header[156] = '0'.charCodeAt(0);
  header.write('ustar\0', 257, 6, 'ascii');
  header.write('00', 263, 2, 'ascii');
  header.write('Nodebraid', 265, 9, 'ascii');
  header.write('Nodebraid', 297, 9, 'ascii');
  const checksum = header.reduce((sum, byte) => sum + byte, 0);
  const checksumText = checksum.toString(8).padStart(6, '0');
  header.write(checksumText, 148, 6, 'ascii');
  header[154] = 0;
  header[155] = 0x20;
  return header;
}

function padded(contents) {
  const remainder = contents.length % 512;
  return remainder === 0 ? contents : Buffer.concat([contents, Buffer.alloc(512 - remainder)]);
}

const chunks = [];
for (const entry of archiveEntries()) {
  const contents = fs.readFileSync(entry.absolutePath);
  chunks.push(tarHeader(entry, contents.length), padded(contents));
}
chunks.push(Buffer.alloc(1024));

fs.mkdirSync(outputDirectory, { recursive: true });
const outputPath = path.join(outputDirectory, outputName);
const archive = zlib.gzipSync(Buffer.concat(chunks), { level: 9, mtime: 0 });
fs.writeFileSync(outputPath, archive);
const checksum = createHash('sha256').update(archive).digest('hex');
fs.writeFileSync(`${outputPath}.sha256`, `${checksum}  ${outputName}\n`, 'utf8');
process.stdout.write(`${outputPath}\n`);

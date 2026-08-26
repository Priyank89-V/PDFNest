/* RC4 PDF Encryption — browser-based */

function rc4(key, data) {
  const S = new Uint8Array(256);
  for (let i = 0; i < 256; i++) S[i] = i;
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + S[i] + key[i % key.length]) & 255;
    [S[i], S[j]] = [S[j], S[i]];
  }
  const out = new Uint8Array(data.length);
  let x = 0; j = 0;
  for (let k = 0; k < data.length; k++) {
    x = (x + 1) & 255;
    j = (j + S[x]) & 255;
    [S[x], S[j]] = [S[j], S[x]];
    out[k] = data[k] ^ S[(S[x] + S[j]) & 255];
  }
  return out;
}

function md5(input) {
  // Simple MD5 implementation for PDF encryption
  const bytes = typeof input === 'string'
    ? new TextEncoder().encode(input)
    : input;

  function F(x, y, z) { return (x & y) | (~x & z); }
  function G(x, y, z) { return (x & z) | (y & ~z); }
  function H(x, y, z) { return x ^ y ^ z; }
  function I(x, y, z) { return y ^ (x | ~z); }
  function rotl(x, n) { return (x << n) | (x >>> (32 - n)); }

  const K = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
    0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
    0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
    0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
    0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
    0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
    0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
    0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
    0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
  ];
  const s = [
    7,12,17,22, 7,12,17,22, 7,12,17,22, 7,12,17,22,
    5, 9,14,20, 5, 9,14,20, 5, 9,14,20, 5, 9,14,20,
    4,11,16,23, 4,11,16,23, 4,11,16,23, 4,11,16,23,
    6,10,15,21, 6,10,15,21, 6,10,15,21, 6,10,15,21,
  ];

  let len = bytes.length;
  let paddedLen = ((len + 8) >>> 6) * 64 + 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(bytes);
  padded[len] = 0x80;
  const bitLen = len * 8;
  padded[paddedLen - 8] = bitLen & 0xff;
  padded[paddedLen - 7] = (bitLen >>> 8) & 0xff;
  padded[paddedLen - 6] = (bitLen >>> 16) & 0xff;
  padded[paddedLen - 5] = (bitLen >>> 24) & 0xff;

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;

  for (let offset = 0; offset < paddedLen; offset += 64) {
    const M = new Uint32Array(16);
    for (let j = 0; j < 16; j++) {
      M[j] = padded[offset + j*4] | (padded[offset + j*4+1] << 8) |
              (padded[offset + j*4+2] << 16) | (padded[offset + j*4+3] << 24);
    }
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let f, g;
      if (i < 16)      { f = F(B,C,D); g = i; }
      else if (i < 32) { f = G(B,C,D); g = (5*i+1) % 16; }
      else if (i < 48) { f = H(B,C,D); g = (3*i+5) % 16; }
      else              { f = I(B,C,D); g = (7*i) % 16; }
      f = (f + A + K[i] + M[g]) >>> 0;
      A = D; D = C; C = B; B = (B + rotl(f, s[i])) >>> 0;
    }
    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }

  const result = new Uint8Array(16);
  [a0, b0, c0, d0].forEach((val, i) => {
    result[i*4]   = val & 0xff;
    result[i*4+1] = (val >>> 8) & 0xff;
    result[i*4+2] = (val >>> 16) & 0xff;
    result[i*4+3] = (val >>> 24) & 0xff;
  });
  return result;
}

const PDF_PADDING = new Uint8Array([
  0x28,0xBF,0x4E,0x5E,0x4E,0x75,0x8A,0x41,
  0x64,0x00,0x4E,0x56,0xFF,0xFA,0x01,0x08,
  0x2E,0x2E,0x00,0xB6,0xD0,0x68,0x3E,0x80,
  0x2F,0x0C,0xA9,0xFE,0x64,0x53,0x69,0x7A,
]);

export function encryptPDF(pdfData, userPassword, ownerPassword) {
  try {
    const pdfStr = new TextDecoder('latin1').decode(pdfData);
    // Find xref and trailer
    const xrefIdx = pdfStr.lastIndexOf('startxref');
    if (xrefIdx < 0) return null;

    // Build owner password hash
    const ownerPadded = new Uint8Array(32);
    const ownerBytes = new TextEncoder().encode(ownerPassword || userPassword);
    ownerPadded.set(ownerBytes.slice(0, 32));
    if (ownerBytes.length < 32) ownerPadded.set(PDF_PADDING.slice(0, 32 - ownerBytes.length), ownerBytes.length);

    const ownerHash = md5(ownerPadded);
    const userPadded = new Uint8Array(32);
    const userBytes = new TextEncoder().encode(userPassword);
    userPadded.set(userBytes.slice(0, 32));
    if (userBytes.length < 32) userPadded.set(PDF_PADDING.slice(0, 32 - userBytes.length), userBytes.length);

    const O = rc4(ownerHash.slice(0, 5), userPadded);

    // Build encryption key
    const keyInput = new Uint8Array(68);
    keyInput.set(userPadded, 0);
    keyInput.set(O, 32);
    keyInput[64] = 0xff; keyInput[65] = 0xff; keyInput[66] = 0xff; keyInput[67] = 0xff; // P = -4 (all permissions)
    const encKey = md5(keyInput).slice(0, 5);

    const U = rc4(encKey, PDF_PADDING);

    // Build encryption dictionary
    function toHex(arr) { return Array.from(arr, b => b.toString(16).padStart(2, '0')).join(''); }

    const encDict = `\n% Encryption\n` +
      `<< /Type /Encrypt /Filter /Standard /V 1 /R 2 /Length 40\n` +
      `   /O <${toHex(O)}>\n` +
      `   /U <${toHex(U)}>\n` +
      `   /P -4 >>\n`;

    // Insert before startxref and add /Encrypt to trailer
    let modified = pdfStr;
    const trailerIdx = modified.lastIndexOf('trailer');
    if (trailerIdx >= 0) {
      const trailerEnd = modified.indexOf('>>', trailerIdx);
      if (trailerEnd >= 0) {
        // Add a new object for the encryption dict
        const objNum = (modified.match(/\d+ 0 obj/g) || []).length + 1;
        const encObj = `${objNum} 0 obj\n${encDict}\nendobj\n`;
        const encRef = `/Encrypt ${objNum} 0 R`;
        modified = modified.slice(0, trailerEnd) + '\n  ' + encRef + '\n' + modified.slice(trailerEnd);
        modified = modified.slice(0, trailerIdx) + encObj + modified.slice(trailerIdx);
      }
    }

    return new TextEncoder().encode(modified);
  } catch {
    return null;
  }
}

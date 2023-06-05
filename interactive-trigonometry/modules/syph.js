/**
 * This is a little module I've written to save state of my program in much more efficient manner, than just json-ing+base64-ing.
 * In fact, these produce strings so large, than Telegram refuses to embed them in links :)
 */

/**
 * Encodes provided object into a string using schema
 * @param {Object} object Object to encode
 * @param {(String | {t: "b" | "w" | "i" | "d" | "s", n: String})[]} schema Schema to use
 * @returns {String} Result of encoding
 */
export function sypher(object, schema) {
  /** @type {String[]} */
  let stack = [];
  /** @type {Object} */
  let current = object;
  /** @type {boolean[]} */
  let booleans = [];
  /** @type {Number[]} */
  let words = [];
  /** @type {Number[]} */
  let integers = [];
  /** @type {Number[]} */
  let doubles = [];
  /** @type {String[]} */
  let strings = [];
  schema.forEach((directive) => {
    if (typeof directive === "string") {
      // these are navigation directives
      if (directive === "__") {
        current = stack.pop();
      } else {
        stack.push(current);
        current = current[directive];
      }
    } else {
      // these are writing directives
      /** @type {boolean | Number | String} */
      let value = current[directive.n];
      // write this value to appropriate array
      switch (directive.t) {
        case "b":
          booleans.push(value ?? false);
          break;
        case "w":
          words.push(value ?? 0);
          break;
        case "i":
          integers.push(value);
          break;
        case "d":
          doubles.push(value);
          break;
        case "s":
          strings.push(value);
          break;
      }
    }
  });

  // fill rest of the boolean byte
  while (booleans.length % 8) {
    booleans.push(false);
  }
  // encode booleans
  let boolRes = new Uint8Array(Math.ceil(booleans.length / 8)); // resulting array
  for (let i = 0; i < boolRes.length; i++) {
    let bb = 0;
    let j = 0;
    for (; j < 8; j++) {
      if (booleans.length <= 8 * i + j) {
        break;
      }
      bb = bb * 2 + booleans[8 * i + j];
    }
    boolRes[i] = bb;
  }

  // fill rest of the word byte
  if (words.length % 2) {
    words.push(0);
  }
  let wordRes = new Uint8Array(Math.ceil(words.length / 2));
  for (let i = 0; i < words.length; i++) {
    let wb = 0;
    for (let j = 0; j < 2; j++) {
      if (words.length <= 2 * i + j) {
        break;
      }
      wb = wb * 256 + words[2 * i + j];
    }
    wordRes[i] = wb;
  }
  let intRes = new Uint32Array(integers);
  let doubleRes = new Float32Array(doubles);
  let stringsBytes = [];
  strings.forEach((s) => {
    s ??= "null";
    s = transformNonstandard(s);
    let l = Math.min(s.length, 256);
    stringsBytes.push(l);
    for (let i = 0; i < l; i++) {
      stringsBytes.push(s.charCodeAt(i) & 0xff);
    }
  });
  let stringsRes = new Uint8Array(stringsBytes);

  let lengths = new Uint8Array([boolRes.length, wordRes.length, intRes.length, doubleRes.length, stringsRes.length]);
  let totalBuffer = concatBuffers([lengths, boolRes, wordRes, intRes, doubleRes, stringsRes]);
  let res = arrayBufferToBase64(totalBuffer);
  return res.replaceAll("+", ".").replaceAll("/", "_").replaceAll("=", "-");
}

function concatBuffers(arrays) {
  let resultSize = arrays.reduce((sum, a) => sum + a.byteLength, 0);
  let result = new Uint8Array(resultSize);
  let pointer = 0;
  arrays.forEach((array) => {
    result.set(new Uint8Array(array.buffer), pointer);
    pointer += array.byteLength;
  });
  return result.buffer;
}

// source: https://www.isummation.com/blog/convert-arraybuffer-to-base64-string-and-vice-versa/
function arrayBufferToBase64(buffer) {
  var binary = "";
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function arrayBufferToUtf16(buffer) {
  return buffer.toString("utf16le");
}

function transformNonstandard(input) {
  return input.replaceAll("²", "^2").replaceAll("π", ".pi").replaceAll("°", ".deg").replaceAll("√", ".sqrt");
}

/**
 * Decodes object from a schema used to repopulate it's fields
 * @param {(String | {t: "b" | "w" | "i" | "d" | "s", n: String})[]} schema Schema to use
 * @param {String} input
 * @param {T} object Optional object to write result into. Default is new empty object
 * @returns {T}
 */
export function desypher(schema, input, object = {}) {
  input = input.replaceAll(".", "+");
  input = input.replaceAll("_", "/");
  input = input.replaceAll("-", "=");
  let buffer = base64ToArrayBuffer(input);
  let offset = 0;
  let lengths = new Uint8Array(buffer, offset, 5);
  offset += 5 * lengths.BYTES_PER_ELEMENT;
  let boolLength = lengths[0];
  let boolsArray = new Uint8Array(buffer, offset, boolLength);
  offset += boolsArray.byteLength;
  let booleans = [];
  boolsArray.forEach((e) => {
    let bb = [];
    for (let i = 0; i < 8; i++) {
      bb.push(e % 2 ? true : false);
      e = Math.floor(e / 2);
    }
    bb.reverse();
    booleans = booleans.concat(bb);
  });
  booleans.reverse();

  let wordLength = lengths[1];
  let wordsArray = new Uint8Array(buffer, offset, wordLength);
  offset += wordsArray.byteLength;
  let words = [];
  wordsArray.forEach((e) => {
    let wb = [];
    for (let i = 0; i < 2; i++) {
      wb.push(e % 0x10);
      e = Math.floor(e / 0x10);
    }
    wb.reverse();
    words = words.concat(wb);
  });
  words.reverse();

  let intLength = lengths[2];
  let intsArray = new Uint32Array(buffer.slice(offset), 0, intLength);
  offset += intsArray.byteLength;
  let integers = Array.from(intsArray);
  integers.reverse();

  let doubleLength = lengths[3];
  let doublesArray = new Float32Array(buffer.slice(offset), 0, doubleLength);
  offset += doublesArray.byteLength;
  let doubles = Array.from(doublesArray);
  doubles.reverse();

  let stringLength = lengths[4];
  let stringsArray = new Uint8Array(buffer, offset, stringLength);
  offset += stringLength * stringsArray.BYTES_PER_ELEMENT;
  let strings = [];
  let p = 0;
  while (p < stringLength) {
    let length = stringsArray[p];
    p++;
    let chars = [];
    for (let i = 0; i < length; i++) {
      chars.push(String.fromCharCode(stringsArray[p + i]));
    }
    strings.push(chars.join(""));
    p += length;
  }
  strings.reverse();

  let stack = [];
  let current = object;
  schema.forEach((directive) => {
    if (typeof directive === "string") {
      // that's a navigation directive
      if (directive === "__") {
        current = stack.pop();
      } else {
        stack.push(current);
        current[directive] = {};
        current = current[directive];
      }
    } else {
      // write directive
      let val = undefined;
      switch (directive.t) {
        case "b":
          val = booleans.pop();
          break;
        case "w":
          val = words.pop();
          break;
        case "i":
          val = integers.pop();
          break;
        case "d":
          val = doubles.pop();
          break;
        case "s":
          val = detransformNonstandard(strings.pop());
          break;
      }
      current[directive.n] = val;
    }
  });
  return object;
}

// source: https://www.isummation.com/blog/convert-arraybuffer-to-base64-string-and-vice-versa/
function base64ToArrayBuffer(base64) {
  var binary_string = window.atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

function utf16ToArrayBuffer(utf16) {
  return Buffer.from(utf16, "utf16le"); // buffer is not a thing without node :(
}

function detransformNonstandard(input) {
  return input.replaceAll("^2", "²").replaceAll(".pi", "π").replaceAll(".deg", "°").replaceAll(".sqrt", "√");
}

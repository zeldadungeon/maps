/* eslint-disable */

/*
 ** STRINGIFY FUNCTION MODIFIED FROM https://github.com/lydell/json-stringify-pretty-compact
 */

// Note: This regex matches even invalid JSON strings, but since we’re
// working on the output of `JSON.stringify` we know that only valid strings
// are present (unless the user supplied a weird `options.indent` but in
// that case we don’t care since the output would be invalid anyway).
const stringOrChar = /("(?:[^\\"]|\\.)*")|[:,]/g;

function stringify(passedObj, options = {}) {
  const indent = JSON.stringify(
    [1],
    undefined,
    options.indent === undefined ? 2 : options.indent
  ).slice(2, -3);

  let { replacer, keepToOneLine } = options;

  return (function _stringify(key, arrayKey, obj, currentIndent) {
    if (obj && typeof obj.toJSON === "function") {
      obj = obj.toJSON();
    }

    const string = JSON.stringify(obj, replacer);

    if (string === undefined) {
      return string;
    }

    if (keepToOneLine(key, arrayKey, obj)) {
      const prettified = string.replace(
        stringOrChar,
        (match, stringLiteral) => {
          return stringLiteral || `${match} `;
        }
      );
      return prettified;
    }

    if (replacer != null) {
      obj = JSON.parse(string);
      replacer = undefined;
    }

    if (typeof obj === "object" && obj !== null) {
      const nextIndent = currentIndent + indent;
      const items = [];
      let index = 0;
      let start;
      let end;

      if (Array.isArray(obj)) {
        start = "[";
        end = "]";
        const { length } = obj;
        for (; index < length; index++) {
          items.push(_stringify(index, key, obj[index], nextIndent) || "null");
        }
      } else {
        start = "{";
        end = "}";
        const keys = Object.keys(obj);
        const { length } = keys;
        for (; index < length; index++) {
          const key = keys[index];
          const keyPart = `${JSON.stringify(key)}: `;
          const value = _stringify(key, undefined, obj[key], nextIndent);
          if (value !== undefined) {
            items.push(keyPart + value);
          }
        }
      }

      if (items.length > 0) {
        return [start, indent + items.join(`,\n${nextIndent}`), end].join(
          `\n${currentIndent}`
        );
      }
    }

    return string;
  })(undefined, undefined, passedObj, "");
}

/*
 ** MAIN
 ** INVOKE FROM ROOT OF REPO AS `node tools/format-totk-public-json.js`
 */
const fs = require("fs");

function formatFile(file, keepToOneLine) {
  const obj = JSON.parse(fs.readFileSync(file));

  const formatted = stringify(obj, {
    indent: 4,
    keepToOneLine,
  });

  fs.writeFileSync(file, formatted);
}

const LOCATIONS_FILES = [
  "public/totk/markers/depths/locations.json",
  "public/totk/markers/sky/locations.json",
  "public/totk/markers/surface/locations.json",
];

const MATERIALS_FILES = [
  "public/totk/markers/depths/materials.json",
  "public/totk/markers/sky/materials.json",
  "public/totk/markers/surface/materials.json",
];

function main() {
  for (const file of LOCATIONS_FILES) {
    formatFile(file, (key, arrayKey, value) => {
      return value.coords || value.url;
    });
  }
  for (const file of MATERIALS_FILES) {
    formatFile(file, (key, arrayKey, value) => {
      return !!value.markerCoords;
    });
  }
}

main();

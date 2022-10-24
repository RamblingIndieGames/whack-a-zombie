const fs = require("fs/promises");
const path = require("path");

async function main() {
  // node bmfont2json <input.fnt>
  const inputFilename = process.argv.slice(2)[0];
  if (!inputFilename) {
    console.log("Missing required input filename");
    console.log("Usage: node bmfont2json.js input-filename.fnt");
    return;
  }

  const inputPath = path.resolve(inputFilename);

  const inputFileContent = await fs.readFile(inputPath, {
    encoding: "utf-8",
  });

  const inputLines = inputFileContent.split("\n").filter(Boolean);

  const font = {};

  for (const line of inputLines) {
    if (line.startsWith("info ")) {
      font.info = getPropertiesFromLine(line);
    } else if (line.startsWith("common ")) {
      font.common = getPropertiesFromLine(line);
    } else if (line.startsWith("page ")) {
      if (!("page" in font)) {
        font.page = {};
      }
      const props = getPropertiesFromLine(line);
      font.page[props.id] = props.file;
    } else if (line.startsWith("chars ")) {
      font.charCount = getPropertiesFromLine(line).count;
    } else if (line.startsWith("char ")) {
      if (!("chars" in font)) {
        font.chars = [];
      }
      font.chars.push(getPropertiesFromLine(line));
    } else if (line.startsWith("kernings ")) {
      font.kerningCount = getPropertiesFromLine(line).count;
    } else if (line.startsWith("kerning ")) {
      if (!("kernings" in font)) {
        font.kernings = [];
      }
      font.kernings.push(getPropertiesFromLine(line));
    }
  }

  console.log(JSON.stringify(font));
}

function getPropertiesFromLine(line) {
  const properties = {};
  const pairings = line.match(/(?:[^\s"]+|"[^"]*")+/g);
  pairings.shift();
  for (const pairing of pairings) {
    const [k, v] = pairing.split("=");
    let maybeNum = Number(v);
    if (isNaN(maybeNum)) {
      if (v.includes(",")) {
        const vList = v.split(",").map((x) => Number(x));
        properties[k] = vList;
      } else {
        properties[k] = v.replace(/\"/g, "").replace(/\'/g, "");
      }
    } else {
      properties[k] = maybeNum;
    }
  }
  return properties;
}

main().catch((err) => {
  console.log(err.message);
  process.exit(1);
});

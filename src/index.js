// Imports
// Constant Declarations
// Class Types
const Rect = {
  symbol: Symbol("Rect"),
  create(x, y, width, height) {
    const rect = {
      x,
      y,
      width,
      height,
      get symbol() {
        return Rect.symbol;
      },
    };
    return rect;
  },
  isRect(rect) {
    return rect.symbol === Rect.symbol;
  },
};

const Texture = {
  symbol: Symbol("Texture"),
  create(width, height, pixels, image) {
    const textureId = createUniqueId();
    const texture = {
      get symbol() {
        return Texture.symbol;
      },
      get id() {
        return textureId;
      },
      get width() {
        return width;
      },
      get height() {
        return height;
      },
      get pixels() {
        return pixels;
      },
      get image() {
        return image;
      },
    };
    return texture;
  },
  isTexture(texture) {
    return texture.symbol === Texture.symbol;
  },
};
// Instance Creation Functions
function createRect(
  { x, y, width, height } = { x: 0, y: 0, width: 0, height: 0 },
) {
  assert(typeof x !== "number", "x must be a Number");
  assert(typeof y !== "number", "y must be a Number");
  assert(typeof width !== "number", "width must be a Number");
  assert(typeof height !== "number", "height must be a Number");
  const instance = Rect.create(x, y, width, height);
  return instance;
}

function createTexture({ width, height, pixels, image }) {
  assert(typeof width !== "number", "width must be a Number");
  assert(typeof height !== "number", "height must be a Number");
  assert(
    !(pixels instanceof Uint8ClampedArray),
    "pixels must be a Uint8ClampedArray",
  );
  assert(
    !(image instanceof HTMLImageElement),
    "image must be an HTMLImageElement",
  );
  const instance = Texture.create(width, height, pixels, image);
  return instance;
}
// Libraries
// Global State
// Global Functions
function assert(condition, message) {
  if (condition) {
    throw new Error(message);
  }
}
// Entry Point Function
async function main() {
  console.log("Whack A Zombie - Starting");
}
// Entry Point Call
main().catch((err) => {
  console.error(err.message);
  alert(err.message);
});

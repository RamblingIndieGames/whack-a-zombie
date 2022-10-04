// Imports
// Constant Declarations
const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;

const NODE_TYPES = {
  RenderNode: "RenderNode",
  UINode: "UINode",
};

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

const ColorFillRenderNode = {
  symbol: Symbol("ColorFillRenderNode"),
  create(rect, color) {
    const nodeId = createUniqueId();
    let fillColor = color;
    const renderNode = {
      get symbol() {
        return ColorFillRenderNode.symbol;
      },
      get id() {
        return nodeId;
      },
      get type() {
        return NODE_TYPES.RenderNode;
      },
      get subtype() {
        return "ColorFill";
      },
      get rect() {
        return rect;
      },
      get color() {
        return fillColor;
      },
      set color(newColor) {
        fillColor = newColor;
      },
      render() {
        console.log("ColorFillRenderNode.render", { rect, color });
      },
    };
    return renderNode;
  },
  isColorFillRenderNode(node) {
    return node.symbol === ColorFillRenderNode.symbol;
  },
};

const ImageRenderNode = {
  symbol: Symbol("ImageRenderNode"),
  create(rect, texture) {
    const nodeId = createUniqueId();
    const renderNode = {
      // visible: true,
      get symbol() {
        return ImageRenderNode.symbol;
      },
      get id() {
        return nodeId;
      },
      get type() {
        return NODE_TYPES.RenderNode;
      },
      get subtype() {
        return "Image";
      },
      get rect() {
        return rect;
      },
      get texture() {
        return texture;
      },
      render() {
        console.log("ImageRenderNode.render", { rect, texture });
      },
    };
    return renderNode;
  },
  isImageRenderNode(node) {
    return node.symbol === ImageRenderNode.symbol;
  },
};

const ClickableUINode = {
  symbol: Symbol("ClickableUINode"),
  create(rect, onClick) {
    const nodeId = createUniqueId();
    const uiNode = {
      get symbol() {
        return ClickableUINode.symbol;
      },
      get id() {
        return nodeId;
      },
      get type() {
        return NODE_TYPES.UINode;
      },
      get subtype() {
        return "Clickable";
      },
      get rect() {
        return rect;
      },
      render() {
        console.log("ClickableUINode.render", { rect });
      },
      update() {
        // console.log("ClickableUINode.update", { rect });
      },
    };
    return uiNode;
  },
  isClickableUINode(node) {
    return node.symbol === ClickableUINode.symbol;
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

function createColorFillRenderNode({ rect, color }) {
  assert(!Rect.isRect(rect), "rect must be a Rect");
  assert(typeof color !== "string", "color must be a string");
  const instance = ColorFillRenderNode.create(rect, color);
  return instance;
}

function createImageRenderNode({ rect, texture }) {
  assert(!Rect.isRect(rect), "rect must be a Rect");
  assert(!Texture.isTexture(texture), "texture must be a Texture");
  const instance = ImageRenderNode.create(rect, texture);
  return instance;
}

function createClickableUINode({ rect, onClick }) {
  assert(!Rect.isRect(rect), "rect must be a Rect");
  assert(typeof onClick !== "function", "onClick must be a Function");
  const instance = ClickableUINode.create(rect, onClick);
  return instance;
}

// Libraries
// Global State

const content = {
  textures: {},
};

// Global Functions
function assert(condition, message) {
  if (condition) {
    throw new Error(message);
  }
}

function addTextureToContent(texture) {
  const textureName = texture.image.dataset.name;
  content.textures[textureName] = texture;
}

function removeTextureFromContent(textureName) {
  delete content.textures[textureName];
}

function getTextureFromContent(textureName) {
  return textureName in content.textures
    ? content.textures[textureName]
    : null;
}

function createUniqueId() {
  if (createUniqueId._value === undefined) {
    createUniqueId._value = 1;
    createUniqueId._next = () => {
      const v0 = createUniqueId._value++;
      const v1 = v0 << 24;
      const v2 = v1 + ~~(Math.random() * 0xffffff);
      const v3 = ~~(Math.random() * 0xffffff);
      const v4 = v3 >> 16;
      const v5 = [v3, v4, v2]
        .map((value) => {
          const hex = value.toString(16);
          return `00000000${hex}`.slice(-8);
        })
        .join("1");
      return v5.match(/.{1,6}/g).join("");
    };
  }
  return createUniqueId._next();
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

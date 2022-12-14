// Imports
// Constant Declarations
const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;

const DEFAULT_NODE_PRIORITY = 0;
const DEFAULT_NODE_LAYER = 0;

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
      containsPoint(x, y) {
        return !(
          x < rect.x ||
          x > rect.x + rect.width ||
          y < rect.y ||
          y > rect.y + rect.height
        );
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
      visible: true,
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
      visible: true,
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
    let didClick = false;
    const uiNode = {
      enabled: true,
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
        if (uiNode.rect.containsPoint(state.mouseX, state.mouseY)) {
          if (state.mouseButton && !didClick) {
            didClick = true;
          } else if (!state.mouseButton && didClick) {
            didClick = false;
            onClick();
          }
        }
        // console.log("ClickableUINode.update", { rect });
      },
    };
    return uiNode;
  },
  isClickableUINode(node) {
    return node.symbol === ClickableUINode.symbol;
  },
};

const DoubleBufferedCanvasRenderer = {
  symbol: Symbol("DoubleBufferedCanvasRenderer"),
  create(width, height) {
    const primaryCanvas = document.createElement("canvas");
    const secondaryCanvas = document.createElement("canvas");
    primaryCanvas.width = width;
    primaryCanvas.height = height;
    secondaryCanvas.width = width;
    secondaryCanvas.height = height;
    const primaryContext2D = primaryCanvas.getContext("2d");
    const secondaryContext2D = secondaryCanvas.getContext("2d");
    const renderer = {
      get symbol() {
        return DoubleBufferedCanvasRenderer.symbol;
      },
      get primaryCanvas() {
        return primaryCanvas;
      },
      get secondaryCanvas() {
        return secondaryCanvas;
      },
      get width() {
        return width;
      },
      get height() {
        return height;
      },
      get context() {
        return secondaryContext2D;
      },
      prepare(color) {
        if (color) {
          assert(typeof color !== "string", "color must be a String");
          secondaryContext2D.fillStyle = color;
          secondaryContext2D.fillRect(0, 0, width, height);
          return;
        }
        secondaryContext2D.clearRect(0, 0, width, height);
      },
      render(renderNodes) {
        renderer.prepare();
        const drawBatches = batchRenderNodes(renderNodes);
        while (drawBatches.length > 0) {
          const nextBatch = drawBatches.shift();
          if (nextBatch) {
            const batchLength = nextBatch.input.length;
            for (let i = 0; i < batchLength; i++) {
              const renderNode = nextBatch.input[i];
              DoubleBufferedCanvasRenderer.render(
                renderNode,
                renderer,
              );
            }
          }
        }
        renderer.present();
      },
      present() {
        primaryContext2D.clearRect(0, 0, width, height);
        primaryContext2D.drawImage(secondaryCanvas, 0, 0);
      },
    };
    return renderer;
  },
  isDoubleBufferedCanvasRenderer(renderer) {
    return renderer.symbol === DoubleBufferedCanvasRenderer.symbol;
  },
  render(renderNode, renderer) {
    const renderingMethod =
      DoubleBufferedCanvasRenderer.renderers[renderNode.symbol];
    assert(
      typeof renderingMethod !== "function",
      `Unable to render node:${renderNode.id} of type ${renderNode.type}${renderNode.subtype}`,
    );
    renderingMethod(renderNode, renderer);
  },
  renderers: {
    [ImageRenderNode.symbol](renderNode, renderer) {
      const { rect, texture } = renderNode;
      renderer.context.drawImage(
        texture.image,
        0,
        0,
        texture.width,
        texture.height,
        rect.x,
        rect.y,
        rect.width,
        rect.height,
      );
    },
    [ColorFillRenderNode.symbol](renderNode, renderer) {
      const { rect, color } = renderNode;
      renderer.context.fillStyle = color;
      renderer.context.fillRect(
        rect.x,
        rect.y,
        rect.width,
        rect.height,
      );
    },
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

function createColorFillRenderNode({ rect, color, ...other }) {
  assert(!Rect.isRect(rect), "rect must be a Rect");
  assert(typeof color !== "string", "color must be a string");
  const instance = ColorFillRenderNode.create(rect, color);
  Object.assign(instance, other);
  return instance;
}

function createImageRenderNode({ rect, texture, ...other }) {
  assert(!Rect.isRect(rect), "rect must be a Rect");
  assert(!Texture.isTexture(texture), "texture must be a Texture");
  const instance = ImageRenderNode.create(rect, texture);
  Object.assign(instance, other);
  return instance;
}

function createClickableUINode({ rect, onClick, ...other }) {
  assert(!Rect.isRect(rect), "rect must be a Rect");
  assert(typeof onClick !== "function", "onClick must be a Function");
  const instance = ClickableUINode.create(rect, onClick);
  Object.assign(instance, other);
  return instance;
}

function createDoubleBufferedCanvasRenderer({ width, height }) {
  assert(typeof width !== "number", "width must be a Number");
  assert(typeof height !== "number", "height must be a Number");
  const instance = DoubleBufferedCanvasRenderer.create(width, height);
  return instance;
}

// Libraries

// Global State
const state = {
  scene: [],
  enteringScene: [],
  exitingScene: [],
  lastTime: new Date().getTime(),
  elapsedTime: 0,
  deltaTime: 0,
  mouseX: 0,
  mouseY: 0,
  mouseButton: false,
};

const content = {
  textures: {},
};

const cache = {};

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

function addToScene(data, { priority = 0, layer = 0 } = {}) {
  const sceneNodeId = createUniqueId();
  const sceneData = { ...data };
  if (sceneData.id) {
    sceneData._dataId = sceneData.id;
    delete sceneData.id;
  }
  const sceneNode = {
    get id() {
      return sceneNodeId;
    },
    ...sceneData,
    priority,
    layer,
  };
  state.enteringScene.push(sceneNode);
  return sceneNode;
}

function removeFromScene(id) {
  const sceneNode = state.scene.find((node) => node.id === id);
  if (sceneNode) {
    state.exitingScene.push(sceneNode);
  }
}

function clearExitingSceneNodesFromScene() {
  const exitingSceneNodeIds = state.exitingScene.reduce(
    (ids, sceneNode) => [...ids, sceneNode.id],
    [],
  );
  state.scene = state.scene.filter(
    (sceneNode) => !exitingSceneNodeIds.includes(sceneNode.id),
  );
  state.exitingScene = [];
}

function addEnteringSceneNodesToScene() {
  state.scene = [...state.scene, ...state.enteringScene];
  state.enteringScene = [];
}

function synchronizeScene() {
  clearExitingSceneNodesFromScene();
  addEnteringSceneNodesToScene();
}

function sortByProperty(property, defaultPropertyValue) {
  return function sortByUserDefinedProperty(a, b) {
    const aValue = a[property] || defaultPropertyValue;
    const bValue = b[property] || defaultPropertyValue;
    return aValue - bValue;
  };
}

function sortNodes(nodes, comparator) {
  assert(!Array.isArray(nodes), "nodes must be an Array");
  assert(
    typeof comparator !== "function",
    "comparator must be a Function",
  );
  nodes.sort(comparator);
  return nodes;
}

function setCacheValueIfNotSetElseGetCachedValue(
  cacheKey,
  cacheValue,
) {
  if (!(cacheKey in cache)) {
    cache[cacheKey] = cacheValue;
  }
  return cache[cacheKey];
}

function sortSceneNodesByPriority(sceneNodes) {
  if (sceneNodes === undefined) {
    sceneNodes = state.scene;
  }
  assert(!Array.isArray(sceneNodes), "sceneNodes must be an Array");
  return sortNodes(
    sceneNodes,
    setCacheValueIfNotSetElseGetCachedValue(
      "sortByPriorityProperty",
      sortByProperty("priority", DEFAULT_NODE_PRIORITY),
    ),
  );
}

function sortSceneNodesByLayer(sceneNodes) {
  if (sceneNodes === undefined) {
    sceneNodes = state.scene;
  }
  assert(!Array.isArray(sceneNodes), "sceneNodes must be an Array");
  return sortNodes(
    sceneNodes,
    setCacheValueIfNotSetElseGetCachedValue(
      "sortByLayerProperty",
      sortByProperty("layer", DEFAULT_NODE_LAYER),
    ),
  );
}

function methodOfSceneNodeOrNoop(methodName, sceneNode) {
  return methodName in sceneNode &&
    typeof sceneNode[methodName] === "function"
    ? sceneNode[methodName]
    : () => {};
}

function callMethodForEachSceneNode(methodName, sceneNodes) {
  const count = sceneNodes.length;
  for (let i = 0; i < count; i++) {
    const sceneNode = sceneNodes[i];
    const methodImplementation = methodOfSceneNodeOrNoop(
      methodName,
      sceneNode,
    );
    methodImplementation();
  }
}

function getEnabledSceneNodes() {
  return state.scene.filter((sceneNode) =>
    "enabled" in sceneNode ? Boolean(sceneNode.enabled) : true,
  );
}

function getVisibleSceneNodes() {
  return state.scene.filter((sceneNode) =>
    "visible" in sceneNode ? Boolean(sceneNode.visible) : false,
  );
}

function updateEnabledSceneNodes() {
  callMethodForEachSceneNode(
    "update",
    sortSceneNodesByPriority(getEnabledSceneNodes()),
  );
}

function renderScene() {
  state.renderer.render(
    sortSceneNodesByLayer(getVisibleSceneNodes()),
  );
}

function processScene() {
  synchronizeScene();
  updateEnabledSceneNodes();
}

function processGameTime() {
  const currentTime = new Date().getTime();
  state.deltaTime = (currentTime - state.lastTime) * 0.001;
  state.elapsedTime += state.deltaTime;
  state.lastTime = currentTime;
}

function mainLoop() {
  processGameTime();
  processScene();
  renderScene();

  // TODO: uncomment this after the renderer is implemented
  // for now, just log the state for inspecting that things are working
  // console.log({ state });
  window.requestAnimationFrame(mainLoop);
}

function getImageDataFromImage(image) {
  const temporaryCanvas = document.createElement("canvas");
  temporaryCanvas.width = image.naturalWidth;
  temporaryCanvas.height = image.naturalHeight;
  const temporaryCanvasContext = temporaryCanvas.getContext("2d");
  temporaryCanvasContext.drawImage(image, 0, 0);
  const imageData = temporaryCanvasContext.getImageData(
    0,
    0,
    temporaryCanvas.width,
    temporaryCanvas.height,
  );
  return imageData;
}

function createTextureFromImage(image) {
  const textureWidth = image.naturalWidth;
  const textureHeight = image.naturalHeight;
  const textureImageData = getImageDataFromImage(image);
  const texturePixels = textureImageData.data;
  const texture = createTexture({
    width: textureWidth,
    height: textureHeight,
    pixels: texturePixels,
    image,
  });
  return texture;
}

async function loadTexture({ name, source }) {
  console.log("loadTexture", name, source);
  try {
    const texture = await new Promise((resolve, reject) => {
      const image = new Image();
      image.dataset.name = name;
      image.onerror = (err) => {
        reject(new Error(err.message));
      };
      image.onload = () => {
        const texture = createTextureFromImage(image);
        resolve(texture);
      };
      image.src = source;
    });
    return texture;
  } catch (err) {
    throw new Error(
      `loadTexture: Unable to load texture "${name}" from "${source}": ${err.message}`,
    );
  }
}

function groupRenderNodesByLayer(renderNodes) {
  const nodesByLayer = {};
  const nodeCount = renderNodes.length;
  for (let i = 0; i < nodeCount; i++) {
    const renderNode = renderNodes[i];
    const renderNodeLayer = renderNode.layer || DEFAULT_NODE_LAYER;
    if (!(renderNodeLayer in nodesByLayer)) {
      nodesByLayer[renderNodeLayer] = [];
    }
    nodesByLayer[renderNodeLayer].push(renderNode);
  }
  return nodesByLayer;
}

function batchRenderNodes(renderNodes) {
  /*
    input: list of render nodes

    [
      rendernode: image      layer 1,
      rendernode: colorfill  layer 0,
      rendernode: image      layer 1,
      rendernode: image      layer 1,
      rendernode: colorfill  layer 2,
    ]

    output:

    drawBatches = [
      { batchIndex: 0, renderIndex: 0, input: [colorfill layer 0] },
      { batchIndex: 1, renderIndex: 1, input: [image layer 1, image layer 1, image layer 1,] },
      { batchIndex: 2, renderIndex: 4, input: [colorfill layer 2] },
    ]

  */
  let renderIndex = 0;
  const nodesByLayer = groupRenderNodesByLayer(renderNodes);
  return Object.keys(nodesByLayer).reduce(
    (drawBatches, renderNodeLayer) => {
      const input = nodesByLayer[renderNodeLayer];
      const batch = {
        batchIndex: drawBatches.length,
        renderIndex: renderIndex + input.length,
        input,
      };
      return [...drawBatches, batch];
    },
    [],
  );
}

async function setupRenderer() {
  const renderer = createDoubleBufferedCanvasRenderer({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  });
  state.renderer = renderer;
  document.getElementById("game").appendChild(renderer.primaryCanvas);
}

function getMouseCoordinateFromMouseEvent(mouseEvent) {
  const boundingRect =
    state.renderer.primaryCanvas.getBoundingClientRect();
  return {
    x: mouseEvent.clientX - boundingRect.left,
    y: mouseEvent.clientY - boundingRect.top,
  };
}

async function setupMouse() {
  const mouseTarget = state.renderer.primaryCanvas;
  mouseTarget.addEventListener(
    "mousedown",
    (mouseEvent) => {
      state.mouseButton = true;
    },
    false,
  );
  mouseTarget.addEventListener(
    "mouseup",
    (mouseEvent) => {
      state.mouseButton = false;
    },
    false,
  );
  mouseTarget.addEventListener(
    "mousemove",
    (mouseEvent) => {
      const { x, y } = getMouseCoordinateFromMouseEvent(mouseEvent);
      state.mouseX = x;
      state.mouseY = y;
    },
    false,
  );
}

async function setupSplashScene() {
  console.log("setup splash scene");
  const splashBackgroundTexture = await loadTexture({
    name: "splash-background",
    source: "content/textures/splash-background.png",
  });

  addTextureToContent(splashBackgroundTexture);

  const backgroundColor = "#369";
  const backgroundColorFillSceneNode = addToScene(
    createColorFillRenderNode({
      rect: createRect({
        x: 0,
        y: 0,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
      }),
      color: backgroundColor,
    }),
  );

  const backgroundImageSceneNode = addToScene(
    createImageRenderNode({
      layer: 1,
      rect: createRect({
        x: 16,
        y: 16,
        width: SCREEN_WIDTH - 32,
        height: SCREEN_HEIGHT - 32,
      }),
      texture: getTextureFromContent("splash-background"),
    }),
  );

  const clickableSceneNode = addToScene(
    createClickableUINode({
      rect: createRect({
        x: 0,
        y: 0,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
      }),
      async onClick() {
        removeFromScene(clickableSceneNode.id);
        removeFromScene(backgroundImageSceneNode.id);
        removeFromScene(backgroundColorFillSceneNode.id);
        removeTextureFromContent("splash-background");
        await setupTitleScene();
      },
    }),
  );
}

async function setupTitleScene() {
  console.log("setup title scene");
  const titleBackgroundTexture = await loadTexture({
    name: "title-background",
    source: "content/textures/title-background.png",
  });

  addTextureToContent(titleBackgroundTexture);

  const backgroundImageSceneNode = addToScene(
    createImageRenderNode({
      layer: 0,
      rect: createRect({
        x: 0,
        y: 0,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
      }),
      texture: getTextureFromContent("title-background"),
    }),
  );

  async function onPlayButtonClick() {
    removeFromScene(backgroundImageSceneNode.id);
    removeTextureFromContent("title-background");
    await setupPlayScene();
  }

  // TODO - implement ButtonUINode class type for Play Button
}

async function setupPlayScene() {
  // TODO: initialize gameplay state
  console.log("TODO - setup play scene");
}

// Entry Point Function
async function main() {
  console.log("Whack A Zombie - Starting");
  await setupRenderer();
  await setupMouse();
  await setupSplashScene();
  mainLoop();
}

// Entry Point Call
main().catch((err) => {
  console.error(err.message);
  alert(err.message);
});

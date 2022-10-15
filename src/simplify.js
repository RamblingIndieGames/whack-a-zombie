const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;

const CONTENT_MANIFEST = {
  textures: {
    splashBackground: "content/textures/splash-background.png",
    titleBackground: "content/textures/title-background.png",
  },
};

const SCENES = {
  SPLASH_SCENE: Symbol("SPLASH_SCENE"),
  TITLE_SCENE: Symbol("TITLE_SCENE"),
  PLAY_SCENE: Symbol("PLAY_SCENE"),
};

// splash scene

const SplashScene = {
  // state that is local to the scene
  state: {
    // tracks if the mouse has been pressed during the last frame and released during the current frame
    didClick: false,
  },
  // called once when the engine transitions to this scene
  didEnter(system) {
    console.log({ system });
  },
  // called once when the engine transitions away from this scene
  didExit(system) {
    // set local state to null to free the memory usage of the local state
    SplashScene.state = null;
  },
  // called every frame of the engine main loop
  didUpdate(system) {
    // clear the scene to a nice blue background color
    system.ctx.fillStyle = "#369";
    system.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    // draw the splash scene background image
    system.ctx.drawImage(
      system.content.textures.splashBackground,
      16,
      16,
      SCREEN_WIDTH - 32,
      SCREEN_HEIGHT - 32,
    );
    // check for a mouse press and release
    // when the mouse is released, switch the scene to the title scene
    if (system.input.mouseDown && !SplashScene.state.didClick) {
      SplashScene.state.didClick = true;
    } else if (
      !system.input.mouseDown &&
      SplashScene.state.didClick
    ) {
      SplashScene.state.didClick = false;
      system.switchScene(SCENES.TITLE_SCENE);
    }
  },
};

// title scene

const TitleScene = {
  // state that is local to the scene
  state: {
    // tracks if the mouse has been pressed during the last frame and released during the current frame
    didClick: false,
  },
  // called once when the engine transitions to this scene
  didEnter(system) {},
  // called once when the engine transitions away from this scene
  didExit(system) {
    // set local state to null to free the memory usage of the local state
    TitleScene.state = null;
  },
  // called every frame of the engine main loop
  didUpdate(system) {
    // draw the title scene background image
    system.ctx.drawImage(
      system.content.textures.titleBackground,
      0,
      0,
    );
    // check for a mouse press and release
    // when the mouse is released, switch the scene to the play scene
    if (system.input.mouseDown && !TitleScene.state.didClick) {
      TitleScene.state.didClick = true;
    } else if (!system.input.mouseDown && TitleScene.state.didClick) {
      TitleScene.state.didClick = false;
      system.switchScene(SCENES.PLAY_SCENE);
    }
  },
};

// play scene

const GRAVE_ROW_COUNT = 3;
const GRAVE_COLUMN_COUNT = 4;
const GRAVE_COUNT = GRAVE_ROW_COUNT * GRAVE_COLUMN_COUNT;
const GRAVE_STATE = {
  EMPTY: 0,
  ZOMBIE_NORMAL: 1,
  ZOMBIE_DYING: 2,
};

/*
  screen width is 800
  there are 4 graves across
  we want 32 pixels of padding from the left and right side of the screen
  for the graveyard area, so subtract 64 from 800 to get 736
  divide by 4 to find the width of a grave grid cell
  screen height is 600
  there are 3 graves down

*/
const GRAVE_GRID_PADDING_X = 64;
const GRAVE_GRID_PADDING_Y = 64;
const GRAVE_GRID_CELL_WIDTH = Math.floor(
  (SCREEN_WIDTH - GRAVE_GRID_PADDING_X) / GRAVE_COLUMN_COUNT,
);

// const GRAVE_GRID_CELL_WIDTH = 184;
const GRAVE_GRID_CELL_HEIGHT = Math.floor(
  (SCREEN_HEIGHT - GRAVE_GRID_PADDING_Y) / GRAVE_ROW_COUNT,
);
// const GRAVE_GRID_CELL_HEIGHT = 179;
const GRAVE_GRID_OFFSET_X = GRAVE_GRID_PADDING_X / 2;
const GRAVE_GRID_OFFSET_Y = 64;
const GRAVE_WIDTH = GRAVE_GRID_CELL_WIDTH / 2;
const GRAVE_HEIGHT = GRAVE_GRID_CELL_HEIGHT * 0.75;
const GRAVE_GRID_RECT = {
  x: GRAVE_GRID_OFFSET_X,
  y: GRAVE_GRID_OFFSET_Y,
  width: GRAVE_GRID_CELL_WIDTH * GRAVE_COLUMN_COUNT,
  height: GRAVE_GRID_CELL_HEIGHT * GRAVE_ROW_COUNT,
};

const PlayScene = {
  // state that is local to the scene
  state: {
    /*
    each element in this array represents the state of the grave

    0 - empty grave (penalty to click here)
    1 - grave with zombie in normal state (click here to kill zombie)
    2 - grave with zombie in dying state (no penalty to click again)
    */
    graves: [],
    // tracks if the mouse has been pressed during the last frame and released during the current frame
    didClick: false,
    // tracks the coordinate of the mouse when the button is pressed down
    mouseX: 0,
    mouseY: 0,
  },
  // called once when the engine transitions to this scene
  didEnter(system) {
    PlayScene.state.time = 0;
    PlayScene.state.PLAY_TIME_SECONDS = 60;
    PlayScene.setupGraveyard(system);
  },
  // called once when the engine transitions away from this scene
  didExit(system) {
    // set local state to null to free the memory usage of the local state
    PlayScene.state = null;
  },
  // called every frame of the engine main loop
  didUpdate(system) {
    PlayScene.handleGraveyardLogic(system);

    PlayScene.state.time += system.deltaTime;
    system.ctx.font = "40px serif";

    PlayScene.drawGraveyard(system);
    PlayScene.state.time < PlayScene.state.PLAY_TIME_SECONDS
      ? system.ctx.fillText(
          Math.floor(
            PlayScene.state.PLAY_TIME_SECONDS - PlayScene.state.time,
          ),
          350,
          40,
        )
      : system.ctx.fillText("Time's Up", 350, 40);
  },

  setupGraveyard(system) {
    // set all graves as empty
    for (let i = 0; i < GRAVE_COUNT; i++) {
      PlayScene.state.graves[i] = GRAVE_STATE.ZOMBIE_NORMAL;
    }
  },

  handleGraveyardLogic(system) {
    const clickResult = PlayScene.checkForGraveClick(system);

    if (clickResult.isValidClick) {
      const collisionResult = PlayScene.findWhichGraveWasClicked(
        system,
        clickResult,
      );

      if (collisionResult.isValidCollision) {
        PlayScene.handleGraveClick(system, collisionResult);
      }
    }
  },

  drawGraveyard(system) {
    // clear the scene to a nice blue background color
    system.ctx.fillStyle = "#369";
    system.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // TODO - draw the graveyard background image

    // draw all the graves
    PlayScene.drawGraves(system);
  },

  drawGraves(system) {
    const xOffset = Math.floor(
      (GRAVE_GRID_CELL_WIDTH - GRAVE_WIDTH) / 2,
    );

    const yOffset = Math.floor(
      (GRAVE_GRID_CELL_HEIGHT - GRAVE_HEIGHT) / 2,
    );

    for (let i = 0; i < GRAVE_COUNT; i++) {
      const row = Math.floor(i / GRAVE_COLUMN_COUNT);
      const column = Math.floor(i % GRAVE_COLUMN_COUNT);
      const x =
        xOffset +
        GRAVE_GRID_OFFSET_X +
        GRAVE_GRID_CELL_WIDTH * column;
      const y =
        yOffset + GRAVE_GRID_OFFSET_Y + GRAVE_GRID_CELL_HEIGHT * row;
      const w = GRAVE_WIDTH;
      const h = GRAVE_HEIGHT;
      PlayScene.drawGrave(
        system,
        PlayScene.state.graves[i],
        x,
        y,
        w,
        h,
      );
    }
  },

  drawGrave(system, graveState, x, y, w, h) {
    switch (graveState) {
      case GRAVE_STATE.EMPTY:
        system.ctx.fillStyle = "#222";
        system.ctx.fillRect(x, y, w, h);
        break;
      case GRAVE_STATE.ZOMBIE_NORMAL:
        system.ctx.fillStyle = "#C00";
        system.ctx.fillRect(x, y, w, h);
        break;
      case GRAVE_STATE.ZOMBIE_DYING:
        system.ctx.fillStyle = "#800";
        system.ctx.fillRect(x, y, w, h);
        break;
    }
  },

  checkForGraveClick(system) {
    const result = {
      // be default the click is considered invalid
      isValidClick: false,
      x: 0,
      y: 0,
    };
    // check for a mouse press and release
    // when the mouse is released, switch the scene to the play scene
    if (system.input.mouseDown && !PlayScene.state.didClick) {
      PlayScene.state.didClick = true;
      // because the player could press in one coordinate and release in
      // another coordinate, we need to capture the coordinate of the
      // mouse when it is pressed down
      PlayScene.state.mouseX = system.input.mouseX;
      PlayScene.state.mouseY = system.input.mouseY;
    } else if (!system.input.mouseDown && PlayScene.state.didClick) {
      PlayScene.state.didClick = false;

      const mouseXWhenDown = PlayScene.state.mouseX;
      const mouseYWhenDown = PlayScene.state.mouseY;

      // only check for grave collision when mouse clicked inside of
      // the grave rect (encompasses all the graves)
      if (
        rectContainsPoint(
          mouseXWhenDown,
          mouseYWhenDown,
          GRAVE_GRID_RECT,
        )
      ) {
        result.isValidClick = true;
        result.x = mouseXWhenDown;
        result.y = mouseYWhenDown;
      }
    }

    return result;
  },

  findWhichGraveWasClicked(system, clickResult) {
    const result = {
      isValidCollision: false,
      graveIndex: -1,
      graveState: GRAVE_STATE.EMPTY,
    };

    const { x, y } = clickResult;

    const graveX = Math.floor(
      (x - GRAVE_GRID_OFFSET_X) / GRAVE_GRID_CELL_WIDTH,
    );

    const graveY = Math.floor(
      (y - GRAVE_GRID_OFFSET_Y) / GRAVE_GRID_CELL_HEIGHT,
    );

    const graveIndex = graveX + graveY * GRAVE_COLUMN_COUNT;
    const graveState = PlayScene.state.graves[graveIndex];

    if (graveState !== undefined) {
      result.isValidCollision = true;
      result.graveIndex = graveIndex;
      result.graveState = graveState;
    }

    return result;
  },

  handleGraveClick(system, collisionResult) {
    console.log("handle grave click", { collisionResult });
    if (collisionResult.graveState === GRAVE_STATE.ZOMBIE_NORMAL) {
      console.log("kill zombie at", collisionResult.graveIndex);
      PlayScene.state.graves[collisionResult.graveIndex] =
        GRAVE_STATE.ZOMBIE_DYING;
      setTimeout(() => {
        PlayScene.state.graves[collisionResult.graveIndex] =
          GRAVE_STATE.EMPTY;
      }, 450);
    } else if (collisionResult.graveState === GRAVE_STATE.EMPTY) {
      console.log("missed the zombies - took a hit to your health");
    }
  },
};

function registerScenes(system) {
  system.registerScene(SCENES.SPLASH_SCENE, SplashScene, true);
  system.registerScene(SCENES.TITLE_SCENE, TitleScene);
  system.registerScene(SCENES.PLAY_SCENE, PlayScene);
}

// engine internals

function rectContainsPoint(x, y, rect) {
  return !(
    x < rect.x ||
    x > rect.x + rect.width ||
    y < rect.y ||
    y > rect.y + rect.height
  );
}

function promiseImageLoad(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onerror = (err) => {
      reject(new Error(err.message));
    };
    image.onload = () => {
      resolve(image);
    };
    image.src = source;
  });
}

async function loadContent() {
  const textureNames = Object.keys(CONTENT_MANIFEST.textures);
  const textures = {};
  for (const nextTextureName of textureNames) {
    const source = CONTENT_MANIFEST.textures[nextTextureName];
    const texture = await promiseImageLoad(source);
    textures[nextTextureName] = texture;
  }
  const content = { textures };
  return content;
}

async function setup() {
  const canvas = document.createElement("canvas");
  canvas.width = SCREEN_WIDTH;
  canvas.height = SCREEN_HEIGHT;
  const ctx = canvas.getContext("2d");
  document.getElementById("game").appendChild(canvas);

  const input = {
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
  };

  function getMouseCoordinateFromMouseEvent(mouseEvent) {
    const boundingRect = canvas.getBoundingClientRect();
    return {
      x: mouseEvent.clientX - boundingRect.left,
      y: mouseEvent.clientY - boundingRect.top,
    };
  }

  canvas.addEventListener(
    "mousedown",
    (mouseEvent) => {
      input.mouseDown = true;
    },
    false,
  );

  canvas.addEventListener(
    "mouseup",
    (mouseEvent) => {
      input.mouseDown = false;
    },
    false,
  );

  canvas.addEventListener(
    "mousemove",
    (mouseEvent) => {
      const { x: mouseX, y: mouseY } =
        getMouseCoordinateFromMouseEvent(mouseEvent);
      input.mouseX = mouseX;
      input.mouseY = mouseY;
    },
    false,
  );

  return { canvas, ctx, input };
}

async function boot() {
  const content = await loadContent();
  const { canvas, ctx, input } = await setup();
  let lastTime = new Date().getTime();
  let elapsedTime = 0;
  let currentScene = null;
  let nextScene = null;
  const sceneRegistry = {};
  function registerScene(sceneId, scene, setCurrent) {
    sceneRegistry[sceneId] = scene;
    if (setCurrent) {
      currentScene = scene;
    }
  }
  let didRegisterScenes = false;
  const cache = {};
  function addToCache(key, value, overwrite) {
    if (key in cache) {
      if (overwrite) {
        cache[key] = value;
      }
    } else {
      cache[key] = value;
    }
  }
  function isCached(key) {
    return key in cache;
  }
  function removeFromCache(key) {
    if (key in cache) {
      delete cache[key];
    }
  }
  function clearCache() {
    const keys = Object.keys(cache);
    for (const key of keys) {
      delete cache[key];
    }
  }
  function mainLoop() {
    const currentTime = new Date().getTime();
    const deltaTime = (currentTime - lastTime) * 0.001;
    elapsedTime += deltaTime;
    lastTime = currentTime;
    const system = {
      deltaTime,
      elapsedTime,
      lastTime,
      ctx,
      canvas,
      content,
      input,
      currentScene,
      cache: {
        add: addToCache,
        remove: removeFromCache,
        has: isCached,
        clear: clearCache,
      },
      switchScene(sceneId) {
        if (!currentScene.exiting) {
          if (sceneId in sceneRegistry) {
            currentScene.exiting = true;
            nextScene = sceneRegistry[sceneId];
          }
        }
      },
      registerScene,
    };
    if (!didRegisterScenes) {
      registerScenes(system);
      didRegisterScenes = true;
      if (currentScene) {
        currentScene.didEnter(system);
      }
    }
    if (currentScene) {
      currentScene.didUpdate(system);
    }
    if (nextScene) {
      currentScene.didExit(system);
      nextScene.didEnter(system);
      currentScene = nextScene;
      nextScene = null;
    }
    window.requestAnimationFrame(mainLoop);
  }
  mainLoop();
}

boot().catch((err) => {
  console.error(err.message);
  console.log(err);
});

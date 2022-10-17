const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;

const GRAVE_ROW_COUNT = 3;
const GRAVE_COLUMN_COUNT = 4;
const GRAVE_COUNT = GRAVE_ROW_COUNT * GRAVE_COLUMN_COUNT;
const GRAVE_STATE = {
  EMPTY: 0,
  ZOMBIE_NORMAL: 1,
  ZOMBIE_DYING: 2,
};

const GRAVE_GRID_PADDING_X = 64;
const GRAVE_GRID_PADDING_Y = 64;
const GRAVE_GRID_CELL_WIDTH = Math.floor(
  (SCREEN_WIDTH - GRAVE_GRID_PADDING_X) / GRAVE_COLUMN_COUNT,
);

const GRAVE_GRID_CELL_HEIGHT = Math.floor(
  (SCREEN_HEIGHT - GRAVE_GRID_PADDING_Y) / GRAVE_ROW_COUNT,
);

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

const MIN_POINTS_PER_ZOMBIE = 10;
const MAX_POINTS_PER_ZOMBIE = 200;

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
  RESULTS_SCENE: Symbol("RESULTS_SCENE"),
  LOSE_SCENE: Symbol("LOSE_SCENE"),
};

const CACHE_KEYS = {
  FINAL_SCORE: Symbol("FINAL_SCORE"),
};

// splash scene

const SplashScene = {
  // state that is local to the scene
  getInitialState() {
    return {
      // tracks if the mouse has been pressed during the last frame and released during the current frame
      didClick: false,
    };
  },
  // called once when the engine transitions to this scene
  didEnter(system) {
    SplashScene.state = SplashScene.getInitialState();
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
  getInitialState() {
    return {
      // tracks if the mouse has been pressed during the last frame and released during the current frame
      didClick: false,
    };
  },
  // called once when the engine transitions to this scene
  didEnter(system) {
    TitleScene.state = TitleScene.getInitialState();
  },
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

const RSG = createComponent(
  "ReadySetGo",
  { active: true, step: 3, time: 0 },
  (component) => {
    component.state.active = true;
    component.state.step = 3;
    component.state.time = 0;
  },
  (component, dt) => {
    if (component.state.active) {
      component.state.time += dt;
      if (component.state.time > 1) {
        component.state.time = 0;
        component.state.step--;
        if (component.state.step <= 0) {
          component.state.active = false;
        }
      }
    }
  },
  (component, ctx) => {
    if (component.state.active) {
      const steps = ["", "GO!", "Get Set!", "Get Ready"];
      const step = steps[component.state.step];
      const colors = ["#fff", "#0a0", "#aa0", "#a00"];
      const color = colors[component.state.step];
      ctx.save();
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(step, SCREEN_WIDTH * 0.5, SCREEN_HEIGHT * 0.3);
      ctx.restore();
    }
  },
);

const PlayScene = {
  // state that is local to the scene
  getInitialState() {
    return {
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
      // minimum number of zombies that can appear at one time
      minZombies: 2,
      // max number of zombies that can appear at one time
      maxZombies: 4,
      // minimum number of seconds that a zombie will stay active
      minZombieLifetime: 0.8,
      // maximum number of seconds that a zombie will stay active
      maxZombieLifetime: 3.0,
      // tracks the graves that have activated zombies in them
      activeGraves: {
        /*
          keys are the grave index, values are a zombie object
          {
            lifetime: number of seconds this zombie will live
            life: number of seconds remaining until this zombie deactivates
            grave: grave index the zombie is occupying
            value: score value of the zombie
          }
        */
      },
      // tracks the graves that are unoccupied
      availableGraves: {},
      // tracks how many hearts you have remaining
      hearts: 5,
      // tracks your score from killing zombies
      score: 0,
      // tracks the amount of time the play scene has been playing
      time: 0,
      // are we ready to play?
      ready: false,
    };
  },
  // called once when the engine transitions to this scene
  didEnter(system) {
    PlayScene.state = PlayScene.getInitialState();

    // TODO: this constant should be moved to the main constants, it is not really state
    PlayScene.state.PLAY_TIME_SECONDS = 60;

    RSG.init();

    PlayScene.setupGraveyard(system);
    PlayScene.activateZombies(system);
  },
  // called once when the engine transitions away from this scene
  didExit(system) {
    // set local state to null to free the memory usage of the local state
    PlayScene.state = null;
  },
  // called every frame of the engine main loop
  didUpdate(system) {
    if (PlayScene.state.ready) {
      PlayScene.handleGraveyardLogic(system);
      PlayScene.handleOutOfTimeLogic(system);
      PlayScene.drawGraveyard(system);
      PlayScene.drawUI(system);
    } else {
      RSG.update(system.deltaTime);
      if (!RSG.state.active) {
        PlayScene.state.ready = true;
      }
      PlayScene.drawGraveyard(system);
      RSG.draw(system.ctx);
    }
  },

  setupGraveyard(system) {
    // set all graves as empty
    PlayScene.state.activeGraves = {};
    PlayScene.state.availableGraves = {};
    for (let i = 0; i < GRAVE_COUNT; i++) {
      PlayScene.state.graves[i] = GRAVE_STATE.EMPTY;
      PlayScene.state.availableGraves[i] = i;
    }
  },

  activateZombies(system) {
    const numberOfZombies = randRange(
      PlayScene.state.minZombies,
      PlayScene.state.maxZombies,
    );
    const numberOfActiveZombies = Object.keys(
      PlayScene.state.activeGraves,
    ).length;
    if (numberOfZombies > numberOfActiveZombies) {
      for (let i = 0; i < numberOfZombies; i++) {
        PlayScene.activateRandomGrave(system);
      }
    }
  },

  activateRandomGrave(system) {
    const graveIndex = Number(
      randomElement(Object.keys(PlayScene.state.availableGraves)),
    );
    PlayScene.activateGraveAtGraveIndex(system, graveIndex);
  },

  activateGraveAtGraveIndex(system, graveIndex) {
    // remove the given grave from the available graves
    delete PlayScene.state.availableGraves[graveIndex];

    // update the main graves state
    PlayScene.state.graves[graveIndex] = GRAVE_STATE.ZOMBIE_NORMAL;

    // spawn the zombie object
    const zombieLifetimeSeconds = randRange(
      PlayScene.state.minZombieLifetime,
      PlayScene.state.maxZombieLifetime,
    );

    const zombie = {
      lifetime: zombieLifetimeSeconds,
      grave: graveIndex,
      life: zombieLifetimeSeconds,
      value: MAX_POINTS_PER_ZOMBIE,
    };

    PlayScene.state.activeGraves[graveIndex] = zombie;
  },

  deactivateGraveAtGraveIndex(system, graveIndex) {
    // add the given grave to the available graves
    PlayScene.state.availableGraves[graveIndex] = graveIndex;

    // update the main graves state
    PlayScene.state.graves[graveIndex] = GRAVE_STATE.EMPTY;

    // remove the zombie from the active graves
    delete PlayScene.state.activeGraves[graveIndex];
  },

  updateActiveGraves(system) {
    const activeGraveIndices = Object.keys(
      PlayScene.state.activeGraves,
    );
    const count = activeGraveIndices.length;
    const deactiveGraveIndices = [];
    for (let i = 0; i < count; i++) {
      const zombie =
        PlayScene.state.activeGraves[activeGraveIndices[i]];
      if (zombie) {
        zombie.life -= system.deltaTime;
        const ratio = (zombie.life * 100) / (zombie.lifetime * 100);
        zombie.value = MAX_POINTS_PER_ZOMBIE * ratio;
        zombie.value = ((Math.floor(zombie.value) + 4) / 5) * 5;
        zombie.value = Math.max(zombie.value, MIN_POINTS_PER_ZOMBIE);
        if (zombie.life <= 0) {
          zombie.life = 0;
          deactiveGraveIndices.push(zombie.grave);
        }
      }
    }

    // deactivate any graves in which zombie lifetime expired
    for (const graveIndex of deactiveGraveIndices) {
      PlayScene.deactivateGraveAtGraveIndex(system, graveIndex);
    }

    !count && PlayScene.activateZombies(system);
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

    PlayScene.updateActiveGraves(system);
  },

  handleOutOfTimeLogic(system) {
    PlayScene.state.time += system.deltaTime;
    if (PlayScene.state.time > PlayScene.state.PLAY_TIME_SECONDS) {
      system.cache.add(CACHE_KEYS.FINAL_SCORE, PlayScene.state.score);
      system.switchScene(SCENES.RESULTS_SCENE);
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
    switch (collisionResult.graveState) {
      case GRAVE_STATE.ZOMBIE_NORMAL:
        PlayScene.handleZombieGraveClick(system, collisionResult);
        break;
      case GRAVE_STATE.EMPTY:
        PlayScene.handleEmptyGraveClick(system, collisionResult);
        break;
      default:
        break;
    }
  },

  handleEmptyGraveClick(system, collisionResult) {
    PlayScene.state.hearts -= 1;
    if (PlayScene.state.hearts <= 0) {
      PlayScene.state.hearts = 0;
      const finalScore = PlayScene.state.score
        .toString(10)
        .padStart(6, "0");
      system.cache.add(CACHE_KEYS.FINAL_SCORE, finalScore);
      system.switchScene(SCENES.LOSE_SCENE);
    }
  },

  handleZombieGraveClick(system, collisionResult) {
    const zombie =
      PlayScene.state.activeGraves[collisionResult.graveIndex];
    if (zombie) {
      PlayScene.state.score += zombie.value;
    }

    PlayScene.state.graves[collisionResult.graveIndex] =
      GRAVE_STATE.ZOMBIE_DYING;
    setTimeout(() => {
      // because we use a set timeout, there is a chance
      // that the timeout will fire after the scene exits
      // and didExit sets state to null
      // without this check, the deactivation call will
      // cause a runtime exception
      if (PlayScene.state) {
        PlayScene.deactivateGraveAtGraveIndex(
          system,
          collisionResult.graveIndex,
        );
      }
    }, 450);
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

  drawUI(system) {
    PlayScene.drawUITimeRemaining(system);
    PlayScene.drawUIHeartsRemaining(system);
    PlayScene.drawUICurrentScore(system);
  },

  drawUITimeRemaining(system) {
    if (PlayScene.state.time < PlayScene.state.PLAY_TIME_SECONDS) {
      system.ctx.font = "40px serif";
      system.ctx.fillText(
        Math.floor(
          PlayScene.state.PLAY_TIME_SECONDS - PlayScene.state.time,
        ),
        350,
        40,
      );
    }
  },

  drawUIHeartsRemaining(system) {
    system.ctx.font = "48px sans-serif";
    system.ctx.fillStyle = "#a00";
    for (let i = 0; i < PlayScene.state.hearts; i++) {
      const heartX = SCREEN_WIDTH - 48 * 5 + 48 * i;
      const heartY = 48;
      system.ctx.fillText(
        String.fromCodePoint(0x2764),
        heartX,
        heartY,
      );
    }
  },

  drawUICurrentScore(system) {
    system.ctx.fillStyle = "#0f0";
    system.ctx.font = "20px sans-serif";
    const score = PlayScene.state.score.toString(10).padStart(6, "0");
    system.ctx.fillText(`SCORE: ${score}`, 40, 40);
  },
};

// lose scene

const LoseScene = {
  // state that is local to the scene
  getInitialState() {
    return {
      // tracks if the mouse has been pressed during the last frame and released during the current frame
      didClick: false,
    };
  },
  // called once when the engine transitions to this scene
  didEnter(system) {
    LoseScene.state = LoseScene.getInitialState();
  },
  // called once when the engine transitions away from this scene
  didExit(system) {
    // set local state to null to free the memory usage of the local state
    LoseScene.state = null;
    // clear the final score from the cache
    system.cache.remove(CACHE_KEYS.FINAL_SCORE);
  },
  // called every frame of the engine main loop
  didUpdate(system) {
    // clear the scene to a dark gray color
    system.ctx.fillStyle = "#222";
    system.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    system.ctx.textBaseline = "middle";
    system.ctx.textAlign = "center";
    system.ctx.font = "96px serif";
    system.ctx.fillStyle = "#a00";
    system.ctx.fillText(
      "YOU DIED",
      SCREEN_WIDTH * 0.5,
      SCREEN_HEIGHT * 0.5,
    );

    system.ctx.textBaseline = "middle";
    system.ctx.textAlign = "center";
    system.ctx.font = "32px serif";
    system.ctx.fillStyle = "#fff";
    system.ctx.fillText(
      `FINAL SCORE: ${system.cache.read(CACHE_KEYS.FINAL_SCORE)}`,
      SCREEN_WIDTH * 0.5,
      SCREEN_HEIGHT * 0.65,
    );

    // check for a mouse press and release
    // when the mouse is released, switch the scene to the title scene
    if (system.input.mouseDown && !LoseScene.state.didClick) {
      LoseScene.state.didClick = true;
    } else if (!system.input.mouseDown && LoseScene.state.didClick) {
      LoseScene.state.didClick = false;
      system.switchScene(SCENES.TITLE_SCENE);
    }
  },
};

// results scene

const ResultsScene = {
  // state that is local to the scene
  getInitialState() {
    return {
      // tracks if the mouse has been pressed during the last frame and released during the current frame
      didClick: false,
    };
  },
  // called once when the engine transitions to this scene
  didEnter(system) {
    ResultsScene.state = ResultsScene.getInitialState();
  },
  // called once when the engine transitions away from this scene
  didExit(system) {
    // set local state to null to free the memory usage of the local state
    ResultsScene.state = null;
    // clear the final score from the cache
    system.cache.remove(CACHE_KEYS.FINAL_SCORE);
  },
  // called every frame of the engine main loop
  didUpdate(system) {
    // clear the scene to a dark blue color
    system.ctx.fillStyle = "#147";
    system.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    system.ctx.textBaseline = "middle";
    system.ctx.textAlign = "center";
    system.ctx.font = "96px serif";
    system.ctx.fillStyle = "#cc0";
    system.ctx.fillText(
      "TIME'S UP",
      SCREEN_WIDTH * 0.5,
      SCREEN_HEIGHT * 0.5,
    );

    system.ctx.textBaseline = "middle";
    system.ctx.textAlign = "center";
    system.ctx.font = "32px serif";
    system.ctx.fillStyle = "#fff";
    system.ctx.fillText(
      `FINAL SCORE: ${system.cache.read(CACHE_KEYS.FINAL_SCORE)}`,
      SCREEN_WIDTH * 0.5,
      SCREEN_HEIGHT * 0.65,
    );

    // check for a mouse press and release
    // when the mouse is released, switch the scene to the play scene
    if (system.input.mouseDown && !ResultsScene.state.didClick) {
      ResultsScene.state.didClick = true;
    } else if (
      !system.input.mouseDown &&
      ResultsScene.state.didClick
    ) {
      ResultsScene.state.didClick = false;
      system.switchScene(SCENES.PLAY_SCENE);
    }
  },
};

function registerScenes(system) {
  system.registerScene(SCENES.SPLASH_SCENE, SplashScene, true);
  system.registerScene(SCENES.TITLE_SCENE, TitleScene);
  system.registerScene(SCENES.PLAY_SCENE, PlayScene);
  system.registerScene(SCENES.LOSE_SCENE, LoseScene);
  system.registerScene(SCENES.RESULTS_SCENE, ResultsScene);
}

// engine internals

function createComponent(
  name,
  state,
  init,
  update,
  draw,
  { ...other } = {},
) {
  const sym = Symbol(name);
  const component = {
    get id() {
      return sym;
    },
    state: { ...state },
    init(...extra) {
      typeof init === "function" && init(component, ...extra);
    },
    update(...extra) {
      typeof update === "function" && update(component, ...extra);
    },
    draw(...extra) {
      typeof draw === "function" && draw(component, ...extra);
    },
  };
  Object.assign(component, other);
  return component;
}

function randRange(low, high) {
  return Math.floor(low + Math.random() * (high - low));
}

function randomElement(elements) {
  const numberOfElements = elements.length;
  return elements[Math.floor(Math.random() * numberOfElements)];
}

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
        read(key) {
          return cache[key];
        },
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
      currentScene.exiting = false;
      nextScene.didEnter(system);
      currentScene = nextScene;
      nextScene = null;
    }
    window.requestAnimationFrame(mainLoop);
    window.dumpSystem = () => console.log({ system });
  }
  mainLoop();
}

boot().catch((err) => {
  console.error(err.message);
  console.log(err);
});

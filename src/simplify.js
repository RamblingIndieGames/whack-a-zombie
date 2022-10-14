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

const PlayScene = {
  // state that is local to the scene
  state: {},
  // called once when the engine transitions to this scene
  didEnter(system) {
    PlayScene.state.time = 0;
    PlayScene.state.PLAY_TIME_SECONDS = 60;
  },
  // called once when the engine transitions away from this scene
  didExit(system) {
    // set local state to null to free the memory usage of the local state
    PlayScene.state = null;
  },
  // called every frame of the engine main loop
  didUpdate(system) {
    system.ctx.clearRect(0, 0, SCREEN_WIDTH, 60);
    PlayScene.state.time += system.deltaTime;
    system.ctx.font = "40px serif";

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

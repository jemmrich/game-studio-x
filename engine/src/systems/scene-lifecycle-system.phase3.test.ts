import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { describe, it } from "https://deno.land/std@0.208.0/testing/bdd.ts";
import { World } from "../core/world.ts";
import { SceneManager } from "../resources/scene-manager.ts";
import { SceneLifecycleSystem } from "./scene-lifecycle-system.ts";
import { SceneState, type Scene } from "../core/scene.ts";
import { SCENE_EVENTS, type SceneLoadEvent, type SceneUnloadEvent } from "../core/scene-events.ts";

describe("Phase 3: SceneLifecycleSystem Consolidation", () => {
  // Helper to create a simple test scene
  function createTestScene(id: string): Scene {
    let created = false;
    let inited = false;
    let disposed = false;

    return {
      id,
      create() {
        created = true;
      },
      init(_world: World) {
        inited = true;
      },
      pause(_world: World) {},
      resume(_world: World) {},
      reset(_world: World) {},
      dispose(_world: World) {
        disposed = true;
      },
      isCreated: () => created,
      isInited: () => inited,
      isDisposed: () => disposed,
    };
  }

  it("lifecycle system calls _completeSceneTransition when scene loads", () => {
    const world = new World();
    const sceneManager = new SceneManager();
    world.addResource("sceneManager", sceneManager);
    const system = new SceneLifecycleSystem();

    const scene = createTestScene("test-scene") as any;
    let transitionCompleted = false;

    // Track if _completeSceneTransition is called
    const originalMethod = sceneManager._completeSceneTransition.bind(sceneManager);
    sceneManager._completeSceneTransition = function (s: Scene, type: "load" | "push") {
      transitionCompleted = true;
      originalMethod(s, type);
    };

    // Load scene
    sceneManager.loadScene(scene);
    assertEquals(sceneManager.getState(), SceneState.Loading);

    // Simulate lifecycle system update
    system.update(world, 0.016);

    // Verify transition was completed
    assertEquals(transitionCompleted, true);
    assertEquals(sceneManager.getState(), SceneState.Active);
    assertEquals(sceneManager.getCurrentScene(), scene);
  });

  it("lifecycle system calls _completeSceneDisposal after scene unloads", () => {
    const world = new World();
    const sceneManager = new SceneManager();
    world.addResource("sceneManager", sceneManager);
    const system = new SceneLifecycleSystem();

    const scene1 = createTestScene("scene1") as any;
    const scene2 = createTestScene("scene2") as any;

    let disposalCompleted = false;

    // Track if _completeSceneDisposal is called
    const originalMethod = sceneManager._completeSceneDisposal.bind(sceneManager);
    sceneManager._completeSceneDisposal = function () {
      disposalCompleted = true;
      originalMethod();
    };

    // Load scene 1
    sceneManager.loadScene(scene1);
    system.update(world, 0.016);
    assertEquals(sceneManager.getState(), SceneState.Active);

    // Load scene 2 (unloads scene 1)
    sceneManager.loadScene(scene2);
    assertEquals(sceneManager.getState(), SceneState.Unloading);

    // Update lifecycle system to unload scene1 and start loading scene2
    system.update(world, 0.016);

    // Verify disposal was completed
    assertEquals(disposalCompleted, true);
    // After disposal, scene2 is pending, so state should be Loading
    assertEquals(sceneManager.getState(), SceneState.Loading);

    // Another update completes the loading of scene2
    system.update(world, 0.016);
    assertEquals(sceneManager.getState(), SceneState.Active);
    assertEquals(sceneManager.getCurrentScene(), scene2);
  });

  it("scene state is correctly transitioned through lifecycle", () => {
    const world = new World();
    const sceneManager = new SceneManager();
    world.addResource("sceneManager", sceneManager);
    const system = new SceneLifecycleSystem();


    const scene = createTestScene("test") as any;
    const states: SceneState[] = [];

    // Track state changes
    sceneManager.subscribeToStateChanges((state) => {
      states.push(state);
    });

    // Initial state
    assertEquals(sceneManager.getState(), SceneState.Unloaded);

    // Load scene
    sceneManager.loadScene(scene);
    assertEquals(sceneManager.getState(), SceneState.Loading);

    // Lifecycle system processes loading
    system.update(world, 0.016);
    assertEquals(sceneManager.getState(), SceneState.Active);

    // Verify state progression
    // Now includes Loading state that gets notified when scene transitions
    assertEquals(states, [SceneState.Loading, SceneState.Active]);
  });

  it("scene query APIs work correctly", () => {
    const world = new World();
    const sceneManager = new SceneManager();
    world.addResource("sceneManager", sceneManager);
    const system = new SceneLifecycleSystem();


    const scene1 = createTestScene("scene1") as any;
    const scene2 = createTestScene("scene2") as any;

    // Load scene 1
    sceneManager.loadScene(scene1);
    system.update(world, 0.016);
    assertEquals(sceneManager.getTotalSceneCount(), 1);
    assertEquals(sceneManager.getSceneStackDepth(), 0);

    // Push scene 2 on top
    sceneManager.pushScene(scene2);
    system.update(world, 0.016);
    assertEquals(sceneManager.getTotalSceneCount(), 2);
    assertEquals(sceneManager.getSceneStackDepth(), 1);
    assertEquals(sceneManager.getSceneStack().length, 1);
    assertEquals(sceneManager.getSceneStack()[0].id, "scene1");

    // Pop scene 2
    sceneManager.popScene();
    assertEquals(sceneManager.getTotalSceneCount(), 1);
    assertEquals(sceneManager.getCurrentScene()?.id, "scene1");
  });

  it("isScenePaused() correctly identifies paused scenes", () => {
    const world = new World();
    const sceneManager = new SceneManager();
    world.addResource("sceneManager", sceneManager);
    const system = new SceneLifecycleSystem();


    const gameplay = createTestScene("gameplay") as any;
    const menu = createTestScene("menu") as any;

    // Load gameplay
    sceneManager.loadScene(gameplay);
    system.update(world, 0.016);
    assertEquals(sceneManager.isScenePaused("gameplay"), false);
    assertEquals(sceneManager.isScenePaused("menu"), false);

    // Push menu on top
    sceneManager.pushScene(menu);
    system.update(world, 0.016);
    assertEquals(sceneManager.isScenePaused("gameplay"), true);
    assertEquals(sceneManager.isScenePaused("menu"), false);
  });

  it("scene lifecycle methods are called in correct order", () => {
    const world = new World();
    const sceneManager = new SceneManager();
    world.addResource("sceneManager", sceneManager);
    const system = new SceneLifecycleSystem();


    const callOrder: string[] = [];

    const scene: Scene = {
      id: "test",
      create() {
        callOrder.push("create");
      },
      init(_world: World) {
        callOrder.push("init");
      },
      pause(_world: World) {
        callOrder.push("pause");
      },
      resume(_world: World) {
        callOrder.push("resume");
      },
      reset(_world: World) {
        callOrder.push("reset");
      },
      dispose(_world: World) {
        callOrder.push("dispose");
      },
    };

    // Load scene
    sceneManager.loadScene(scene);
    system.update(world, 0.016);
    assertEquals(callOrder, ["create", "init"]);

    // Load another scene (triggers dispose)
    const scene2: Scene = {
      id: "test2",
      create() {
        callOrder.push("create2");
      },
      init(_world: World) {
        callOrder.push("init2");
      },
      pause(_world: World) {
        callOrder.push("pause2");
      },
      resume(_world: World) {
        callOrder.push("resume2");
      },
      reset(_world: World) {
        callOrder.push("reset2");
      },
      dispose(_world: World) {
        callOrder.push("dispose2");
      },
    };

    sceneManager.loadScene(scene2);
    system.update(world, 0.016); // First update: unload
    system.update(world, 0.016); // Second update: load
    assertEquals(callOrder, ["create", "init", "dispose", "create2", "init2"]);
  });

  it("events are emitted when scenes load and unload", () => {
    const world = new World();
    const sceneManager = new SceneManager();
    world.addResource("sceneManager", sceneManager);
    const system = new SceneLifecycleSystem();


    const scene = createTestScene("test") as any;
    const events: any[] = [];

    // Track scene load events
    world.onEvent<SceneLoadEvent>(SCENE_EVENTS.LOAD, (event) => {
      events.push({ type: "load", scene: event.data.scene.id });
    });

    // Track scene unload events
    world.onEvent<SceneUnloadEvent>(SCENE_EVENTS.UNLOAD, (event) => {
      events.push({ type: "unload", scene: event.data.scene.id });
    });

    // Load scene
    sceneManager.loadScene(scene);
    system.update(world, 0.016);
    assertEquals(events.length, 1);
    assertEquals(events[0].type, "load");

    // Unload scene
    const scene2 = createTestScene("test2") as any;
    sceneManager.loadScene(scene2);
    system.update(world, 0.016); // Unload
    assertEquals(events.length, 2);
    assertEquals(events[1].type, "unload");
  });

  it("deprecated _setCurrentScene and _setState still work for backwards compatibility", () => {
    const sceneManager = new SceneManager();
    const scene = createTestScene("test") as any;

    // Disable state validation to test that deprecated methods still work
    sceneManager._setStateValidationEnabled(false);

    // Use deprecated methods
    sceneManager._setCurrentScene(scene);
    sceneManager._setState(SceneState.Active);

    // Verify they still work
    assertEquals(sceneManager.getCurrentScene(), scene);
    assertEquals(sceneManager.getState(), SceneState.Active);
  });

  it("popScene() without parameters uses stored world reference", () => {
    const world = new World();
    const sceneManager = new SceneManager();
    world.addResource("sceneManager", sceneManager);
    const system = new SceneLifecycleSystem();


    const scene1 = createTestScene("scene1") as any;
    const scene2 = createTestScene("scene2") as any;

    // Load and push scenes
    sceneManager.loadScene(scene1);
    system.update(world, 0.016);
    sceneManager.pushScene(scene2);
    system.update(world, 0.016);

    // Pop without world parameter
    sceneManager.popScene(); // Should use stored world reference

    // Verify scene1 is resumed
    assertEquals(sceneManager.getCurrentScene()?.id, "scene1");
  });
});

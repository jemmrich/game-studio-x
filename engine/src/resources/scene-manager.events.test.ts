import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { World } from "../core/world.ts";
import { BaseScene } from "../core/base-scene.ts";
import { SceneManager } from "./scene-manager.ts";
import { SceneLifecycleSystem } from "../systems/scene-lifecycle-system.ts";
import {
  SceneTransitionStartEvent,
  SceneTransitionCompleteEvent,
  SceneLoadEvent,
  SceneUnloadEvent,
  ScenePauseEvent,
  SCENE_EVENTS,
} from "../core/scene-events.ts";

// Test scenes
class TestScene1 extends BaseScene {
  constructor() {
    super("test-scene-1");
  }

  override init(_world: any): void {
    // No-op for testing
  }
}

class TestScene2 extends BaseScene {
  constructor() {
    super("test-scene-2");
  }

  override init(_world: any): void {
    // No-op for testing
  }
}

Deno.test("Scene Events: loadScene emits transition-start event", () => {
  const world = new World();
  const sceneManager = new SceneManager();
  const lifecycleSystem = new SceneLifecycleSystem();
  
  world.addResource("sceneManager", sceneManager);
  
  // Initialize the lifecycle system to set world reference
  lifecycleSystem.update(world, 0);
  
  const scene = new TestScene1();
  let eventFired = false;
  let transitionType = "";
  
  world.onEvent<SceneTransitionStartEvent>(
    SCENE_EVENTS.TRANSITION_START,
    (event: { type: string; data: SceneTransitionStartEvent }) => {
      eventFired = true;
      transitionType = event.data.transitionType;
    }
  );
  
  sceneManager.loadScene(scene);
  
  assertEquals(eventFired, true, "transition-start event should fire");
  assertEquals(transitionType, "load", "transition type should be load");
});

Deno.test("Scene Events: loadScene emits transition-complete after init", () => {
  const world = new World();
  const sceneManager = new SceneManager();
  const lifecycleSystem = new SceneLifecycleSystem();
  
  world.addResource("sceneManager", sceneManager);
  
  const scene = new TestScene1();
  let completeEventFired = false;
  
  world.onEvent<SceneTransitionCompleteEvent>(
    SCENE_EVENTS.TRANSITION_COMPLETE,
    (event: { type: string; data: SceneTransitionCompleteEvent }) => {
      completeEventFired = true;
    }
  );
  
  sceneManager.loadScene(scene);
  lifecycleSystem.update(world, 0);
  
  assertEquals(completeEventFired, true, "transition-complete event should fire");
});

Deno.test("Scene Events: loadScene emits scene-load event", () => {
  const world = new World();
  const sceneManager = new SceneManager();
  const lifecycleSystem = new SceneLifecycleSystem();
  
  world.addResource("sceneManager", sceneManager);
  
  const scene = new TestScene1();
  let loadEventFired = false;
  
  world.onEvent<SceneLoadEvent>(
    SCENE_EVENTS.LOAD,
    (event: { type: string; data: SceneLoadEvent }) => {
      loadEventFired = true;
    }
  );
  
  sceneManager.loadScene(scene);
  lifecycleSystem.update(world, 0);
  
  assertEquals(loadEventFired, true, "scene-load event should fire");
});

Deno.test("Scene Events: pushScene emits transition with type push", () => {
  const world = new World();
  const sceneManager = new SceneManager();
  const lifecycleSystem = new SceneLifecycleSystem();
  
  world.addResource("sceneManager", sceneManager);
  
  const scene1 = new TestScene1();
  const scene2 = new TestScene2();
  
  // Load first scene
  sceneManager.loadScene(scene1);
  lifecycleSystem.update(world, 0);
  
  let transitionType = "";
  
  world.onEvent<SceneTransitionCompleteEvent>(
    SCENE_EVENTS.TRANSITION_COMPLETE,
    (event: { type: string; data: SceneTransitionCompleteEvent }) => {
      transitionType = event.data.transitionType;
    }
  );
  
  // Push second scene
  sceneManager.pushScene(scene2);
  lifecycleSystem.update(world, 0);
  
  assertEquals(transitionType, "push", "transition type should be push");
});

Deno.test("Scene Events: pushScene emits scene-pause event", () => {
  const world = new World();
  const sceneManager = new SceneManager();
  const lifecycleSystem = new SceneLifecycleSystem();
  
  world.addResource("sceneManager", sceneManager);
  
  const scene1 = new TestScene1();
  const scene2 = new TestScene2();
  
  // Load first scene
  sceneManager.loadScene(scene1);
  lifecycleSystem.update(world, 0);
  
  let pauseEventFired = false;
  
  world.onEvent<ScenePauseEvent>(
    SCENE_EVENTS.PAUSE,
    (event: { type: string; data: ScenePauseEvent }) => {
      pauseEventFired = true;
    }
  );
  
  // Push second scene (should pause first)
  sceneManager.pushScene(scene2);
  
  assertEquals(pauseEventFired, true, "scene-pause event should fire");
});

Deno.test("Scene Events: event unsubscribe works", () => {
  const world = new World();
  const sceneManager = new SceneManager();
  const lifecycleSystem = new SceneLifecycleSystem();
  
  world.addResource("sceneManager", sceneManager);
  
  // Initialize the lifecycle system to set world reference
  lifecycleSystem.update(world, 0);
  
  let callCount = 0;
  
  const unsubscribe = world.onEvent<SceneTransitionStartEvent>(
    SCENE_EVENTS.TRANSITION_START,
    () => {
      callCount++;
    }
  );
  
  sceneManager.loadScene(new TestScene1());
  assertEquals(callCount, 1, "event should fire before unsubscribe");
  
  unsubscribe();
  
  sceneManager.loadScene(new TestScene2());
  assertEquals(callCount, 1, "event should not fire after unsubscribe");
});

Deno.test("Scene Events: emitEvent is generic and type-safe", () => {
  const world = new World();
  
  interface CustomEvent {
    message: string;
    code: number;
  }
  
  let messageReceived = "";
  let codeReceived = 0;
  
  world.onEvent<CustomEvent>(
    "custom-event",
    (event: { type: string; data: CustomEvent }) => {
      messageReceived = event.data.message;
      codeReceived = event.data.code;
    }
  );
  
  const testData: CustomEvent = { message: "test", code: 42 };
  world.emitEvent<CustomEvent>("custom-event", testData);
  
  assertEquals(messageReceived, "test");
  assertEquals(codeReceived, 42);
});

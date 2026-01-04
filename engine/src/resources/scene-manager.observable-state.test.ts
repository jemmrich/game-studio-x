import { assertEquals, assertThrows } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { SceneManager } from "./scene-manager.ts";
import { Scene, SceneState } from "../core/scene.ts";
import { World } from "../core/world.ts";
import { SceneLifecycleSystem } from "../systems/scene-lifecycle-system.ts";

class TestScene implements Scene {
  id = "test-scene";
  create() {}
  init() {}
  pause() {}
  resume() {}
  reset() {}
  update() {}
  dispose() {}
}

Deno.test("Scene Manager Observable State: subscribeToStateChanges tracks state", () => {
  const manager = new SceneManager();
  const states: SceneState[] = [];

  // Disable validation for this test since we're setting state directly
  manager._setStateValidationEnabled(false);

  const unsubscribe = manager.subscribeToStateChanges((state) => {
    states.push(state);
  });

  manager._setState(SceneState.Loading);
  manager._setState(SceneState.Active);
  manager._setState(SceneState.Unloading);

  unsubscribe();
  manager._setState(SceneState.Unloaded);

  assertEquals(states, [
    SceneState.Loading,
    SceneState.Active,
    SceneState.Unloading,
  ]);
});

Deno.test(
  "Scene Manager Observable State: unsubscribe stops notifications",
  () => {
    const manager = new SceneManager();
    manager._setStateValidationEnabled(false);

    let callCount = 0;
    const unsubscribe = manager.subscribeToStateChanges(() => {
      callCount++;
    });

    manager._setState(SceneState.Loading);
    assertEquals(callCount, 1);

    unsubscribe();

    manager._setState(SceneState.Active);
    assertEquals(callCount, 1); // Should not increase
  }
);

Deno.test(
  "Scene Manager Observable State: multiple subscribers are called",
  () => {
    const manager = new SceneManager();
    manager._setStateValidationEnabled(false);

    let subscriber1Count = 0;
    let subscriber2Count = 0;

    const unsub1 = manager.subscribeToStateChanges(() => {
      subscriber1Count++;
    });

    const unsub2 = manager.subscribeToStateChanges(() => {
      subscriber2Count++;
    });

    manager._setState(SceneState.Loading);

    assertEquals(subscriber1Count, 1);
    assertEquals(subscriber2Count, 1);

    unsub1();
    manager._setState(SceneState.Active);

    assertEquals(subscriber1Count, 1); // Unchanged
    assertEquals(subscriber2Count, 2); // Incremented
  }
);

Deno.test(
  "Scene Manager Observable State: state validation prevents invalid transitions",
  () => {
    const manager = new SceneManager();

    // Valid transition
    assertEquals(manager.getState(), SceneState.Unloaded);

    // Can't transition from Unloaded to Active directly
    assertThrows(
      () => {
        manager._setState(SceneState.Active);
      },
      Error,
      "Invalid state transition"
    );
  }
);

Deno.test(
  "Scene Manager Observable State: valid state transition sequence",
  () => {
    const manager = new SceneManager();
    const states: SceneState[] = [];

    manager.subscribeToStateChanges((state) => {
      states.push(state);
    });

    // Valid sequence: Unloaded -> Loading -> Active
    manager._setState(SceneState.Loading);
    manager._setState(SceneState.Active);

    assertEquals(states, [SceneState.Loading, SceneState.Active]);
    assertEquals(manager.getState(), SceneState.Active);
  }
);

Deno.test(
  "Scene Manager Observable State: state validation can be disabled",
  () => {
    const manager = new SceneManager();
    manager._setStateValidationEnabled(false);

    // This would normally fail but validation is disabled
    manager._setState(SceneState.Active);

    assertEquals(manager.getState(), SceneState.Active);
  }
);

Deno.test(
  "Scene Manager Observable State: loadScene triggers state changes",
  () => {
    const world = new World();
    const manager = new SceneManager();
    const lifecycleSystem = new SceneLifecycleSystem();
    
    world.addResource("sceneManager", manager);
    lifecycleSystem.update(world, 0); // Initialize lifecycle system
    
    const initialState = manager.getState();
    assertEquals(initialState, SceneState.Unloaded);

    const scene = new TestScene();
    manager.loadScene(scene);

    // loadScene should set state to Loading
    assertEquals(manager.getState(), SceneState.Loading);
  }
);

Deno.test(
  "Scene Manager Observable State: pushScene triggers state changes",
  () => {
    const world = new World();
    const manager = new SceneManager();
    const lifecycleSystem = new SceneLifecycleSystem();
    
    world.addResource("sceneManager", manager);
    lifecycleSystem.update(world, 0); // Initialize lifecycle system
    
    // First, load a scene
    const scene1 = new TestScene();
    manager.loadScene(scene1);
    
    // Manually update state to Active for testing
    manager._setStateValidationEnabled(false);
    manager._setState(SceneState.Active);
    manager._setStateValidationEnabled(true);

    const scene2 = new TestScene();
    manager.pushScene(scene2);

    // Should transition to Loading (for the new pushed scene)
    assertEquals(manager.getState(), SceneState.Loading);
  }
);

Deno.test(
  "Scene Manager Observable State: state subscribers receive current state",
  () => {
    const manager = new SceneManager();
    manager._setStateValidationEnabled(false);

    manager._setState(SceneState.Loading);
    manager._setState(SceneState.Active);

    const receivedStates: SceneState[] = [];

    // Subscribe after state is already Active
    manager.subscribeToStateChanges((state) => {
      receivedStates.push(state);
    });

    manager._setState(SceneState.Unloading);

    // Should only receive the new state change, not the current state
    assertEquals(receivedStates, [SceneState.Unloading]);
  }
);

Deno.test(
  "Scene Manager Observable State: error handling in subscribers doesn't break others",
  () => {
    const manager = new SceneManager();
    manager._setStateValidationEnabled(false);

    const receivedStates: SceneState[] = [];

    // First subscriber throws
    manager.subscribeToStateChanges(() => {
      throw new Error("Subscriber error");
    });

    // Second subscriber should still be called
    manager.subscribeToStateChanges((state) => {
      receivedStates.push(state);
    });

    manager._setState(SceneState.Loading);

    // Second subscriber should still receive the state change
    assertEquals(receivedStates, [SceneState.Loading]);
  }
);

Deno.test(
  "Scene Manager Observable State: complex state machine validation",
  () => {
    const manager = new SceneManager();

    // Simulate: Unloaded -> Loading -> Active -> Unloading -> Unloaded
    const states: SceneState[] = [];
    manager.subscribeToStateChanges((state) => {
      states.push(state);
    });

    manager._setState(SceneState.Loading);
    manager._setState(SceneState.Active);
    manager._setState(SceneState.Unloading);
    manager._setState(SceneState.Unloaded);

    assertEquals(states, [
      SceneState.Loading,
      SceneState.Active,
      SceneState.Unloading,
      SceneState.Unloaded,
    ]);
  }
);

Deno.test(
  "Scene Manager Observable State: state-changed event emitted through World",
  async () => {
    const world = new World();
    const manager = new SceneManager();
    const lifecycleSystem = new SceneLifecycleSystem();
    
    world.addResource("sceneManager", manager);
    lifecycleSystem.update(world, 0); // Initialize lifecycle system

    const events: Array<{ from: SceneState; to: SceneState }> = [];

    world.onEvent<{ from: SceneState; to: SceneState }>(
      "scene-state-changed",
      (event) => {
        events.push(event.data);
      }
    );

    manager._setState(SceneState.Loading);
    manager._setState(SceneState.Active);

    // Give event system a moment to process
    await new Promise((resolve) => setTimeout(resolve, 10));

    assertEquals(events.length, 2);
    assertEquals(events[0].from, SceneState.Unloaded);
    assertEquals(events[0].to, SceneState.Loading);
    assertEquals(events[1].from, SceneState.Loading);
    assertEquals(events[1].to, SceneState.Active);
  }
);

Deno.test(
  "Scene Manager Observable State: duplicate state changes are ignored",
  () => {
    const manager = new SceneManager();
    manager._setStateValidationEnabled(false);

    const states: SceneState[] = [];
    manager.subscribeToStateChanges((state) => {
      states.push(state);
    });

    manager._setState(SceneState.Loading);
    manager._setState(SceneState.Loading); // Same state, should be ignored
    manager._setState(SceneState.Active);

    // Only two state changes should be recorded
    assertEquals(states, [SceneState.Loading, SceneState.Active]);
  }
);

Deno.test(
  "Scene Manager Observable State: _getStateSubscriberCount works",
  () => {
    const manager = new SceneManager();

    assertEquals(manager._getStateSubscriberCount(), 0);

    const unsub1 = manager.subscribeToStateChanges(() => {});
    assertEquals(manager._getStateSubscriberCount(), 1);

    const unsub2 = manager.subscribeToStateChanges(() => {});
    assertEquals(manager._getStateSubscriberCount(), 2);

    unsub1();
    assertEquals(manager._getStateSubscriberCount(), 1);

    unsub2();
    assertEquals(manager._getStateSubscriberCount(), 0);
  }
);

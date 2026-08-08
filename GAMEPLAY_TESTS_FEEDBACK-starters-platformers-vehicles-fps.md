# Gameplay tests feedback — starters batch: platformers, vehicles, FPS

Starters covered (2 tests each):

| Starter | Tests |
| --- | --- |
| `starting-platformer` | Jumping with Space · Collecting the coins by running into them |
| `starting-3D-platformer` | Jumping with Space · Collecting a coin by walking into it |
| `starting-3d-driving` | Accelerating drives the car forward · Running a traffic cone over knocks it away |
| `starting-3d-tank` | Firing a shell with F · Blowing a target away with a shell |
| `starting-first-person-shooter` | Walking and strafing with WASD · Shooting a target |

All ten tests pass, and each was run four times in a row to check for
flakiness (no flake; the only non-green result across those runs was the
`Jolt is not defined` boot race described below, which is unrelated to the
tests themselves).

---

## What was tested, and why

The pattern chosen everywhere is **one control test + one consequence
test**: the first proves that an input actually drives the player object,
the second proves that driving it into the world produces the thing the
game is about (a coin disappears, a cone flies, a target is blown away).
Both halves are needed: a control test alone would keep passing if
collisions broke, and a consequence test alone would keep passing if it
were reached by luck.

Each test also pins down its **starting state before acting**, so that what
it asserts afterwards can only come from the input: the control tests step a
stretch of frames with no key pressed and assert the player does not drift
(without it, "the player is higher up" would be satisfied by a game with
inverted gravity), the pickup tests assert that nothing is collected while
standing still, and the shooting tests assert that the weapon is *not*
already pointing at the target before it is aimed.

- **`starting-platformer`** — Jump (the platformer behavior's `IsOnFloor` /
  height gained / landing back at the same height and x), and coin pickup.
  The coin test deliberately uses the level's geometry: the player starts on
  a raised platform, has to run off its edge, fall to the ground below and
  run back over the row of coins. That exercises running, falling and
  collision-based pickup in one scenario, and the "falling next to the coins
  does not collect them" assertion pins the pickup on the contact.
- **`starting-3D-platformer`** — Jump (`PhysicsCharacter3D.IsJumping` +
  height), and walking into a coin. Collection is a "within 50 units"
  distance check, so the walk test asserts the coin survives 12 frames of
  standing 140 units away and then disappears once the player walks into it.
- **`starting-3d-driving`** — There are no events at all in this game: it is
  pure `PhysicsCar3D` behaviour, so the tests target the behaviour itself.
  Accelerating: engine revs up, the car travels **along its heading** (not
  sideways) and does not turn while no steering key is held. Cones: the car
  is lined up 120px from the first cone on the road and driven into it.
- **`starting-3d-tank`** — Firing: exactly one shell, leaving from the end of
  the cannon (>50px from the tank centre), flying along
  `Angle + TopRotation`, and — keeping `f` held for 30 frames — **not**
  turning into a machine gun (the firing event is a "trigger once", which is
  worth locking down). Target: the tank is parked 340px from a target with
  the target 15° off the turret axis, the turret is turned onto it with
  `a`/`d`, and the shell's explosion has to move the target.
- **`starting-first-person-shooter`** — Movement: `w` walks along the facing
  direction and `d` strafes *sideways* without turning the player (the
  camera-relative WASD scheme is the distinctive thing to protect here).
  Shooting: aim down onto a target with mouse deltas, fire, then assert both
  that the impact effect lands on the target and that the target is knocked
  over.

---

## Missing in the harness

### 1. No way to raise the 30 s wall-clock timeout (this was the biggest constraint)

`timeoutMs`/`maxFrames` exist in the run payload but a `gd::Test` only
stores `name`/`type`/`description`/`source`, so a test cannot ask for more
time. On the machine used here (headless Linux, xvfb, software WebGL) the
budget that actually fits in 30 s was:

| Starter | Frames that fit in 30 s | ms per stepped frame |
| --- | --- | --- |
| `starting-platformer` (2D) | ~330 | ~85 |
| `starting-3d-driving` | ~140 | ~215 |
| `starting-3D-platformer` | ~125 | ~230 |
| `starting-3d-tank` | ~105 | ~280 |
| `starting-first-person-shooter` | ~100 | ~300 |

That is **1.6 to 2 seconds of simulated gameplay for a 3D starter** — far
from the "under ~15 seconds of simulated gameplay" the guide suggests, and
it shaped every 3D test written here. Concretely I had to drop the jump test
from the FPS starter to keep the movement test inside the budget, park
vehicles next to what they are supposed to hit instead of driving there, and
avoid `resetSceneAndProbeControls` in 3D entirely (see below).

Two things would fix this, and the first is cheap:

- Expose `timeoutMs` (and `maxFrames`) as fields of a test, next to
  `description`. A test that legitimately needs 60 s of wall clock should be
  able to say so.
- **The wall clock is dominated by rendering, not by the game logic.** The
  profiler in the very same runs reports `avgStepMs` of **1.0–1.5 ms** for
  `starting-platformer` and **3.4–6.3 ms** for the 3D starters, while those
  runs advance at 85–310 ms of wall clock per stepped frame. Stepping is
  therefore **1–2 %** of the time; the rest is the render performed while
  `_maybeYield` waits on `requestAnimationFrame` (each animation frame costs
  hundreds of milliseconds with software WebGL). A headless CLI run does not
  need a render per simulated frame — a "render at most every N ms of wall
  clock" cap, or a `renderEveryFrame: false` run option, would make these
  tests roughly an order of magnitude faster without changing anything a
  test observes. Screenshots would just need a forced render before capture.
  Note that `result.performance.avgStepMs` being tiny while a test times out
  is itself confusing: the timeout message could mention how much of the
  budget went to rendering/yielding.

### 2. `getRelativePosition` / `lookTowardWithMouseDelta` measure from the object centre, not from the camera

This makes the FPS aiming helpers unusable on `starting-first-person-shooter`,
and the failure is silent — it reports success while aiming at nothing:

- The game's camera is at `Player.Z + Player.Depth` (the top of the capsule,
  z = 80), while `getRelativePosition` uses the player's **centre**
  (z = 40). The targets sit at z ≈ 44, so the harness computes
  `pitchDiff ≈ 0.37°`, decides the aim is already correct, and
  `lookTowardWithMouseDelta` returns `{aimed: true, pitchDiff: 0.37}` after
  stepping **zero frames**. Firing then sends the ray straight over the
  targets into the wall behind them (verified: the impact effect landed at
  z = 80, y = 0 — 173 units past the target). The real angle needed was
  3.3° **down**.
- Even with the right eye height it would not work, because the harness
  reads the pitch from `getRotationX()` while this game's
  `FirstPersonPointerMapper` pitches the player with `SetRotationY` (its own
  source even carries a `// TODO It's probably a bad idea to rotate the
  object around Y` comment). The harness would therefore measure a pitch
  that never moves, hit `maxUnresponsivePitchFrames`, and *undo* the vertical
  aim it had applied — ending up looking straight ahead again.

I ended up not using `lookTowardWithMouseDelta` at all and writing a small
proportional controller on `player.rotationY` with an explicit eye height of
`player.z + player.depth`. That works, but it required reading the
extension's `LookFromObjectEyes` events to find out where the camera is —
exactly the kind of digging the helper is meant to remove.

Suggestions:
- Let `getRelativePosition` take an eye/muzzle offset, e.g.
  `getRelativePosition('Player', target, { fromZ: player.z + player.depth })`,
  or aim from the **actual camera** of the object's layer when one exists.
- Expose the layer camera in a JSON-safe way — `getCameraState(layerName)`
  returning `{x, y, z, rotationX, rotationY, angle}`. Today the only route is
  `getRuntimeLayer(...)` and raw GDJS, and the docs explicitly discourage it.
- Derive the pitch from whichever rotation the game actually drives (or
  report both `rotationX` and `rotationY` deltas in the aim result) instead
  of assuming `rotationX`.

### 3. No way to aim a turret that is independent from the object

In `starting-3d-tank` the aiming direction is `Angle() + TopRotation()`
(a property of the `CombinedTank` custom object), not the object's angle.
`getRelativePosition().yawDiff` is therefore off by the whole turret
rotation and cannot be used. I recomputed the bearing by hand with
`Math.atan2` on the centres. A `yawDiff` that could be measured against an
arbitrary heading — `getRelativePosition(name, target, { heading: tank.angle
+ tank.state.TopRotation })` — would cover every turret/weapon/tower game.

### 4. `resetSceneAndProbeControls` is unusable in 3D under the current time budget

It is the recommended mandatory first step, but each probe restarts the
scene, and one scene load costs ~1.4 s of wall clock in these 3D starters
(measured). Probing four keys means six loads — baseline, four keys, plus
the final reset — so ~8 s of loading *plus* 5 × 40 = 200 stepped frames,
which is more than an entire test's budget on its own. In
`starting-3D-platformer` I
replaced it by reading `PhysicsCharacter3D.ForwardAngle` from the behaviour
state, which is exact and free; that only works because the character
behaviour happens to expose the heading. Ideas: a probe mode that does not
restart between keys (probe, release, wait for the object to settle, probe
the next), or a `probeFrames` default lowered for 3D.

### 5. Small gaps met along the way

- **No "was this object just created / destroyed" signal.** Several
  assertions ("a shell was fired", "an impact effect appeared") are written
  as before/after counts of `getObjects(...)`, which is fragile when the
  object is short-lived (the tank shell explodes ~22 frames after the shot,
  the FPS impact particle is a `ParticleEmitter3D`). An `eventLog` entry for
  object creation/deletion, or `harness.watchCreations('Bullet')` returning
  the ids created during a window, would express this directly.
- **No access to the sound that was played.** Coin pickup, gunshots and
  explosions all `PlaySound`; being able to assert "the pickup sound played"
  would be a very cheap, very direct check of "the mechanic fired" in games
  where the visible consequence is subtle.
- **Screenshots go to disk only.** `takeScreenshot` writes files next to the
  project; from a CLI batch it would help to have their base64 in the result
  JSON, or at least a note in the CLI output that
  `gameplay-test-screenshots/` was written (it must not be committed).

---

## What was complicated or surprising

### The CLI runner needs `GDEVELOP` set, or it fails with a misleading message

`GAMEPLAY_TESTS_STARTERS_SETUP.sh run <project.json>` defaults `GDEVELOP` to
`$HOME/GDevelop`. On this machine `$HOME` is `/root` while the checkout is
`/home/user/GDevelop`, so the `cd` inside `run_gameplay_tests` failed, the
electron command never ran, and the script reported
`ERROR: no results file was written - check the dev server is running`,
which sends you off to debug a dev server that was perfectly fine. Passing
`GDEVELOP=... bash ... run ...` fixes it. The script could `set -e` around
the `cd`, or check that `$GDEVELOP/newIDE/electron-app` exists up front.

### The setup script's step order breaks a fresh install

Step 3 (`npm install` in `newIDE/app`) runs before step 4 (pre-downloading
the piskel/jfxr/yarn editor zips with proxy-aware curl), but `npm install`'s
own postinstall runs `import-zipped-external-editors`, which uses a
non-proxy-aware downloader:

```
🌐 Outdated/non-existing piskel-editor, downloading it ...
❌ Can't download piskel-editor.zip (Error: Client network socket disconnected
   before secure TLS connection was established)
npm error command failed
```

The whole setup aborts. Moving the curl pre-download (step 4) **before** the
`npm install` of step 3 makes it work first time — the comment in the script
("so the import step finds them up-to-date and skips") already describes
that intent, the steps are just in the wrong order.

### `Jolt is not defined` — intermittent, breaks any Physics3D game

Two runs out of the ~30 runs of the 3D starters made here failed instantly
with:

```
ERROR  (0 frames, 13ms)
ReferenceError: Jolt is not defined
  at new b (.../Physics3DRuntimeBehavior.js:1:418)
  at b.getSharedData ...
  at u.loadFromScene (.../runtimescene.js)
  at g._loadNewScene (.../scenestack.js)
  at f.startGameLoop ...
```

The first scene is created before the asynchronously-loaded Jolt library is
available, even though `loadAllAssets` awaits
`getAllAsynchronouslyLoadingLibraryPromise()`. It is a race — the same
project run again immediately afterwards succeeds. Useful detail: it only
ever hit the **first test of a batch**; in the run above, the second test of
the same batch passed normally right after, so the library had finished
loading by then. *(Reported as already known and being fixed separately; the
tests here do not work around it.)*

### The result status can be misleading when a test's own step budget is too small

A test whose input is broken but whose `stepUntil` has a generous
`maxFrames` reports `timeout` (wall clock) rather than `failed`, and the
result then says nothing about which assertion did not hold. I checked this
by deliberately breaking the inputs of the two `starting-platformer` tests:
the jump test failed cleanly with
`Assertion failed: The player leaves the floor when jumping.`, while the
coin test only timed out. Sizing every `stepUntil` to roughly twice what the
working case needs turns those into clean failures — worth stating as a rule
in the guide, since the natural instinct is to leave `maxFrames` generous.

### Smaller surprises

- `getObjects('X')[0].behaviors.Y.state` throwing on an unknown name with
  the list of available names is genuinely great. `Object.keys(state)` also
  works on the proxy, which made a single exploration run enough to learn
  every state name of a game — worth documenting explicitly.
- Object snapshots have `centerZ`, and it is the coordinate that matters in
  every 3D check here; the guide's warning to prefer `centerX/centerY` over
  `x + width/2` should mention `centerZ` in the same breath.
- `getNearby(...)` sorts by distance, but ties are common in symmetric
  starter levels (`starting-3D-platformer` has two coins at exactly 393
  units). Tests that pick `[0]` need to stay correct for either of them.
- In `starting-3d-driving` the car's `EngineSpeed` idles at 1000, not 0, so
  "the engine is spinning" is not a proof that the accelerator works; the
  test compares against the idle value it measured rather than against zero.
- `setObjectPosition` on a physics body works exactly as documented,
  including for the `PhysicsCar3D` bodies — repositioning the car and the
  tank a short run-up away from their target is what made those two tests
  fit in the time budget at all.

---

## Suspected runtime bugs

1. **`Jolt is not defined` race at first scene load** (above) — a real
   runtime/boot ordering bug, not a test-harness one. Known/being fixed.
2. **`FirstPersonPointerMapper` pitches the player with `SetRotationY`.**
   The extension's own events carry `// TODO It's probably a bad idea to
   rotate the object around Y`. Whatever the right answer is, the harness's
   `pitchDiff` (which reads `getRotationX()`) and this extension disagree,
   so FPS aim helpers silently do nothing on this starter and every game
   built from it.
3. Not a bug, but worth knowing: in `starting-first-person-shooter` the
   "first click to focus" that engages the pointer lock **also fires the
   gun** (the shooting event only excludes the cursor being over the controls
   toggle). Tests must count impact effects from *after* that click, not
   from the start of the scene.

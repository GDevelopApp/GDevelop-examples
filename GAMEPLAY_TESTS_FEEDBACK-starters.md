# Gameplay tests feedback — the `starting-*` games

Adding one or two gameplay tests to each starter game of the repository,
and reporting what the harness made easy, hard or impossible. This document
grows as the batches progress.

## Coverage

| Starter | Tests |
| --- | --- |
| `starting-platformer` | Jumping with Space · Collecting the coins by running into them |
| `starting-platformer-pixel` | Jumping with Space · Collecting the coins by running into them |
| `starting-3D-platformer` | Jumping with Space · Collecting a coin by walking into it |
| `starting-3d-driving` | Accelerating drives the car forward · Running a traffic cone over knocks it away |
| `starting-3d-tank` | Firing a shell with F · Blowing a target away with a shell |
| `starting-first-person-shooter` | Walking and strafing with WASD · Shooting a target |
| `starting-top-down` | Moving in the four directions · Walls block the player |
| `starting-top-down-pixel` | Moving in the four directions · Walls block the player |
| `starting-flappy-bird` | Flapping with Space · Touching a hazard restarts the run |
| `starting-clicker` | Clicking earns money · Buying the passive upgrade |
| `starting-shootemup` | The ship fires on its own · Enemies take several hits to be destroyed |
| `starting-endless-runner` | Running and jumping · Touching a hazard restarts the run |
| `starting-twin-stick-shooter` | Aiming and firing with the mouse · Enemies take several hits to be destroyed |
| `starting-vampire-survivor` | The player shoots the nearest enemy on its own · Being touched by an enemy ends the run |
| `starting-2d-driving` | Driving and steering · Running into a bush pushes it away |
| `starting-physics` | The ball falls and rests on the ground · Dragging the ball with the mouse |
| `starting-physics-pixel` | The ball falls and rests on the ground · Dragging the ball with the mouse |
| `starting-2d-car-racing` | Driving and steering · Running into a bush pushes it away |
| `starting-beatemup` | Attacking hits the enemy · The player cannot walk while attacking |
| `starting-point-and-click` | Clicking sends the player there · The player walks around obstacles |
| `starting-point-and-click-pixel` | Clicking sends the player there · The player walks around obstacles |
| `starting-2d-platformer-shooter` | Shooting in the direction the player faces · Shooting a target destroys it |
| `starting-quiz` | Only the right answer moves on · Answering every question finishes the quiz |
| `starting-draggable-tiles` | Dragging a piece onto a free cell · Dropping a piece on a taken cell sends it back |
| `starting-tile-placement` | Picking a tile type · Placing a tile on the board |
| `starting-card-game` | Drawing a card from the deck · Putting a card back in the deck |
| `starting-rts-unit-selection` | Selecting a unit and ordering it to move · Selecting every unit at once |
| `starting-top-down-rpg` | Talking to an NPC · Saying yes in the dialog |
| `starting-first-person` | Walking and strafing with WASD · Jumping with Space |
| `starting-first-person-horror` | Walking and strafing with WASD · The monster comes after the player |
| `starting-first-person-shooter-horror` | Walking and strafing with WASD · Shooting leaves an impact |
| `starting-3d-shootemup` | The ship fires on its own · Enemies take several hits to be destroyed |
| `starting-3d-twin-stick-shooter` | Aiming and firing with the mouse · Enemies take several hits to be destroyed |
| `starting-3d-vampire-survivor` | The player shoots the nearest enemy on its own · Being touched by an enemy ends the run |
| `starting-3d-car-racing` | Accelerating drives the car forward · Driving over the finish line counts a lap |
| `starting-3d-endless-runner` | Running and jumping · Touching a hazard restarts the run |
| `starting-3d-draggable-tiles` | Dragging a piece onto a free cell · Dropping a piece on a taken cell sends it back |
| `starting-3d-tile-placement` | Picking a tile type · Placing a tile on the board |
| `starting-3d-rts-unit-selection` | Selecting a unit and ordering it to move · Selecting every unit at once |

Every test listed here passes, and each was run several times in a row to
check for flakiness. They are also run on CI against the latest Linux build
of GDevelop published on S3 (see `scripts/run-gameplay-tests.js`).

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
- **`starting-first-person-horror`** — Movement: the same WASD scheme (the
  Player is set up identically to the FPS one), so the movement test is the
  same test. Monster: the whole game is "something is chasing you", so the
  monster is brought within reach and then the player is left completely
  alone — anything that closes the gap is the monster deciding to come.
- **`starting-first-person-shooter-horror`** — Movement: same again.
  Shooting: clicking has to leave a mark on the world. The player is not
  moved or aimed at all, it simply shoots straight ahead into the level, and
  the test checks an impact effect appeared where there was none, in front
  of the player.
- **`starting-3d-shootemup`** — Same two tests as the 2D shoot'em up, which
  is exactly the point: the game is a top-down shooter that happens to be
  drawn in 3D, so the ship firing on its own, the bullets flying right and
  the arrow keys moving the ship are the same contract, and an enemy put in
  the line of fire has to lose its three points of health and be destroyed.
- **`starting-3d-twin-stick-shooter`** — Aiming: the player turns toward the
  mouse and fires while the button is held, and the bullets fly where it
  aims. Enemies: same "several hits then destroyed" check, with the enemy
  placed in the line of fire. Both aims are straight up or straight down
  because of the 3D camera (see below).
- **`starting-3d-vampire-survivor`** — Auto-fire: the player shoots the
  nearest enemy in range without any input, which is the whole premise of the
  genre, so the test puts one enemy in range and checks nothing was fired
  before that. Death: an enemy reaching the player has to end the run.
- **`starting-3d-car-racing`** — Driving: the accelerator revs the engine and
  drives the car along its heading, and it stays put otherwise. Lap: what
  makes it a *race* rather than a driving game, so the car is lined up a
  short run-up before the finish line and driven over it — the lap counter
  has to go up and the next checkpoint has to become the first of the new
  lap.
- **`starting-3d-endless-runner`** — Running and jumping: the player runs on
  its own and Space is the only control, so the test checks it moves right
  with nothing pressed and that a jump reaches the height its behavior is
  configured for. Hazard: touching one has to end the run and restart the
  scene.
- **`starting-3d-draggable-tiles`** — Dragging a piece to a free cell and
  seeing it snap onto the 64×64 grid, and dropping one on a cell that is
  already taken and seeing it go back where it came from. The second is the
  rule that makes the board a board rather than a pile of movable models.
- **`starting-3d-tile-placement`** — Picking a tile type in the toolbar shows
  what is about to be placed and picking it again stops placing (the toolbar
  is a toggle, which is easy to break); then placing that tile on the board,
  checking it lands on the cell the indicator was showing and that clicking
  the same cell again does not stack a second one. A click on the board
  *before* picking a type is included as the control that places nothing.
- **`starting-3d-rts-unit-selection`** — A drag box selects one unit and a
  click sends it walking while the others stay put; then a box over all the
  units sends the whole group. Same two tests as the 2D version, but the
  selection box had to be drawn in screen coordinates (see below).

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

An extra cost of the ceiling being this low: a passing test is not
necessarily a *safe* one, and this is not hypothetical — it turned a CI run
red. `starting-3d-driving`'s cone test passed locally at 27.6 s and timed out
at 30.1 s on CI, and the two next-slowest tests (26.1 s and 26.0 s) were one
bad container away from the same fate. Nothing had warned about any of them:
the local runs said PASSED.

The distribution is the problem. Across the 78 tests of that CI run the
median is about 4 s, but the slowest ten are all 3D scenes between 17 s and
30 s, and the *same* test can take 19.8 s in one game and 26.0 s in another
that only differs by scene weight. So the useful signal is not the absolute
duration, it is the fraction of the budget used. Two cheap things would have
caught all of this before the merge:

- report the wall-clock time against the limit in the run output (`24.8s /
  30s`), so a test at 80 % of its budget is visible without doing arithmetic;
- optionally fail — or at least warn loudly — when a test finishes within,
  say, 20 % of the ceiling, the same way a test suite warns about slow tests.

**Shortening the tests is not enough on its own**, and the next CI run proved
it. A different test timed out — `starting-3d-endless-runner`'s hazard test,
which had passed at **14.0 s** in the previous run — and the numbers show it
was not the test's fault and not a globally slow machine either: it stepped
*68 frames in 30.3 s* where it had stepped *73 frames in 14.0 s*, while the
run's overall median (7.2 s → 7.5 s) and total (723 s → 699 s) barely moved.
The per-frame render cost simply doubled for that game, in that run, on the
same `large` resource class.

That is not something a test author can size for: with a 30 s ceiling and 3D
frames at 200–450 ms, a 2× swing puts *any* test above ~15 s at risk, and
15 s is roughly the floor for a 3D test that does anything at all. So the CI
runner now **re-runs a game once when its run failed only with wall-clock
timeouts**, and never when an assertion failed — a timeout says something
about the machine, a failed assertion says something about the game. Both
paths are verified: a forced timeout retried and went green with a warning,
and a deliberately failing assertion failed immediately with no retry.

This is a workaround for the missing `timeoutMs` field, not a substitute for
it. A test that could declare the budget it needs would not need any of this.

Alongside that, I went back over every test above 20 s and shortened it (the
worst is now 18 s locally). Three techniques did all the work, and they are
worth recommending in the guide because none of them weakens a test:
**stop measuring as soon as the thing has happened** — `stepUntil(() =>
displacement > 30)` instead of `stepFrames(15)` then checking, which turned
the tank's target test from 26.1 s to 18.0 s and the FPS shooting test from
20 s to 12.3 s; **shorten the run-up rather than the assertion** — the
driving test now lines the car up 90px from the cone instead of 120px;
and **lower a threshold to match a shorter window instead of keeping the
window** — the "walking" checks measure 15 frames rather than 22, with the
bar dropped from 30 to 15 units, still five times the measured standing
drift of under 3.

#### Follow-up: the render cap landed, and it fixes 2D but not 3D

Master commit `4cc37b4` adds `FAST_RUN_RENDER_INTERVAL_MS = 250` — in an
unpaced run the game renders at most once every 250 ms instead of once per
stepped frame — and reports each test's time against its budget
(`95 frames, 4.0s / 30s budget`), which is the other thing asked for above.
I built it locally and re-ran four games against the previous commit on the
same machine, same dev build, same tests:

| Game | Test | Before | After | Speed-up |
| --- | --- | --- | --- | --- |
| `starting-platformer` | Jumping with Space | 97 ms/frame | 34 ms/frame | **2.9×** |
| `starting-platformer` | Collecting the coins | 93 ms/frame | 43 ms/frame | **2.2×** |
| `starting-3D-platformer` | Collecting a coin | 468 ms/frame | 350 ms/frame | 1.3× |
| `starting-3d-driving` | Accelerating | 462 ms/frame | 367 ms/frame | 1.3× |
| `starting-3d-driving` | Running a cone over | 438 ms/frame | 371 ms/frame | 1.2× |
| `starting-first-person` | Walking and strafing | 384 ms/frame | 328 ms/frame | 1.2× |
| `starting-first-person` | Jumping with Space | 407 ms/frame | 350 ms/frame | 1.2× |

2D is transformed — the platformer's coin test went from 22.3 s to 10.2 s. 3D
barely moved *on that machine*, and the profiler says why: on
`starting-3d-driving` the average step is **4.25 ms** while a frame costs
**371 ms** of wall clock, so **367 ms per frame is still not stepping**. A
frame is still being rendered essentially every time.

The reason is that the cap bounds the *interval* between renders, and a single
3D render on that machine already costs more than that interval. Once a render
takes ~350 ms, `now - lastRender >= 250` is true again the instant it
finishes, so no render is ever skipped and the cap does nothing.

**Correction, from real CI hardware.** The build published to S3 now has the
cap, so the same 76 tests can be compared before and after on CircleCI, at
identical frame counts. There, 3D *does* benefit — my sandbox simply renders
more slowly than a CI container, which put it on the wrong side of the
threshold:

| | Speed-up on CI |
| --- | --- |
| Whole suite (76 tests, 661 s → 390 s) | **1.7×** |
| Best 2D cases (`starting-endless-runner`, `starting-clicker`, …) | **3–7.5×** |
| 3D and first-person games | **1.2–2.9×**, typically ~1.6× |
| A few very short tests | 0.7–0.8× (slightly slower) |

So the change is a clear win, and the analysis above still holds — it just
describes a threshold rather than a wall. The benefit fades as a render
approaches 250 ms and disappears once it exceeds it, which is exactly the
heavy-3D end where the budget is tightest: on CI, `starting-3d-tank`'s and
`starting-first-person-shooter`'s tests are still 250–300 ms per frame and
gained the least (1.2–1.5×). The handful that got *slower* are short tests
that hardly rendered anyway, where the per-frame `setTimeout` yield is now the
cost.

Two ways to make it work for 3D, in increasing order of effect:

- **Bound the duty cycle instead of the interval.** After a render that took
  `R` ms, wait until roughly `4 R` ms of stepping have elapsed before the next
  one. That caps rendering at a fixed *share* of the run (here ~20 %) whatever
  a render costs, instead of assuming it costs less than 250 ms. On the 3D
  numbers above that alone would be worth about 4×.
- **Do not render at all in a CLI run**, except the forced render before a
  screenshot. Nothing a test observes comes from the renderer, and at 4–15 ms
  of stepping per frame the 3D starters would run 20–70× faster than today —
  which would retire the whole 30 s problem rather than easing it.

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

### 6. No way to read or set an object variable

Object variables drive a lot of game state, and the harness only half
exposes them:

- **Reading** works, but by hand: `snapshot.variables` is the raw
  `getNetworkSyncData()` array, so every read is a
  `variables.find(one => one.name === 'Level').value` with a null check. A
  `getObjectVariable(idOrName, variableName)` (or a plain
  `snapshot.variableValues` map next to the array) would remove that
  boilerplate from every test that touches game state.
- **Writing** is not possible at all: `setSceneVariable` and
  `setGlobalVariable` exist, there is no `setObjectVariable`. In
  `starting-clicker` the price of the upgrade lives in an object variable of
  the button, so the only way to reach "the player can afford the upgrade"
  was to actually click the clicker **20 times** (80 stepped frames). With a
  `setObjectVariable` the test could have arranged the interesting state
  directly, as `goToScene(..., {skipCreatingInstances: true})` + `spawn`
  allows for everything else. This is the "jump into the middle of the game"
  story, but for object driven state.

### 7. No access to an object's custom points

`starting-2d-car-racing` decides whether a checkpoint counts by comparing the
direction of the checkpoint arrow — given by its custom point
`CheckpointArrow.PointX("TravelDirection")` — with the angle to the car. A
test cannot read that: the snapshot exposes `x`, `centerX`, `width`... but
nothing about the object's points, and there is no `getObjectPoint(id,
name)`. Without it there is no way to know which side of a checkpoint the car
must approach from, so **the lap and checkpoint logic of that starter is not
covered** (only its driving is). Points are used by a lot of games to mark
muzzles, spawn positions and directions — `snapshot.points` (a name to
`{x, y}` map) would unlock all of them.

### 8. The Flippable capability is not in the snapshot

A side view character's facing direction is core state — in
`starting-2d-platformer-shooter` the events literally branch on
`FlippedX` to decide which way the bullet goes. A test cannot read it:
`snapshot.state.FlippedX` throws with `Available: AnimationFrameCount,
Sprite`. `animation`, `opacity` and `text` are all promoted to snapshot
fields, and `flippedX` / `flippedY` belong next to them. (The error message
listing the available names is genuinely great — it is what made this
diagnosable in one run.)

### 9. No way to ask what is at a position

`starting-tile-placement` only lets a tile be built on some cells: the
events refuse the click when the placement indicator collides with the
tilemap or with an already placed tile. A test cannot ask the same question —
there is no `getObjectsAt(x, y)`, no collision query, and tilemap contents
are not exposed at all — so the test has to **click candidate cells until one
is accepted** and only then start asserting. It works (and the search is
honest setup, clearly separated from the checks), but a
`getObjectsAt(x, y, objectNames?)` would replace the scan with a statement of
intent, and would help any game built on a grid, an inventory or a board.

### 10. Selection (and anything held by a free condition) is invisible

In `starting-rts-unit-selection`, whether a unit is selected lives in
`RTSUnitSelection::IsSelected`, a **free** condition of an extension — not an
object condition — so it appears nowhere in the object snapshot. The
"Selected" visual is an object *effect*, and whether an effect is enabled is
not exposed either. The tests here work around it by checking selection
through its consequence (the selected units accept a move order and the
others do not), which is arguably a better test — but it only exists because
ordering a move is an immediate, observable consequence. A selection with no
such consequence would simply not be testable.

Two things would close this: evaluating an extension's **free** conditions
that take an object list (they are as much "state of this object" as the
object conditions are), and putting the enabled effects of an object in the
snapshot (`effects: { Selected: true }`).

### 11. The parts of a custom object report their position *inside* the object

`snapshot.children` is what makes a custom object testable — in
`starting-top-down-rpg` it is the only way to reach the "Yes" button of the
`TwoChoicesDialogBox`. But the coordinates of the children are **local to the
parent**, while the documentation of `centerX`/`centerY` says they are scene
coordinates ("Use centerX/centerY (never x + width/2)"). It shows in the
numbers: the dialog sits at `x: 320, y: 416` in the scene and its
`TextBorder` part reports `x: 0, y: 0`. Clicking a child at its reported
`centerX`/`centerY` therefore clicks the wrong place, silently — the test
just observes that nothing happened. The children also report the parent's
*internal* layer (`""`), not the layer the parent is on (`"Dialog Layer"`),
so the layer has to be taken from the parent too.

The working conversion is:

```javascript
const x = parent.x + child.x + child.width / 2;
const y = parent.y + child.y + child.height / 2;
harness.setMousePosition(x, y, parent.layer);
```

Either make the children's `centerX`/`centerY` scene coordinates like every
other snapshot (preferred — that is what the field is documented to be), or
say clearly in the guide that children are in the parent's space and give
this conversion.

**Fixed** in master commit `4cc37b4`, the preferred way: children's positions
are converted to the parent's coordinate space and they now report the
parent's layer, so `setMousePosition(child.centerX, child.centerY,
child.layer)` works and the conversion above is gone from the test.

Worth noting how it surfaced, because it will happen again as the harness
improves: the fix *broke* the test that had worked around the old behaviour.
The workaround added the parent's origin to a child position that was now
already in scene coordinates, so the click landed off the button and the
assertion reported `2 NPCs left of 2` — a failure that says nothing about
what changed. Nothing was wrong with either the engine or the test on its
own. It is an argument for the harness treating the shape of a snapshot as an
API with a version, or at least for these behaviour changes being called out
in the release notes the examples repository pins against, since a test suite
in a separate repository cannot see them coming.

### 12. Custom objects hide the state a test wants

`ScoreCounter`, `PanelSpriteButton`, `PanelSpriteContinuousBar`,
`CombinedTank`... are events based custom objects, and their useful state is
spread over three different places: the object's own conditions/expressions
(`state.Score`), their properties (`state.PropertyX`), and plain object
variables (`variables`). Nothing in a project tells a test author which one
holds what. `console.log(Object.keys(snapshot.state))` on a first run is the
only practical way to find out — worth mentioning explicitly in the guide,
next to the (excellent) "reading an unknown state throws with the list of
available names" behaviour.

### 13. `setMousePosition` is wrong on a layer drawn by a 3D camera

`setMousePosition(sceneX, sceneY, layer)` converts scene coordinates to
screen coordinates the 2D way, so on a scene rendered through a 3D
perspective camera the cursor does not end up where the test asked. In
`starting-3d-twin-stick-shooter` (a top-down game whose camera sits above and
behind the player) the error is large and one-sided:

| Aim asked for, relative to the player | Angle the player should turn to | Angle it turned to |
| --- | --- | --- |
| 300 right | 0° | **-29°** |
| 300 up | -90° | -90° |
| 300 right and 300 up | -45° | **-58°** |
| 300 left | 180° | **-151°** |

The vertical axis is exact — a point straight above the player projects to a
point still straight above it, whatever the camera's tilt — and everything
else is off by up to 30°. The failure is silent: the mouse *is* placed
somewhere, the game aims at it perfectly, and only an assertion on the
resulting angle reveals that it is not the direction the test meant.

The cause is in the engine, and the two halves of the round trip disagree by
design. `setMousePosition` calls `layer.convertInverseCoords`, whose own
comment says *"This method doesn't handle 3D rotations"*; the game reads the
cursor back through `layer.convertCoords`, which says *"This method handles
3D rotations"* and delegates to `renderer.transformTo3DWorld` when the camera
is rotated in 3D. So on a 3D layer the harness places the cursor with the flat
2D transform and the game interprets it with the perspective one. Making
`setMousePosition` invert `convertCoords` (rather than duplicate the 2D
transform) would fix every 3D game at once.

**A workaround that works today**, and which the `starting-3d-draggable-tiles`
tests use: `getRuntimeLayer(name)` hands over the real `gdjs.RuntimeLayer`, so
a test can call the *correct* conversion itself and search for the screen
position that maps to the scene point it wants — start at the middle of the
screen, and step toward the target along the conversion's own slope
(estimated with two extra samples). It converges in a handful of iterations,
costs no frame, and round-tripped exactly in that game: a piece grabbed at its
centre, dragged two cells over and dropped snapped precisely onto the cell it
was aimed at. So the fix is cheap — the right transform is already reachable,
`setMousePosition` just isn't using it.

In `starting-3d-twin-stick-shooter` I had already worked around it the poorer
way, by only ever aiming straight up or straight down. That is enough to test
"the player aims where the mouse points" but rules out checking a diagonal
aim, or keeping a crosshair on a moving target.

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
tests here do not work around it.)* One data point that made it easy to
reproduce: `starting-first-person` hit it **every time**, on whichever of its
two tests ran first — its first test was red for that reason alone, and both
tests passed whenever they were not the first to run.

**Fixed — verified.** GDevelop master commit `ba74a65` ("Wait for the game to
be fully booted before running a gameplay test") adds
`RuntimeGame.isStartingUp()` and makes the runner wait on it before starting a
test, so a run request that arrives mid-boot no longer creates scenes before
the asynchronously loaded libraries are ready. I built that commit locally and
ran `starting-first-person` four times in a row: **8/8 tests passed**, against
a build without the fix that failed the first test on every single run. Nothing
in the tests had to change. Worth keeping the reproducer in mind for any future
regression: a Physics3D game whose *first* test is the one that boots the game
is the case that breaks, and it is invisible in any game whose first test
happens to run second.

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

### Thresholds should come from the behavior, not from a measurement

The first version of the platformer jump test asserted `jumpHeight > 150`,
a number read off a run. It is both weaker and less portable than it looks:
`starting-platformer-pixel` is the same game with `jumpSpeed` 360 instead of
717, so the constant broke immediately. Reading the configuration out of the
behavior state instead:

```javascript
const { JumpSpeed, Gravity } = player.behaviors.PlatformerObject.state;
const expectedHeight = (JumpSpeed * JumpSpeed) / (2 * Gravity);
harness.assert(jumpHeight > 0.8 * expectedHeight, '...');
```

turns "it moved a bit" into "it moved as far as it is configured to", and
the same test file then works unchanged on both variants. The same trick
works for `TopDownMovement` (`Acceleration` / `MaxSpeed` give the distance a
key press should cover). **This is probably the single most useful thing to
put in the guide**: the state exposes the configuration, not just the
current values, so tests rarely need magic numbers.

### The same game, two variants, two different behaviours

The `-pixel` starters are the same games with different art — and different
behavior settings. `starting-top-down-pixel` has `rotateObject: false` where
`starting-top-down` has it `true`, so an assertion on the *object's* angle
passes on one and fails on the other. Asserting on the behavior's own
movement angle (`behaviors.TopDownMovement.state.Angle`) works on both, and
is closer to what the test means anyway ("the player moves in the direction
of the key"). General rule confirmed: prefer behavior state over object
properties, even when the object property looks like the obvious signal.

### Chained measurements are polluted by the game's own physics

Measuring the four directions of `starting-top-down` in a row inside one
scene failed: `SeparateFromObjects` pushes the player away from the plants it
bumps into, so the second and third direction started from a nudged position
with a sideways velocity. Restarting the scene before each measurement
(`goToScene` costs about 3 frames in 2D) makes each one independent and
deterministic. In 3D the same reset costs ~1.4 s of wall clock, so the same
pattern is not affordable there — one more consequence of the timeout issue
above.

### Prefer what the level already does over arranging it

For `starting-endless-runner` the first version of the "hazard ends the run"
test spawned a hazard on the player's path. It failed, and the reason is
worth recording: the player auto-runs, and the level's **own** first hazard
is closer than anything a test can usefully place, so the run always ended
before reaching the spawned one. Dropping the `spawn` entirely made the test
both simpler and stronger — it now checks that the game's own level kills
the player. The debugging that got there was a `console.log` of the player
and hazard positions every ten frames, which is genuinely the most effective
tool in the harness.

The same run also showed a trap in how "did we reach it" is expressed:
comparing the player's **centre** to the hazard's **centre** never becomes
true, because the collision (and the scene restart) happens when the
bounding boxes touch, well before the centres meet. Assertions about
reaching something should be written on the distance between the objects,
not on their coordinates crossing.

### `stepUntil` conditions make silent false greens very easy to write

This one cost a real bug in a committed-looking test, and it is a trap
anybody writing "wait until it settles" will fall into. The condition given
to `stepUntil` is evaluated **without stepping a frame first**, so a
condition that reads the same value twice, or compares against a variable it
updates itself, is true immediately:

```javascript
// Silently passes without stepping a single frame:
let restingY = getBall().centerY;
const settled = await harness.stepUntil(() => {
  const current = getBall().centerY;
  const isStill = Math.abs(current - restingY) < 0.5;
  restingY = current;      // updated by the condition itself
  return isStill;
}, { maxFrames: 400 });
```

The test still *passed*, and it was only noticed because fixing it changed
the frame count. The working form keeps the state in `onFrame` (which does
run after each stepped frame) and keeps the condition pure:

```javascript
let previousY = getBall().centerY;
let stillFrames = 0;
const settled = await harness.stepUntil(() => stillFrames >= 20, {
  maxFrames: 400,
  onFrame: () => {
    const currentY = getBall().centerY;
    if (Math.abs(currentY - previousY) < 0.5) stillFrames++;
    else stillFrames = 0;
    previousY = currentY;
  },
});
```

Two suggestions: say explicitly in the guide that **the condition must be
pure and the state must live in `onFrame`**, and — since "wait until this
object stops moving" is needed by every physics game — add a
`stepUntilStable(objectName, { frames, tolerance, maxFrames })` to the
harness. `stepUntil` already has `stuckDetection`, which is the same idea
pointed at a different purpose.

### Hand-rolled overlap checks are not worth it

Checking "the player did not walk through the obstacle" by comparing
bounding boxes from `width`/`height` failed on a run where the player passed
96px away from a 64x64 obstacle: sprite dimensions include their transparent
margins, so the hand-made overlap box was far bigger than what the game
considers a collision. What worked, and says more, was asserting the
**shape of the path** instead: the start and the destination were put at the
same height, so walking straight would keep the player on that line, and
going around shows up as a measurable detour off it.

The general lesson: when the question is "did it go around / did it get
there", assert on the trajectory or on the behavior's own state, not on a
geometry test reconstructed from the snapshot. `has2dLineOfSight` exists but
answers a different question (is the straight line blocked *now*).

### Short lived objects cannot be measured over a window

The natural way to check "which way did the bullet go" is to note its
position, step a few frames, and look again. In
`starting-2d-platformer-shooter` that failed: bullets are deleted the moment
they touch a target, and the one fired to the left died after ~8 frames —
before the measurement window closed. Worse, the helper returned `null` both
when *nothing was fired* and when *the bullet was already gone*, so the
failure message said "Pressing X fires a bullet after turning around", which
is the opposite of what happened. It took a frame by frame
`console.log` of the object count to see the bullet had been there all along.

Two lessons. For the test author: prefer an **instantaneous** signal over a
delta measured across a window — here the bullets have `RotateBullet`
enabled, so `bullet.angle` (0 or 180) says the direction immediately and the
test became both shorter and more precise. And never let one `null` mean two
different things. For the harness: this is the same missing piece as the
object creation signal above — "what was created during this window, and
where did it go" is not answerable today.

### Arrange by moving the *other* object, not the physics character

`starting-first-person-horror` needs the monster and the player near each
other, and the obvious way to arrange that is `setObjectPosition` on the
player — it is the object the test is about. That went badly: the player is a
Physics3D character, and dropping it at a spot the test picked from
coordinates alone put it inside or above unknown terrain, after which the
physics engine threw it around. The player moved 378, then 48, then 944 units
in three consecutive runs *while no key was pressed*, which of course
destroys any "did the monster close the gap" measurement.

Moving the **monster** instead fixed it, and moving it *along the line
between the two* rather than to an arbitrary offset kept it on ground both of
them can stand on. The general rule that came out of this: when a test needs
two objects near each other, reposition the one whose exact physics state the
test does not depend on, and place it relative to the other one rather than
at absolute coordinates. The test then also gets a free sanity check —
`playerMoved < 20` asserts the player really was left alone, so a repeat of
this failure mode shows up as an explicit failure instead of a wrong number.

A harness-side fix would help here: there is no way to ask "is this position
free / on the ground", and no way to place an object in a way the physics
world accepts (`setObjectPosition` teleports the render position and lets the
simulation catch up). A `placeObjectNear(objectId, otherId, distance)` that
does the right thing for physics bodies would make this class of arrangement
one line and remove the trial and error.

### A "warm up" input that itself triggers game logic ruins before/after counts

The FPS tests use a first click to take pointer lock before doing anything
meaningful, so that habit was carried into
`starting-first-person-shooter-horror`'s shooting test. It made the test fail
in a confusing way: the count of impact particles went from 1 to 1. The dummy
click *was itself a shot*, it created a particle, and that particle expired
during the frames the test stepped before the real click — so the "before"
count was not 0, the "after" count was not 2, and the assertion
`after > before` was simply false while the game was working perfectly.

Removing the dummy click entirely was the fix — shooting only reads the mouse
button, pointer lock is irrelevant to it — and the test got stronger as a
result: it can now assert `particlesBefore === 0`, which pins down that the
one particle observed at the end is unambiguously the one the test's own
click created. Two things generalise: a warm-up input is only safe if it is
genuinely inert for the thing being measured (check what it triggers before
adding one), and any before/after count over short-lived objects should
assert the "before" value, not just the direction of the change. This is the
third test in this batch of work where short-lived objects made a
straightforward count unreliable — see also "Short lived objects cannot be
measured over a window" above.

### A drag box is a screen rectangle, and in 3D that is not a map rectangle

`starting-3d-rts-unit-selection` selects units by dragging a box over them.
The 2D version of the same game is tested by computing the box from the units'
positions on the map, and porting that verbatim selected five of the six
units: the sixth sat inside the rectangle on the map and outside the
quadrilateral that rectangle becomes on screen once a 3D camera looks at the
ground at an angle.

The failure is a bad one to debug, because everything about it looks right —
the box is drawn, five units light up, and the assertion just reports a count.
It took logging each unit's travelled distance to see that one had moved
exactly 0 rather than "not far enough", which is what pointed at selection
rather than at pathfinding.

The fix is to think in the coordinates the player actually works in: the box
the player drags is a rectangle *of the screen*. Converting each unit's
position to screen coordinates first (with the search described in item 13)
and taking the bounding box there selected all six. Worth a line in the guide:
anything the player draws or points at is screen-space, and on a 3D layer that
is a genuinely different space from the scene, not just a scaled one.

### A death that slows time down costs six times its `Wait` in frames

Several starters end a run the same way: `ChangeTimeScale 0.15`, `Wait 0.15`,
then restart the scene. A `Wait` counts in *scene* time, so at a time scale of
0.15 that 0.15 second takes a full second of real time — about 60 stepped
frames, not the 9 the number suggests. In `starting-3d-vampire-survivor` I
sized the window from the `Wait` value and the test failed with the player
still 62px from its starting point, which reads like "the death was not
detected" rather than "the window was too short by a factor of six".

Two things would help. The `Wait` and the time scale are both visible to the
engine, so a `stepUntil` that times out could say how much *scene* time
elapsed next to the frame count — a test author would immediately see the
scene ran 0.09 s while they were expecting 0.6 s. And it is worth calling out
in the guide, because "slow time down, wait, restart" is a very common
starter pattern and every test that checks a game-over has to step through
it.

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
- Clicking an events based button works exactly as expected with
  `setMousePosition(x, y, layerName)` + press / step / release / step. Using
  the snapshot's `centerX`/`centerY` (not `x`/`y`) matters: several of these
  objects have a non centered origin.
- A "restart the scene" mechanic (`starting-flappy-bird` restarts the run
  when the bird touches a hazard) has no direct signal in the harness:
  `getSceneName()` is unchanged and the `sceneReset` entry of the event log
  is not readable from a test script. Observing that the player object is
  back at its spawn position works, but a `getSceneRestartCount()` (or
  exposing the event log to the script) would say what the test means.
- `spawn(name, x, y)` places the object's **origin** at `x, y`, so an object
  whose origin is not its centre lands offset. Spawning then correcting with
  `setObjectPosition(id, x + (wantedCenterX - snapshot.centerX), ...)` works,
  but a `spawn(..., { centered: true })` (or simply returning a snapshot that
  can be fed back) would remove a very repetitive three lines. Note also that
  the snapshot returned by `spawn` is a *value*: it does not follow the
  object, so re-reading it after a correction requires a `getObjects().find()`.
- Games that end a run by restarting the scene (`starting-flappy-bird`,
  `starting-endless-runner`, `starting-vampire-survivor`) are all tested the
  same way here: move the player away from its spawn point, then wait for it
  to be back there. It works, but three different games needed the same
  workaround for the missing "the scene restarted" signal.
- Picking "the object under the player" from a group of same-named instances
  needs care: `starting-physics` has six `Ground` instances, four of which are
  small angled ramps, and the obvious "the highest one near the ball" picked a
  ramp 45px above the actual floor. Choosing the widest instance (the floor)
  was both simpler and right. A game-agnostic "what is this object resting
  on" would need engine support; picking by a distinctive property is the
  practical answer.
- `behaviors.X.act` (whether a behavior is activated) turned out to be the
  cleanest way to test a mechanic in `starting-beatemup`, where attacking
  deactivates the movement behavior so the player is rooted during the
  animation. It deserves a mention in the guide: it is not obvious that the
  snapshot answers "is this behavior currently switched off".
- `snapshot.animation` makes animation driven games easy to test: in a
  beat'em up the whole state machine *is* the animation name
  ("Idle" / "AttackBuildUp" / "AttackStrike" / "Hurt"), so the test reads
  exactly like the events do.
- The Pathfinding behavior exposes `PathFound` and `DestinationReached`,
  which replaced a distance threshold that was making a test fail for the
  wrong reason (the player was still walking the last few pixels). Another
  case of "the behavior state says what the test means".
- Structure and array scene variables read back exactly as expected:
  `getSceneVariable('QuestionList').children` is an array of entries that
  each carry their `name`, `type` and `value`, which made the
  `starting-quiz` tests read the game's own data (the questions and which
  answer is the right one) instead of hardcoding it. That test would have
  been meaningless written any other way.
- The drag recipe in the guide (move to the centre, press, move in small
  increments, release) works exactly as written for the `Draggable`
  behavior — `starting-draggable-tiles` passed first try with it.
- Games with a grid make for the sharpest assertions in this whole batch:
  `dropped.x % 64 === 0` and "it went back to the cell it came from" are
  exact, with no tolerance to tune. When a game states a rule that precisely,
  the test should assert the rule and not an approximate position.
- When arranging a drop position, the size of the dragged object matters
  more than it looks: `starting-card-game` uses 140x190 cards, so dropping
  one on the placement area *nearest* the deck still left it overlapping the
  deck, and the game put it straight back — the test then reported "the drawn
  card is not on the table", which is true but misleading. Choosing the
  placement area furthest from the deck fixed it. Snapshots carry `width` and
  `height`: a test that positions things should use them.
- Checking a dialog through its **layer** visibility
  (`getRuntimeLayer('Dialog Layer').isVisible()`), exactly as the guide
  recommends, is what made `starting-top-down-rpg` easy: the game shows and
  hides a whole layer, and the test reads like the events do.
- `setObjectPosition` on a physics body works exactly as documented,
  including for the `PhysicsCar3D` bodies — repositioning the car and the
  tank a short run-up away from their target is what made those two tests
  fit in the time budget at all.

---

## Suspected runtime bugs

1. **`Jolt is not defined` race at first scene load** (above) — a real
   runtime/boot ordering bug, not a test-harness one. **Now fixed** by master
   commit `ba74a65`, and verified here over four consecutive runs of
   `starting-first-person`, the game that reproduced it every time.
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

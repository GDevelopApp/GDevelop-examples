![GDevelop logo](https://raw.githubusercontent.com/4ian/GDevelop/master/newIDE/GDevelop%20banner.png 'GDevelop logo')

GDevelop is a **full-featured, no-code, open-source** game development software. You can build **2D, 3D and multiplayer games** for mobile (iOS, Android), desktop and the web. GDevelop is fast and easy to use: the game logic is built up using an intuitive and powerful event-based system and reusable behaviors.

# GDevelop Examples

This repository hosts the open-source, free example projects for GDevelop.

## Getting started

| ❔ I want to...                 | 🚀 What to do                                                         |
| ------------------------------- | --------------------------------------------------------------------- |
| 🎮 Use GDevelop to make games   | Go to [GDevelop homepage](https://gdevelop.io) to download the app!   |
| Try an example                  | Examples can be **searched and downloaded** directly from GDevelop.   |
| Contribute to GDevelop itself   | Visit [GDevelop GitHub repository](https://github.com/4ian/GDevelop). |
| Create/improve an example       | Read below.                                                           |

## Submit your example

If you've created an example with GDevelop, you can submit it to be shared with the rest of the community.

1. **Create your game** with GDevelop.
2. Make sure to follow the [requirements and best practices on this page](http://wiki.compilgames.net/doku.php/gdevelop5/community/guide-for-submitting-an-example).
   > Note that for now, we're trying to keep a fairly high quality bar for examples, so you might be asked to adapt your game according to reviewer feedbacks.
   > Don't feel bad about this! This is normal process and here to help making examples as good as possible for new users.
   > If we take too much time to review your example, you can send a ping on the issue. ⏰
3. Create a `preview.png` (case sensitive) 16:9 image that will let users see what the game looks like. You can also add a `thumbnail.png` (case sensitive) with a 16:9 ratio (the game logo/banner) shown in the examples list of the game engine or a `square-icon.png` (the game icon). All of these images should be located at the root folder of the game. (If the game will be used in quick customization, then add a `thumbnail-quick-customization.png` (case sensitive) with a 16:9 ratio to be shown on the get started page of GDevelop.)
4. Create a new `README.md` file and write a short description of the game.
5. **Export** your game and all its resources to a zip file (you can save it in a new folder and zip this folder).
6. Submit it! You can either [submit it here](https://github.com/GDevelopApp/GDevelop-examples/issues/new/choose), attaching the _zip file_.

If you know how to create _Pull Requests_, you can also clone this repository and add your example in the examples folder, and then open a PR. Examples are deployed automatically when pushed to the `main` branch: [![CircleCI](https://circleci.com/gh/GDevelopApp/GDevelop-examples/tree/main.svg?style=svg)](https://circleci.com/gh/GDevelopApp/GDevelop-examples/tree/main)

## Developers

To add a game to the homepage the game have to be listed in the `scripts/generate-database.js` file.

### Theme slots

A *theme* replaces the placeholder art of a 3D starter with a coherent set of
assets, so a game created by the AI looks like the setting the user asked for.
Themes and starters never refer to each other: both point at *slots*, roles
such as `character.player` or `env.ground`.

- `theme-slots.json`, at the root, is the list of slots. It is the vocabulary
  shared by every starter and every theme.
- `examples/<starter>/theme-slots.json` says which objects of that starter play
  which slot:

```json
{
  "version": 1,
  "objects": {
    "scene:Game Scene/Player": "character.player",
    "scene:Game Scene/Ground": "env.ground",
    "scene:Game Scene/Crate": { "top": "env.ground", "front": "env.wall" },
    "object:TankConfiguration::CombinedTank/TankBase": "vehicle.tank.base"
  },
  "effects": {
    "effect:Game Scene//SkyBox": "sky.day"
  },
  "ignoredObjects": ["scene:Game Scene/Camera"]
}
```

An object is referred to as `scene:<scene>/<object>`, `global/<object>`, or
`object:<Extension>::<CustomObject>/<child>` for the children of a custom
object. A 3D model maps to one model slot. A 3D cube maps either to one texture
slot for all its faces, or to one slot per face. A skybox effect, referred to
as `effect:<scene>/<layer>/<effect>`, maps to one skybox slot: the theme's
skybox replaces its six faces.

**When you add a 3D starter, add its `theme-slots.json`.** The build refuses to
publish a 3D starter without one, or one where a 3D model or cube is neither
mapped nor listed in `ignoredObjects`, and it names the object:

```
Starter "starting-3d-sailing": the Scene3D::Model3DObject "scene:Game Scene/Boat"
is neither mapped to a slot nor listed in ignoredObjects in theme-slots.json.
```

- **Reuse an existing slot whenever the object plays an existing role.** A new
  starter's hero is `character.player`. Every theme then covers it already.
- **Add a slot to the root `theme-slots.json` only for a genuinely new role.**
  Every theme is missing it until someone fills it in the assets repository:
  those objects keep their placeholder art in the meantime, which is not an
  error.
- **List in `ignoredObjects`** what is not meant to be seen as art: the camera
  anchor cube, an invisible collision helper, the faceless player of a first
  person game.

Renaming or removing an object makes the build fail the same way on the entry
that no longer matches: fix or delete the line it names. HUD sprites, fonts and
sounds are not part of this.

#### Themed starters

The build uses these mappings to write, next to each 3D starter, a copy of it
re-skinned with each theme published by the assets repository:

```
examples/starting-3d-tank/starting-3d-tank.json                # the starter
examples/starting-3d-tank/starting-3d-tank.theme-pirate.json   # its pirate copy
```

When the AI picks a theme, GDevelop opens the copy instead of the starter, so
the game shows the themed assets from the first frame. The copies live in the
starter's folder because a starter refers to its images, sounds and fonts by a
relative path. They are not examples of their own and are never listed:
`themedStarters.json`, in the database, says which themes exist and which
starters each one covers. It is also what the AI prompts read, so a theme is
only offered once its copies are there.

A theme only re-skins what it has an asset for. Anything else keeps the
starter's placeholder art.

The copies are rebuilt on every deploy of this repository, and every night by
the `nightly-rebuild` workflow of the CircleCI configuration, which is how they
catch up with a theme or an asset published by the assets repository. A new
theme is therefore available the day after it is merged there (or right away,
by pushing to `main` here or rerunning the last `main` pipeline in CircleCI).

#### Trying a theme before merging

Any branch but `main` is built with `--staging` and deployed next to the live
examples, under `staging/examples` and `staging/examples-database`, like the
assets repository does. A staging build uses the themes of the **staging**
assets, so a theme pushed on a branch of the assets repository can be tried end
to end without merging anything:

1. push the theme on a branch of the assets repository (deployed to staging);
2. push (or rerun the pipeline of) a branch here, so the starters re-skinned
   with it are built and deployed to staging;
3. push a branch of the AI prompts, whose dev prompts list the staging themes;
4. in a development build of GDevelop, turn on "Show staging assets" in the
   asset store, then create a game with the AI.

Staging holds the result of the last branch that was pushed, whoever pushed it.

### Gameplay tests

A game can contain _gameplay tests_: scripts that play the game like a player
would (pressing keys, stepping frames) and check what happens. They are stored
in the game's `.json` file, in a top level `tests` array, and are written and
run from GDevelop itself.

The CI runs them with the latest Linux build of GDevelop, downloaded from the
same S3 bucket GDevelop's own CI publishes to:

- on `main`, every game that has gameplay tests is tested;
- on a branch or Pull Request, only the games it modifies are tested.

To run them yourself (needs `xvfb` and the runtime libraries of Electron on
Linux):

```bash
npm install

# Every game that has gameplay tests.
node scripts/run-gameplay-tests.js

# Only the games changed compared to `main`.
node scripts/run-gameplay-tests.js --only-changed

# One game in particular.
node scripts/run-gameplay-tests.js --projects=examples/starting-platformer/starting-platformer.json

# Just list what would be tested.
node scripts/run-gameplay-tests.js --list
```

The other options are documented at the top of the script: choosing the
GDevelop branch or version to test with, sharding the games across several
machines, where the results and failure screenshots are written...

A gameplay test gets a fixed 30 seconds of wall clock from GDevelop, which a
test cannot ask to raise, and how long a frame takes to render varies a lot
from one CI container to the next. So a game whose run failed **only** with
wall-clock timeouts is run a second time, and the second run is the one that
counts. A failed assertion is never retried — that is a real result.

The CI keeps one folder of artifacts per game (under `gameplay-tests/`),
holding its `results.json`, GDevelop's output, and the screenshots its tests
took with `harness.takeScreenshot(...)` in a `gameplay-test-screenshots/`
folder next to the results — which refer to them by a relative path, so a
downloaded results file still points at the right images.

A handful of tests end with a screenshot of what the game looks like once
the thing they check has happened (the tank's target after the shell
exploded on it, the inventory holding the seed that was harvested, the car
past the finish line with the lap counter at 1...). They are a few kilobytes
each and make a run readable at a glance, so they are worth adding to a test
whose result is something you would want to look at.

The tests of every game can also be run on a branch, without waiting for it to
land on `main`, by triggering a CircleCI pipeline with the
`run-all-gameplay-tests` parameter set to `true`. The number of parallel
containers used is the `all-gameplay-tests-parallelism` pipeline parameter.

## License

All examples provided on this repository are MIT licensed, unless specified otherwise.

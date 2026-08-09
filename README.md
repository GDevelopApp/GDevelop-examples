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

The tests of every game can also be run on a branch, without waiting for it to
land on `main`, by triggering a CircleCI pipeline with the
`run-all-gameplay-tests` parameter set to `true`. The number of parallel
containers used is the `all-gameplay-tests-parallelism` pipeline parameter.

## License

All examples provided on this repository are MIT licensed, unless specified otherwise.

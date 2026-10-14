# 3D First-Person Horror Game with a map

A 3D physics-based first-person game set in a dark, fog-filled forest made with a 3D terrain, to create a horror atmosphere: a cabin in a clearing, paths winding between dead trees and pines over mounds and hollows. The player can look around and turn using the camera, as well as jump and fall within the environment, and only sees what the flashlight lights.

A monster enemy roams the forest using navmesh pathfinding: it walks on the terrain and around the trees and the cabin. Its behavior is controlled by a simple state machine. The monster uses raycasting to check if the player is in its line of sight, and when it detects the player, it switches to a chase state and runs after the player, still finding its way around the obstacles. If the monster collides with the player, the game resets. This setup works well for horror scenarios where the player is being hunted and cannot fight back. The game supports both keyboard/mouse controls and mobile touch controls.

Select the terrain in the scene editor to sculpt it (raise, lower, smooth, flatten) and paint its forest floor, dirt, rock and dead leaves. Its shape is also described by its "Edits" property: a list of brush strokes that can be read and changed.

The trees, bushes, rocks, logs and stumps of the forest are scattered models: each of these objects draws many copies of a 3D model on the grass of the terrain, with GPU instancing, in a few draw calls. Select one to add or erase copies with the brushes of the scene editor, or change its "Edits" property, the list of strokes painting where copies grow. The player collides with the trunks, and the monster walks around them: the terrain, the trunks and the cabin have the "Floor/obstacle for pathfinding (navmesh based)" behavior, so the navigation mesh of the monster follows the forest when it is changed.

The assets are CC0: the trees, bushes, rocks, logs and stumps are from the "Ultimate Nature" (Rocks and Trees) pack, the cabin, cart, fence and bonfire from the Medieval Village pack, both by Quaternius, and the textures of the ground (Ground037, Ground023, Rock030 and Ground040) are from ambientCG.

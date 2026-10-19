# 3D FPS with enemies with a map

A 3D physics-based first-person shooter in a canyon made with a 3D terrain: cover on uneven ground, crates, a container and a ramp up to a plateau, and enemies looking for the player. The player can look around and turn using the camera, as well as jump and fall within the environment.

Enemies roam around the canyon using navmesh pathfinding: they walk around the cover, the rocks and the cacti, and up the ramp to the plateau, as they try to find the player. Their behavior is controlled by a simple state machine. The enemies use raycasting to check if the player is in their line of sight (the terrain and the cover hide the player), and when one detects the player, it switches to a chase state and runs to the player, wherever they are. If an enemy collides with the player, the game resets.

The player holds a 3D gun model that can be fired. Firing uses raycasting to detect where the bullet hits (the ground included), creating a 3D particle effect at the point of impact. Each shot plays a sound effect and causes the screen to shake. A shot enemy falls over. The game supports both keyboard/mouse controls and mobile touch controls.

Select the terrain in the scene editor to sculpt it (raise, lower, smooth, flatten) and paint its dirt, gravel, rock and sand. Its shape is also described by its "Edits" property: a list of brush strokes that can be read and changed. The player walks on the slopes thanks to the 3D physics behavior of the terrain, and the enemies thanks to the navmesh, which is built from the terrain and follows it when it is changed.

The small rocks, cacti and plants are scattered models: each of these objects draws many copies of a 3D model on the grass of the terrain, with GPU instancing, in a few draw calls. Select one to add or erase copies with the brushes of the scene editor, or change its "Edits" property, the list of strokes painting where copies grow. The player and the enemies go around the rocks and the cacti. The big rocks, which bullets hit, are 3D model objects.

The assets are CC0: the sandbags, barriers, container, crates and water tank are from the Toon Shooter pack, the rocks and plants from the "Ultimate Nature" (Rocks and Trees) pack, both by Quaternius, and the textures of the ground (Ground025, Gravel022, Rock029 and Ground033) are from ambientCG.

# 3D FPS with Gun with a map

A 3D physics-based first-person game on a training ground in a canyon made with a 3D terrain: cover on uneven ground, crates, a container and a ramp up to a plateau, with targets to shoot everywhere. The player can look around and turn using the camera, as well as jump and fall within the environment. The physics box and the targets react realistically when pushed or shot.

The player holds a 3D gun model that can be fired. Firing uses raycasting to detect where the bullet hits (the ground included), creating a 3D particle effect at the point of impact. Each shot plays a sound effect and causes the screen to shake. The game supports both keyboard/mouse controls and mobile touch controls.

Select the terrain in the scene editor to sculpt it (raise, lower, smooth, flatten) and paint its dirt, gravel, rock and sand. Its shape is also described by its "Edits" property: a list of brush strokes that can be read and changed. The player walks on the slopes thanks to the 3D physics behavior of the terrain.

The small rocks, cacti and plants are scattered models: each of these objects draws many copies of a 3D model on the grass of the terrain, with GPU instancing, in a few draw calls. Select one to add or erase copies with the brushes of the scene editor, or change its "Edits" property, the list of strokes painting where copies grow. The player collides with the rocks and the cacti. The big rocks, which bullets hit, are 3D model objects.

The assets are CC0: the sandbags, barriers, container, crates and water tank are from the Toon Shooter pack, the rocks and plants from the "Ultimate Nature" (Rocks and Trees) pack, both by Quaternius, and the textures of the ground (Ground025, Gravel022, Rock029 and Ground033) are from ambientCG.

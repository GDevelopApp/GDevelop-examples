# 3D FPS Horror game with Gun with a map

A 3D physics-based first-person game set in a dark, fog-filled place made with a 3D terrain, to create a horror atmosphere: a graveyard with crypts at the top of a hill, surrounded by a dead forest on rolling hills. The player can look around and turn using the camera, as well as jump and fall within the environment.

Monster enemies appear in the forest and roam it using navmesh pathfinding: they walk on the terrain and around the trees, the crypts, the walls and the graves. Their behavior is controlled by a simple state machine. The monsters use raycasting to check if the player is in their line of sight, and when one detects the player, it switches to a chase state and runs after the player, still finding its way around the obstacles. A shot monster is thrown back by the impact and disappears: while it walks, its physics body is deactivated (the navmesh moves it), and it is activated when the monster is shot. If a monster touches the player, the game resets.

The player holds a 3D gun model that can be fired. Firing uses raycasting to detect where the bullet hits (the ground included), creating a 3D particle effect at the point of impact. Each shot plays a sound effect and causes the screen to shake. The game supports both keyboard/mouse controls and mobile touch controls.

Select the terrain in the scene editor to sculpt it (raise, lower, smooth, flatten) and paint it. Its shape is also described by its "Edits" property: a list of brush strokes that can be read and changed. The monsters are put on the ground when they appear.

The trees, trunks and rocks of the dead forest are scattered models: each of these objects draws many copies of a 3D model on the grass of the terrain, with GPU instancing, in a few draw calls. Select one to add or erase copies with the brushes of the scene editor, or change its "Edits" property, the list of strokes painting where copies grow. The player collides with them, and the monsters walk around them: the terrain, the trunks and the buildings of the graveyard have the "Floor/obstacle for pathfinding (navmesh based)" behavior, so the navigation mesh of the monsters follows the forest when it is changed.

The assets are CC0: the crypts, gravestones, walls, lights, trees, trunks and rocks are from the Graveyard Kit by Kenney, and the textures of the ground (Ground015, Ground023, Rock030 and Ground048) are from ambientCG.

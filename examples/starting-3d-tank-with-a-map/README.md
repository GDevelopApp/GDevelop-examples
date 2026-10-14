# 3D Tank with a map

A 3D physics-based game where the player controls a tank on a battlefield made with a 3D terrain: hills, trenches, craters, ruined walls and dirt tracks. The tank has an independently aimed turret. Firing launches a bullet projectile that follow the turret’s angle and inclination, and explodes on the ground, the walls or the targets. Stationary enemy targets can be shot and react realistically to explosions, which are visualized with 3D particle effects and screen shake. A third-person camera follows the tank’s movement and orientation. The game supports both keyboard and mobile controls.

Select the terrain in the scene editor to sculpt it (raise, lower, smooth, flatten) and paint its grass, dirt, rock and mud. Its shape is also described by its "Edits" property: a list of brush strokes that can be read and changed (the trenches and craters are lowered lines and points). The tank drives on the slopes thanks to the 3D physics behavior of the terrain. Mountains and invisible walls keep it inside the map.

The trees are scattered models: each of these objects draws many copies of a 3D model on the grass of the terrain, with GPU instancing, in a few draw calls. Select one to add or erase copies with the brushes of the scene editor, or change its "Edits" property, the list of strokes painting where copies grow. Their trunks stop the tank ("Trunk collisions" and the 3D physics behavior).

The assets are CC0: the walls, sandbags, container, wrecked car, water tank and trees are from the Toon Shooter pack by Quaternius, and the textures of the ground (Ground003, Ground085, Rock030 and Ground048) are from ambientCG.

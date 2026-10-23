# 3D Driving Expanded

A 3D car driving game with a third-person camera view, on a map made with a 3D terrain: a road circuit through the countryside and a village, climbing a hill, with a shortcut over ramps. The player accelerates and steers using keyboard or mobile controls. The car uses physics-based movement and can collide with other physics obstacles in the 3D environment.

The circuit climbs and goes down the hill with gentle slopes, so the car can drive all around it. Select the terrain in the scene editor to sculpt it (raise, lower, smooth, flatten) and paint its grass, asphalt, rock and dirt. Its shape is also described by its "Edits" property: a list of brush strokes that can be read and changed. The car collides with the ground thanks to the 3D physics behavior of the terrain. Mountains and invisible walls keep it inside the map.

The trees, oaks, pines and rocks are scattered models: each of these objects draws many copies of a 3D model on the grass of the terrain, with GPU instancing, in a few draw calls. Select one to add or erase copies with the brushes of the scene editor, or change its "Edits" property, the list of strokes painting where copies grow. Their trunks stop the car ("Trunk collisions" and the 3D physics behavior).

The assets are CC0: the houses are from the Suburban City kit, the trees and rocks from the Nature kit, the street lights and barriers from the Racing kit, all by Kenney, and the textures of the ground (Grass004, Asphalt025C, Rock023 and Ground085) are from ambientCG.

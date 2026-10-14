# 3D Racing with a map

A 3D racing game with a third-person camera, on a race track made with a 3D terrain: a start straight with grandstands and pits, a climb up a hill, hairpins and a descent through the valley. The player drives the car with keyboard or mobile controls, passes the checkpoints in order and completes laps, with a lap counter and a timer.

The track has gentle slopes so that the car can race all around it, and barriers on the outside of the turns. Select the terrain in the scene editor to sculpt it (raise, lower, smooth, flatten) and paint its grass, asphalt, rock and gravel. Its shape is also described by its "Edits" property: a list of brush strokes that can be read and changed. The checkpoints are hidden arrows along the track, pointing the way the car must go: move them if the track changes.

The trees, pines and rocks are scattered models: each of these objects draws many copies of a 3D model on the grass of the terrain, with GPU instancing, in a few draw calls. Select one to add or erase copies with the brushes of the scene editor, or change its "Edits" property, the list of strokes painting where copies grow. Their trunks stop the car ("Trunk collisions" and the 3D physics behavior).

The assets are CC0: the grandstands, pits, barriers, billboards, tents and flag are from the Racing kit, the trees and rocks from the Nature kit, both by Kenney, and the textures of the ground (Grass004, Asphalt025C, Rock023 and Gravel022) are from ambientCG.

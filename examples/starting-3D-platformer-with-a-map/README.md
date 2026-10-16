# 3D Platformer with a map

A 3D physics-based platformer in a valley made with a 3D terrain: dirt paths winding up hills, platforms on their tops, coins to collect along the way and a pond. The player controls a character that can move forward, backward, left, and right, as well as jump and fall. The player can push a 3D physics box, jump on and collide with static boxes, and collect coin objects. A third-person camera follows behind the player, but can also be manually controlled by the player. The game supports both keyboard and mouse controls as well as mobile touch controls.

Select the terrain in the scene editor to sculpt it (raise, lower, smooth, flatten) and paint its grass, dirt, rock and sand. Its shape is also described by its "Edits" property: a list of brush strokes that can be read and changed. The character walks on the slopes thanks to the 3D physics behavior of the terrain. Mountains and invisible walls keep it inside the valley.

The trees, rocks, stones, flowers and mushrooms are scattered models: each of these objects draws many copies of a 3D model on the grass of the terrain, with GPU instancing, in a few draw calls. Select one to add or erase copies with the brushes of the scene editor, or change its "Edits" property, the list of strokes painting where copies grow. The player collides with the trunks of the trees and with the rocks ("Trunk collisions" and the 3D physics behavior).

The assets are CC0: the trees, rocks, flowers, mushrooms, sign and flags are from the Platformer kit by Kenney, the textures of the ground (Grass005, Ground085, Rock042L and Ground054) are from ambientCG, and the ripples of the water use a normal map made from "Seamless looping waves heightmaps" by zookeeper (OpenGameArt).

# 3D GTA with a map

A 3D open world where you can walk around, jump, get into a car, drive around, and smash into cars and other obstacles, using keyboard or mobile controls. The map is made with a 3D terrain: a town, roads through farms, a hill to climb and mountains around it.

The town has streets, sidewalks, buildings, a park and a construction site. A country road goes through farms and climbs a hill, and another road loops back to the town. Select the terrain in the scene editor to sculpt it (raise, lower, smooth, flatten) and paint its grass, asphalt, rock and concrete. Its shape is also described by its "Edits" property: a list of brush strokes that can be read and changed. Cars and the player collide with the ground thanks to the 3D physics behavior of the terrain.

The forests and bushes are "scattered models" objects of the 3D terrain extension: each one draws hundreds of copies of a tree or a bush at once, which is much faster than an object for each tree, on phones too. They grow on the grass of the terrain, away from roads, houses and steep slopes, and follow the ground when it's sculpted. Select one in the scene editor to add or erase trees with its brushes, or change its "Edits" property. Trees have trunk collisions thanks to the 3D physics behavior.

A tunnel goes through the hill. Its entrances are holes in the terrain (made with the hole brush, they are also in its "Edits" property), and the tunnel is a 3D model under the ground, with a mesh collision shape for the cars. Concrete portals around the entrances fill the space between the tunnel and the ground, so that only the tunnel is seen through the holes. In the tunnel, the camera following the car comes closer to stay inside.

The assets are CC0: the buildings, houses, street lights, cones, barriers and town trees are from the City Kits (Commercial, Suburban and Roads) by Kenney, the pine trees and bushes are from the "Ultimate Nature" pack by Quaternius, and the textures of the ground (Grass004, Asphalt025C, Rock058 and Concrete034) are from ambientCG, and the tunnel was made for this example.

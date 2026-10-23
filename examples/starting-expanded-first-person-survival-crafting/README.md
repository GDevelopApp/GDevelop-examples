# 3D First Person Survival Crafting Expanded

A 3D physics-based first-person game in an open forest on hills made with a 3D terrain, around a camp in a clearing. The player can look around and turn using the camera, as well as jump and fall within the environment, and walks up and down the slopes. Solid trees and boulders that the player can't pass through are spread in the forest, with bushes, fallen logs and stumps, and a 3D box with rocks and logs is placed in the camp. The player can pick up objects and store them in an inventory, then place objects back onto the ground or the terrain using raycasting to determine the placement location. Harvestable trees and boulders can be clicked to add resources to the inventory. The inventory uses UI icons to display the contents of the inventory, as well as allow the player to select which item to use and choose which slot a picked-up object will occupy.

This setup works well for any game where the player picks up resources and crafts things with those resources, especially for survival crafting games. The game supports both keyboard/mouse controls and mobile touch controls.

Select the terrain in the scene editor to sculpt it (raise, lower, smooth, flatten) and paint its grass, soil, rock and moss. Its shape is also described by its "Edits" property: a list of brush strokes that can be read and changed. Grass grows around the camp, where it is seen up close.

The bushes, plants and flowers are scattered models: each of these objects draws many copies of a 3D model on the grass of the terrain, with GPU instancing, in a few draw calls. Select one to add or erase copies with the brushes of the scene editor, or change its "Edits" property, the list of strokes painting where copies grow. The trees and boulders to gather are objects, so that they can be harvested.

The assets are CC0: the bushes, plants, fallen logs and stumps are from the "Ultimate Nature" (Rocks and Trees) pack and the bonfire from the Medieval Village pack, both by Quaternius, the tent is from the Survival Kit by Kenney, and the textures of the ground (Grass001, Ground023, Rock023 and Moss001) are from ambientCG.

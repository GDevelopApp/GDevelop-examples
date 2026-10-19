# 3D FPS game with Enemies

A 3D physics-based first-person shooter, where the player can look around and turn using the camera, as well as jump and fall within the environment. The scene includes a ground surface, solid platforms the player can land on, and pushable physics boxs that reacts realistically to movement.

Enemies roam around the playable area using navmesh pathfinding: they walk around the obstacles and the boxes, and go up the ramps to the platform, as they try to find the player. Their behavior is controlled by a simple state machine. The enemies use raycasting to check if the player is in their line of sight, and when one detects the player, it switches to a chase state and runs to the player, wherever they are. A shot enemy is thrown back by the impact: while it walks, its physics body is deactivated (the navmesh moves it), and it is activated when the enemy is shot. If an enemy collides with the player, the game resets.

The player holds a 3D gun model that can be fired. Firing uses raycasting to detect where the bullet hits, creating a 3D particle effect at the point of impact. Each shot plays a sound effect and causes the screen to shake.

This setup works well for any action game where the player is able to shoot and kill enemies. The game supports both keyboard/mouse controls and mobile touch controls.
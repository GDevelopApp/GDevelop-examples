# 3D FPS Horror game with Gun

A 3D physics-based first-person game set in a dark, fog-filled environment to create a horror atmosphere. The player can look around and turn using the camera, as well as jump and fall within the environment. The scene includes a ground surface, solid platforms the player can land on, and pushable physics boxs that reacts realistically to movement.

Monster enemies spawn and roam the playable area using pathfinding to navigate around obstacles. Their behavior is controlled by a simple state machine. The monsters use raycasting to check if the player is in their line of sight, and when one detects the player, it stops pathfinding and switches to a chase state. If a monster collides with the player, the game resets.

The player holds a 3D gun model that can be fired. Firing uses raycasting to detect where the bullet hits, creating a 3D particle effect at the point of impact. Each shot plays a sound effect and causes the screen to shake.

This setup works well for any action horror games where the player is able to shoot and kill enemies. The game supports both keyboard/mouse controls and mobile touch controls.
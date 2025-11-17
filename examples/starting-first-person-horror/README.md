# 3D First-Person Horror Game

A 3D physics-based first-person game set in a dark, fog-filled environment to create a horror atmosphere. The player can look around and turn using the camera, as well as jump and fall within the environment. The scene includes a ground surface, solid platforms the player can land on, and a pushable physics box that reacts realistically to movement.

A monster enemy roams the playable area using pathfinding to navigate around obstacles. Its behavior is controlled by a simple state machine. The monster uses raycasting to check if the player is in its line of sight, and when it detects the player, it stops pathfinding and switches to a chase state. If the monster collides with the player, the game resets.

This setup works well for horror scenarios where the player is being hunted and cannot fight back. The game supports both keyboard/mouse controls and mobile touch controls.
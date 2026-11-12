# Collect to open (logic to copy)

The smallest game showing "collect every pickup, then the exit opens", with a counter on screen.

Made to be copied into another game: the external events `CollectToOpen` hold the logic, the external layout `CollectToOpenHud` holds the counter, and the variables `PickupsCollected` and `PickupsToCollect` are its parameters. Bind `Player`, `Pickup`, `PickupSpot` and `Exit` to the objects of your game.

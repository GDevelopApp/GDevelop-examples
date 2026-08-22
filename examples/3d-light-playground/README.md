# 3D Light Playground

A playground for GDevelop's 3D lights, with one scene per kind of light so each can
be looked at on its own.

- **Sun and Shadows** — the directional light of the scene, casting shadows across
  the ground, the crates and the backdrop.
- **Point Lights** — three point lights, each with its own colour, lighting an
  otherwise dark scene and casting shadows away from themselves.
- **Spot Lights** — two spot lights aimed at the ground, showing the cone, the
  falloff towards its edge, and the shadows underneath.
- **Many Lights** — twenty-four point lights at once, more than a device should
  light in one frame, to see how the budget behaves.

Point and spot lights come from the **3D lights** extension. The scene's
directional and ambient lights are effects on the layer, which is where to find
them in the editor.

Two things worth knowing if you build on this:

- A light's colour, intensity and range belong to the **object**, not to the
  instance. GDevelop reads only the animation from an instance's properties for
  an events-based object, so placing two lights of different colours means two
  objects, not one object placed twice.
- A spot light shines along its own **+X** axis. Point it at the ground by giving
  the instance a Y rotation of 90.

The gameplay tests of this project check that each kind of light reaches the
renderer, keeps the colour it was given, and casts shadows — and take screenshots
of every scene, so a change in how lighting looks shows up as a change in the
pictures.

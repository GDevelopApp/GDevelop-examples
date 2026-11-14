// @ts-check

/** @typedef {import('./ThemeSlots.js').StarterThemeSlots} StarterThemeSlots */
/** @typedef {import('./ThemeSlots.js').ModelFit} ModelFit */
/** @typedef {import('./GlbBox.js').GlbSize} GlbSize */

/**
 * The size of a 3D model in a scene: `width` along X, `height` along Y and
 * `depth` along Z, the up axis.
 * @typedef {{width: number, height: number, depth: number}} ModelDimensions
 */

/**
 * A theme, as published by the assets repository: for each slot, the file to
 * use and, for a 3D model, the serialized content of the asset's object and
 * the real dimensions of the model (its object is sized as a cube). A skybox
 * slot has one file per face instead.
 * @typedef {{
 *   file: string,
 *   resourceName: string,
 *   origin?: {name: string, identifier: string},
 * }} ThemeFile
 *
 * A material slot is a texture with, if the theme has one, its normal map. A
 * color slot is a color, like "52;104;36".
 * @typedef {ThemeFile & {
 *   kind: 'model' | 'texture',
 *   objectContent?: any,
 *   dimensions?: ModelDimensions,
 *   scale?: number,
 *   assetStoreId?: string,
 * } | ThemeFile & {
 *   kind: 'material',
 *   normalMap?: ThemeFile,
 * } | {
 *   kind: 'color',
 *   color: string,
 * } | {
 *   kind: 'skybox',
 *   faces: Object.<string, ThemeFile>,
 *   assetStoreId?: string,
 * } | {
 *   kind: 'sprite',
 *   objectContent: any,
 *   resources: Array<any>,
 *   width: number,
 *   height: number,
 *   tileSize?: number,
 *   assetStoreId?: string,
 * } | ThemeFile & {
 *   kind: 'tilemap',
 *   tileSize: number,
 *   columnCount: number,
 *   rowCount: number,
 *   tiles: Object.<string, number>,
 * }} ThemeSlot
 *
 * @typedef {{
 *   id: string,
 *   name: string,
 *   description: string,
 *   slots: Object.<string, ThemeSlot>,
 * }} Theme
 *
 * What the themer needs to know about an image of the starter, to fit the
 * theme's art where the placeholder art was.
 * @typedef {import('./PngBox.js').ImageBox} ImageBox
 *
 * `modelFitBySlot` says how a model slot sizes its model (see `ModelFit`),
 * `modelScaleBySlot` the scale a slot gives its models on top of the fit, and
 * `getStarterModelSize` gives the size of a placeholder model, to know how
 * large it is drawn. Without them, a theme model takes the volume of the
 * placeholder object.
 * @typedef {{
 *   getStarterImageBox?: (resourceFile: string) => ImageBox | null,
 *   getStarterModelSize?: (resourceFile: string) => GlbSize | null,
 *   modelFitBySlot?: Object.<string, ModelFit>,
 *   modelScaleBySlot?: Object.<string, number>,
 * }} ThemeApplicationOptions
 *
 * How large a theme model is drawn compared to the placeholder it replaces,
 * for the checks of the build. `fit` is null for a model sized by the volume
 * of the placeholder object, for lack of the real dimensions of the model.
 * `scale` is the scale the theme deliberately gives its model on top of the
 * fit (1 for most).
 * @typedef {{
 *   objectPath: string,
 *   slotId: string,
 *   fit: ModelFit | null,
 *   scale: number,
 *   placeholder: ModelDimensions,
 *   themed: ModelDimensions,
 * }} SizedModel
 *
 * @typedef {{
 *   appliedSlots: Array<string>,
 *   missingSlots: Array<string>,
 *   changedObjectsCount: number,
 *   changedResourcesCount: number,
 *   sizedModels: Array<SizedModel>,
 * }} ThemeApplicationResult
 */

/** @type {Object.<string, string>} */
const cubeFaceProperties = {
  front: 'frontFaceResourceName',
  back: 'backFaceResourceName',
  left: 'leftFaceResourceName',
  right: 'rightFaceResourceName',
  top: 'topFaceResourceName',
  bottom: 'bottomFaceResourceName',
};

/**
 * Every object of a serialized project, by the path a starter's
 * theme-slots.json refers to it by.
 * @param {any} projectObject
 * @returns {Map<string, any>}
 */
const getObjectsByPath = (projectObject) => {
  /** @type {Map<string, any>} */
  const objectsByPath = new Map();
  /** @param {string} prefix @param {Array<any> | undefined} objects */
  const collect = (prefix, objects) =>
    (objects || []).forEach((object) =>
      objectsByPath.set(`${prefix}/${object.name}`, object)
    );

  collect('global', projectObject.objects);
  (projectObject.layouts || []).forEach(
    /** @param {any} layout */ (layout) =>
      collect(`scene:${layout.name}`, layout.objects)
  );
  (projectObject.eventsFunctionsExtensions || []).forEach(
    /** @param {any} extension */ (extension) =>
      (extension.eventsBasedObjects || []).forEach(
        /** @param {any} eventsBasedObject */ (eventsBasedObject) =>
          collect(
            `object:${extension.name}::${eventsBasedObject.name}`,
            eventsBasedObject.objects
          )
      )
  );
  return objectsByPath;
};

/**
 * @param {any} projectObject
 * @returns {Map<string, any>}
 */
const getEffectsByPath = (projectObject) => {
  /** @type {Map<string, any>} */
  const effectsByPath = new Map();
  (projectObject.layouts || []).forEach(
    /** @param {any} layout */ (layout) =>
      (layout.layers || []).forEach(
        /** @param {any} layer */ (layer) =>
          (layer.effects || []).forEach(
            /** @param {any} effect */ (effect) =>
              effectsByPath.set(
                `effect:${layout.name}/${layer.name}/${effect.name}`,
                effect
              )
          )
      )
  );
  return effectsByPath;
};

/**
 * Same merge as the asset swapper of the editor: the object keeps every
 * animation name it had, played by the theme's animation of the same name (or
 * its first one), and the theme's extra animations are appended.
 * @param {Array<any>} objectAnimations
 * @param {Array<any>} themeAnimations
 * @returns {Array<any>}
 */
const mergeModel3DAnimations = (objectAnimations, themeAnimations) => {
  if (!themeAnimations.length) return objectAnimations;

  const animations = objectAnimations.map(
    (objectAnimation) =>
      themeAnimations.find(
        (themeAnimation) => themeAnimation.name === objectAnimation.name
      ) || { ...themeAnimations[0], name: objectAnimation.name }
  );
  themeAnimations.forEach((themeAnimation) => {
    const isAlreadyAdded = objectAnimations.some(
      (objectAnimation) => objectAnimation.name === themeAnimation.name
    );
    if (!isAlreadyAdded) animations.push(themeAnimation);
  });
  return animations;
};

/**
 * Scale the theme model to the volume the placeholder occupied, so instances
 * keep their footprint in the scene.
 * @param {any} objectContent
 * @param {any} themeContent
 * @returns {number}
 */
const getSizeRatio = (objectContent, themeContent) => {
  const objectVolume =
    (objectContent.width || 0) *
    (objectContent.height || 0) *
    (objectContent.depth || 0);
  const themeVolume =
    (themeContent.width || 0) *
    (themeContent.height || 0) *
    (themeContent.depth || 0);
  if (objectVolume <= 0 || themeVolume <= 0) return 1;
  return Math.pow(objectVolume / themeVolume, 1 / 3);
};

/**
 * The size of a model rotated like a 3D model object rotates it: in degrees,
 * around the X axis of the scene, then its Y axis, then its Z axis.
 * @param {GlbSize} size
 * @param {number} rotationX
 * @param {number} rotationY
 * @param {number} rotationZ
 * @returns {ModelDimensions}
 */
const getRotatedModelDimensions = (size, rotationX, rotationY, rotationZ) => {
  const [cx, sx, cy, sy, cz, sz] = [rotationX, rotationY, rotationZ].flatMap(
    (angle) => [
      Math.cos((angle * Math.PI) / 180),
      Math.sin((angle * Math.PI) / 180),
    ]
  );
  const rotation = [
    [cy * cz, sx * sy * cz - cx * sz, cx * sy * cz + sx * sz],
    [cy * sz, sx * sy * sz + cx * cz, cx * sy * sz - sx * cz],
    [-sy, sx * cy, cx * cy],
  ];
  const [width, height, depth] = rotation.map(
    ([fromX, fromY, fromZ]) =>
      Math.abs(fromX) * size.x +
      Math.abs(fromY) * size.y +
      Math.abs(fromZ) * size.z
  );
  return { width, height, depth };
};

/**
 * @param {ModelDimensions} dimensions
 * @param {number} scale
 * @returns {ModelDimensions}
 */
const scaleModelDimensions = ({ width, height, depth }, scale) => ({
  width: width * scale,
  height: height * scale,
  depth: depth * scale,
});

/**
 * The largest scale fitting a model in a box, each size of the model facing
 * the size of the box given with it.
 * @param {Array<[number, number]>} boxAndModelSizes
 * @returns {number}
 */
const getContainScale = (boxAndModelSizes) =>
  Math.min(
    ...boxAndModelSizes
      .filter(([, modelSize]) => modelSize > 0)
      .map(([boxSize, modelSize]) => boxSize / modelSize)
  );

/**
 * The longest then the shortest of the sizes of a model across the ground.
 * @param {ModelDimensions} dimensions
 * @returns {[number, number]}
 */
const getGroundSizes = ({ width, height }) => [
  Math.max(width, height),
  Math.min(width, height),
];

/** @param {ModelDimensions} dimensions */
const getVolume = ({ width, height, depth }) => width * height * depth;

/**
 * The scale giving a model the size its slot means, in the place of a
 * placeholder drawn at `placeholder` in an object of size `room`: its height
 * for a character, its length for a vehicle, its volume for a projectile, or
 * the largest size fitting in the room of the object for a prop. Models of a
 * theme don't all face the direction of the placeholder: a prop is fit
 * whichever way it faces, its longest size across the ground against the
 * longest one of the room.
 * @param {ModelFit} fit
 * @param {ModelDimensions} placeholder
 * @param {ModelDimensions} room
 * @param {ModelDimensions} model
 * @returns {number | null} null if the model has no size to fit.
 */
const getFitScale = (fit, placeholder, room, model) => {
  const [roomLength, roomBreadth] = getGroundSizes(room);
  const [modelLength, modelBreadth] = getGroundSizes(model);
  const scale =
    fit === 'height'
      ? placeholder.depth / model.depth
      : fit === 'length'
      ? getGroundSizes(placeholder)[0] / modelLength
      : fit === 'volume'
      ? Math.cbrt(getVolume(placeholder) / getVolume(model))
      : getContainScale([
          [roomLength, modelLength],
          [roomBreadth, modelBreadth],
          [room.depth, model.depth],
        ]);
  return scale > 0 && Number.isFinite(scale) ? scale : null;
};

/**
 * The size a 3D model object draws its model at in a box: stretched to the
 * box, or as large as it fits in it when the object keeps the proportions of
 * the model.
 * @param {ModelDimensions} box
 * @param {ModelDimensions | null} modelDimensions
 * @param {boolean} keepAspectRatio
 * @returns {ModelDimensions}
 */
const getDrawnModelDimensions = (box, modelDimensions, keepAspectRatio) => {
  if (!keepAspectRatio || !modelDimensions) return box;
  const scale = getContainScale([
    [box.width, modelDimensions.width],
    [box.height, modelDimensions.height],
    [box.depth, modelDimensions.depth],
  ]);
  return scale > 0 && Number.isFinite(scale)
    ? scaleModelDimensions(modelDimensions, scale)
    : box;
};

/**
 * The instances of an object, wherever its path lets it be placed.
 * @param {any} projectObject
 * @param {string} objectPath
 * @returns {Array<any>}
 */
const getInstancesOfObject = (projectObject, objectPath) => {
  const separatorIndex = objectPath.lastIndexOf('/');
  const scope = objectPath.slice(0, separatorIndex);
  const objectName = objectPath.slice(separatorIndex + 1);
  const sceneName = scope.startsWith('scene:') ? scope.slice(6) : null;
  if (scope !== 'global' && sceneName === null) return [];

  /** @type {Array<any>} */
  const instances = [];
  (projectObject.layouts || []).forEach(
    /** @param {any} layout */ (layout) => {
      if (sceneName !== null && layout.name !== sceneName) return;
      instances.push(...(layout.instances || []));
    }
  );
  (projectObject.externalLayouts || []).forEach(
    /** @param {any} externalLayout */ (externalLayout) => {
      if (sceneName !== null && externalLayout.associatedLayout !== sceneName) {
        return;
      }
      instances.push(...(externalLayout.instances || []));
    }
  );
  return instances.filter((instance) => instance.name === objectName);
};

/**
 * The box around the collision mask of a sprite frame, or null without one.
 * @param {any} frame
 * @returns {{left: number, top: number, right: number, bottom: number} | null}
 */
const getFrameMaskBox = (frame) => {
  if (!frame.hasCustomCollisionMask) return null;
  /** @type {Array<{x: number, y: number}>} */
  const vertices = (frame.customCollisionMask || []).flat();
  if (!vertices.length) return null;
  return {
    left: Math.min(...vertices.map((vertex) => vertex.x)),
    top: Math.min(...vertices.map((vertex) => vertex.y)),
    right: Math.max(...vertices.map((vertex) => vertex.x)),
    bottom: Math.max(...vertices.map((vertex) => vertex.y)),
  };
};

/** @param {any} object @returns {any | null} */
const getFirstFrame = (object) => {
  for (const animation of object.animations || []) {
    for (const direction of animation.directions || []) {
      if ((direction.sprites || []).length) return direction.sprites[0];
    }
  }
  return null;
};

/**
 * How the art of a theme sprite is drawn where a placeholder image was: its
 * scale, and the position on the theme image of a position on the placeholder.
 * @typedef {{
 *   scale: number,
 *   toThemeImage: (x: number, y: number) => {x: number, y: number},
 * }} SpritePlacement
 */

/**
 * Place the art of a theme sprite where the placeholder art was: scaled to
 * cover what the placeholder covered, centered on it (or standing on its
 * bottom).
 * @param {ImageBox} placeholderImage
 * @param {any} themeFrame The first frame of the theme art.
 * @param {'center' | 'bottom'} anchor
 * @param {'area' | 'width' | 'height'} fit Whether the art covers the same
 * area as the placeholder, or takes its width or its height.
 * @param {number=} forcedScale The scale to use instead of fitting the art.
 * @returns {SpritePlacement | null}
 */
const placeThemeSprite = (
  placeholderImage,
  themeFrame,
  anchor,
  fit,
  forcedScale
) => {
  const themeBox = getFrameMaskBox(themeFrame);
  if (!themeBox) return null;
  const themeBoxWidth = themeBox.right - themeBox.left;
  const themeBoxHeight = themeBox.bottom - themeBox.top;
  const box = placeholderImage.box;
  if (themeBoxWidth <= 0 || themeBoxHeight <= 0) return null;

  const widthScale = (box.right - box.left) / themeBoxWidth;
  const heightScale = (box.bottom - box.top) / themeBoxHeight;
  // By default, the art covers as much of the scene as the placeholder did,
  // without growing out of the image of the placeholder: art of another shape
  // (a wide tank for a tall pawn) is then not shrunk to the narrow side.
  const scale =
    forcedScale ||
    (fit === 'width'
      ? widthScale
      : fit === 'height'
      ? heightScale
      : Math.min(
          Math.sqrt(widthScale * heightScale),
          placeholderImage.width / themeBoxWidth,
          placeholderImage.height / themeBoxHeight,
          // Never enlarged: small art of a pack stays as sharp, and as small
          // compared to the rest of the pack, as its author drew it.
          1
        ));
  if (!(scale > 0)) return null;

  return {
    scale,
    toThemeImage: (x, y) => ({
      x:
        (themeBox.left + themeBox.right) / 2 +
        (x - (box.left + box.right) / 2) / scale,
      y:
        anchor === 'bottom'
          ? themeBox.bottom + (y - box.bottom) / scale
          : (themeBox.top + themeBox.bottom) / 2 +
            (y - (box.top + box.bottom) / 2) / scale,
    }),
  };
};

/**
 * Give an animation of a starter sprite the frames of a theme animation. The
 * origin, center and points of the placeholder are kept where they were in
 * the scene, so the events and the instances of the starter behave as before.
 * The collision mask is the one of the theme art: it follows what is drawn.
 * @param {any} themeAnimation
 * @param {string} name The name the animation keeps in the starter.
 * @param {any} placeholderFrame
 * @param {ImageBox} placeholderImage
 * @param {SpritePlacement} placement
 * @param {(imageName: string) => string | null} useThemeImage
 * @returns {any}
 */
const makeThemedAnimation = (
  themeAnimation,
  name,
  placeholderFrame,
  placeholderImage,
  placement,
  useThemeImage
) => {
  const { toThemeImage } = placement;
  const placeholderCenter = placeholderFrame.centerPoint.automatic
    ? { x: placeholderImage.width / 2, y: placeholderImage.height / 2 }
    : placeholderFrame.centerPoint;
  const frameGeometry = {
    originPoint: {
      ...placeholderFrame.originPoint,
      ...toThemeImage(
        placeholderFrame.originPoint.x,
        placeholderFrame.originPoint.y
      ),
    },
    centerPoint: {
      ...placeholderFrame.centerPoint,
      automatic: false,
      ...toThemeImage(placeholderCenter.x, placeholderCenter.y),
    },
    points: (placeholderFrame.points || []).map(
      /** @param {any} point */ (point) => ({
        ...point,
        ...toThemeImage(point.x, point.y),
      })
    ),
  };

  return {
    ...themeAnimation,
    name,
    directions: (themeAnimation.directions || []).map(
      /** @param {any} direction */ (direction) => ({
        ...direction,
        sprites: (direction.sprites || []).map(
          /** @param {any} frame */ (frame) => ({
            ...frame,
            ...frameGeometry,
            image: useThemeImage(frame.image) || frame.image,
          })
        ),
      })
    ),
  };
};

/** @param {any} animation @returns {any | null} */
const getAnimationFirstFrame = (animation) => {
  for (const direction of (animation && animation.directions) || []) {
    if ((direction.sprites || []).length) return direction.sprites[0];
  }
  return null;
};

/**
 * Re-skin a starter with a theme by rewriting its serialized project, in place.
 *
 * The starter's theme-slots.json says which of its objects play which slot.
 * Each such object gets the theme's asset for that slot: a 3D model takes the
 * theme model's dimensions, rotation, material and animations while keeping
 * its name, behaviors, variables, instances, origin and center; a cube face
 * points at the theme image; a skybox effect points at the six theme images;
 * a property of a custom object points at the theme image (and the normal map
 * of a material) or model, or takes the theme color.
 *
 * Each theme file becomes a resource named like in the asset store, and the
 * resources of the starter that nothing uses anymore are removed.
 *
 * @param {any} projectObject
 * @param {StarterThemeSlots} starterThemeSlots
 * A sprite takes the animations of the theme sprite, drawn where its
 * placeholder art was; a tiled sprite or a panel sprite takes the theme image
 * as its texture; a tile map takes the theme atlas, each of its tiles being
 * replaced by the tile of the atlas playing the same role.
 *
 * @param {any} projectObject
 * @param {StarterThemeSlots} starterThemeSlots
 * @param {Theme} theme
 * @param {ThemeApplicationOptions=} options
 * @returns {ThemeApplicationResult}
 */
const applyThemeToStarter = (
  projectObject,
  starterThemeSlots,
  theme,
  options
) => {
  /** @type {Array<any>} */
  const resources = (projectObject.resources || {}).resources || [];
  /** @type {Map<string, any>} */
  const resourceByName = new Map(
    resources.map((resource) => [resource.name, resource])
  );
  const objectsByPath = getObjectsByPath(projectObject);
  const effectsByPath = getEffectsByPath(projectObject);

  /** @type {Set<string>} */
  const appliedSlots = new Set();
  /** @type {Set<string>} */
  const missingSlots = new Set();
  /** @type {Set<string>} */
  const themeResourceNames = new Set();
  /** @type {Set<string>} */
  const replacedResourceNames = new Set();
  let changedObjectsCount = 0;
  /** @type {Array<SizedModel>} */
  const sizedModels = [];

  /** @param {string} slotId @returns {ModelFit | null} */
  const getModelFit = (slotId) =>
    (options && options.modelFitBySlot && options.modelFitBySlot[slotId]) ||
    null;

  /**
   * The scale of a model on top of its fit: the one of its slot, times the
   * one its theme deliberately gives it.
   * @param {string} slotId
   * @param {{scale?: number}} slot
   * @returns {number}
   */
  const getModelScale = (slotId, slot) =>
    ((options &&
      options.modelScaleBySlot &&
      options.modelScaleBySlot[slotId]) ||
      1) * (slot.scale || 1);

  /** @param {string} resourceName @returns {GlbSize | null} */
  const getStarterModelSize = (resourceName) => {
    const resource = resourceByName.get(resourceName);
    return resource && options && options.getStarterModelSize
      ? options.getStarterModelSize(resource.file)
      : null;
  };

  /**
   * Copies of a scattered model are given a height ("Size", when not sized by
   * a scale factor): for a model fit otherwise than by its height, the height
   * giving it the size its slot means where the placeholder copies were.
   * @param {string} objectPath
   * @param {string} slotId
   * @param {{objectContent?: any, dimensions?: ModelDimensions, scale?: number}} slot
   * @param {any} objectContent
   * @param {string} placeholderResourceName
   */
  const fitScatteredCopies = (
    objectPath,
    slotId,
    slot,
    objectContent,
    placeholderResourceName
  ) => {
    const themeModelUpAxis =
      slot.objectContent && slot.objectContent.rotationX === 0 ? 'Z' : 'Y';
    const placeholderUpAxis = objectContent.ModelUpAxis || 'Y';
    if (themeModelUpAxis !== placeholderUpAxis) {
      objectContent.ModelUpAxis = themeModelUpAxis;
    }

    const placeholderCopyHeight = Number(objectContent.Size) || 0;
    const fit = getModelFit(slotId);
    const placeholderSize = getStarterModelSize(placeholderResourceName);
    if (
      !placeholderCopyHeight ||
      !fit ||
      !slot.dimensions ||
      !placeholderSize
    ) {
      return;
    }
    const placeholderModel =
      placeholderUpAxis === 'Z'
        ? {
            width: placeholderSize.x,
            height: placeholderSize.y,
            depth: placeholderSize.z,
          }
        : {
            width: placeholderSize.x,
            height: placeholderSize.z,
            depth: placeholderSize.y,
          };
    if (!(placeholderModel.depth > 0)) return;
    const placeholder = scaleModelDimensions(
      placeholderModel,
      placeholderCopyHeight / placeholderModel.depth
    );
    const fitScale = getFitScale(
      fit,
      placeholder,
      placeholder,
      slot.dimensions
    );
    if (!fitScale) return;
    const scale = getModelScale(slotId, slot);
    const themed = scaleModelDimensions(slot.dimensions, fitScale * scale);
    objectContent.Size = String(Math.round(themed.depth * 100) / 100);
    sizedModels.push({ objectPath, slotId, fit, scale, placeholder, themed });
  };

  /**
   * Add a file of a slot to the project as a resource configured like the
   * resource it replaces, and return its name. Without a resource to replace
   * (an empty property of a custom object), it is configured like
   * `defaultResource`, if given.
   * @param {string} replacedResourceName
   * @param {string} slotId
   * @param {ThemeFile} themeFile
   * @param {any=} defaultResource
   * @returns {string | null}
   */
  const useThemeResource = (
    replacedResourceName,
    slotId,
    themeFile,
    defaultResource
  ) => {
    const replacedResource =
      resourceByName.get(replacedResourceName) || defaultResource;
    if (!replacedResource) return null;

    // A resource of the starter can already have that name: number the new one.
    let name = themeFile.resourceName;
    for (
      let index = 2;
      resourceByName.has(name) &&
      resourceByName.get(name).file !== themeFile.file;
      index++
    ) {
      name = `${themeFile.resourceName} ${index}`;
    }

    if (!resourceByName.has(name)) {
      const themeResource = {
        ...replacedResource,
        name,
        file: themeFile.file,
        origin: themeFile.origin || {
          name: 'gdevelop-asset-store',
          identifier: themeFile.file,
        },
      };
      resources.push(themeResource);
      resourceByName.set(name, themeResource);
    }

    appliedSlots.add(slotId);
    themeResourceNames.add(name);
    if (replacedResourceName) replacedResourceNames.add(replacedResourceName);
    return name;
  };

  /**
   * Theme the properties of a custom object: an image resource takes the
   * texture of a texture or material slot, along with the normal map of the
   * material if the starter maps one; a 3D model resource takes the model of
   * a model slot; a color takes the color of a color slot.
   * @param {string} objectPath
   * @param {any} object
   * @param {Object.<string, string | import('./ThemeSlots.js').MaterialMapping>} mapping
   * @returns {boolean} Whether a property changed.
   */
  const themeCustomObjectProperties = (objectPath, object, mapping) => {
    const objectContent = object.content;
    let changed = false;
    Object.entries(mapping).forEach(([property, propertyMapping]) => {
      const slotId =
        typeof propertyMapping === 'string'
          ? propertyMapping
          : propertyMapping.slot;
      const slot = theme.slots[slotId];
      if (
        slot &&
        slot.kind === 'color' &&
        typeof propertyMapping === 'string'
      ) {
        objectContent[property] = slot.color;
        appliedSlots.add(slotId);
        changed = true;
        return;
      }
      if (
        slot &&
        slot.kind === 'model' &&
        typeof propertyMapping === 'string'
      ) {
        const placeholderResourceName = String(objectContent[property] || '');
        const themeModelResourceName = useThemeResource(
          placeholderResourceName,
          slotId,
          slot,
          { kind: 'model3D', metadata: '', userAdded: false }
        );
        if (!themeModelResourceName) return;
        objectContent[property] = themeModelResourceName;
        if (object.type === 'Terrain3D::ScatteredModels') {
          fitScatteredCopies(
            objectPath,
            slotId,
            slot,
            objectContent,
            placeholderResourceName
          );
        }
        changed = true;
        return;
      }
      if (!slot || (slot.kind !== 'texture' && slot.kind !== 'material')) {
        missingSlots.add(slotId);
        return;
      }

      const themeTextureResourceName = useThemeResource(
        String(objectContent[property] || ''),
        slotId,
        slot,
        { kind: 'image', metadata: '', smoothed: true, userAdded: false }
      );
      if (!themeTextureResourceName) return;
      objectContent[property] = themeTextureResourceName;
      changed = true;
      if (typeof propertyMapping === 'string') return;

      const normalMapProperty = propertyMapping.normalMap;
      const normalMapResourceName = String(
        objectContent[normalMapProperty] || ''
      );
      if (slot.kind === 'material' && slot.normalMap) {
        objectContent[normalMapProperty] =
          useThemeResource(
            normalMapResourceName,
            slotId,
            slot.normalMap,
            resourceByName.get(themeTextureResourceName)
          ) || '';
      } else {
        // The bumps of another texture would not match the theme texture.
        objectContent[normalMapProperty] = '';
        if (normalMapResourceName) {
          replacedResourceNames.add(normalMapResourceName);
        }
      }
    });
    return changed;
  };

  const starterTileSize = starterThemeSlots.tileSize || 64;
  /**
   * The assets of a theme for a slot: usually one, or several when the theme
   * has one for each size of tiles.
   * @param {string} slotId
   * @returns {Array<any>}
   */
  const getSlotCandidates = (slotId) => {
    /** @type {any} */
    const slot = theme.slots[slotId];
    return slot ? [slot, ...(slot.variants || [])] : [];
  };

  Object.entries(starterThemeSlots.objects || {}).forEach(
    ([objectPath, mapping]) => {
      const object = objectsByPath.get(objectPath);
      if (!object) return;
      /** @type {any} */
      const mappingObject = typeof mapping === 'string' ? {} : mapping;

      if (object.type === 'Sprite') {
        // Each animation of the sprite is played by a theme sprite: the same
        // one for all of them, or one per animation (`animationSlots`, for a
        // sprite showing different things, like the icons of an inventory).
        /** @type {Array<any>} */
        const objectAnimations = object.animations || [];
        /** @type {Object.<string, string>} */
        const slotIdByAnimation = mappingObject.animationSlots || {};
        const mainSlotId =
          typeof mapping === 'string' ? mapping : mappingObject.slot;
        const usedSlotIds = [
          ...new Set(
            objectAnimations
              .map(
                (animation) => slotIdByAnimation[animation.name] || mainSlotId
              )
              .filter((slotId) => typeof slotId === 'string')
          ),
        ];
        if (!usedSlotIds.length) return;

        /** @param {string} imageName @returns {ImageBox | null} */
        const getPlaceholderImage = (imageName) => {
          const resource = resourceByName.get(imageName);
          return resource && options && options.getStarterImageBox
            ? options.getStarterImageBox(resource.file)
            : null;
        };
        const anchor = mappingObject.anchor === 'bottom' ? 'bottom' : 'center';
        const fit =
          mappingObject.fit === 'width' || mappingObject.fit === 'height'
            ? mappingObject.fit
            : 'area';

        // First find how each animation would be drawn, as the sprite has a
        // single scale: the smallest one, so nothing grows out of its place.
        /** @type {Array<{animation: any, slotId: string, slot: any, placeholderFrame: any, placeholderImage: ImageBox, themeAnimation: any} | null>} */
        const themedAnimations = objectAnimations.map((animation) => {
          const slotId = slotIdByAnimation[animation.name] || mainSlotId;
          // A theme can have pixel art for the starters built on small tiles
          // next to its other art.
          const candidates =
            typeof slotId === 'string' ? getSlotCandidates(slotId) : [];
          const slot =
            (starterTileSize !== 64
              ? candidates.find((candidate) => !!candidate.tileSize)
              : candidates.find((candidate) => !candidate.tileSize)) ||
            candidates[0];
          const placeholderFrame = getAnimationFirstFrame(animation);
          const placeholderImage =
            placeholderFrame && getPlaceholderImage(placeholderFrame.image);
          if (!slot || slot.kind !== 'sprite' || !placeholderImage) return null;
          // A starter built on smaller tiles is pixel art: only art drawn on
          // a grid can be scaled to its pixels.
          if (starterTileSize !== 64 && !slot.tileSize) return null;

          /** @type {Array<any>} */
          const themeAnimations = slot.objectContent.animations || [];
          // The theme animation is the one the starter asks for by name
          // (`animations`), or the one named like the animation of the
          // starter, or the first one.
          /** @type {Array<string>} */
          const wantedNames = [
            ...((mappingObject.animations || {})[animation.name] || []),
            animation.name,
          ];
          const themeAnimation =
            wantedNames
              .map((wantedName) =>
                themeAnimations.find(
                  (themeAnimation) =>
                    !!wantedName &&
                    (themeAnimation.name || '').toLowerCase() ===
                      wantedName.toLowerCase()
                )
              )
              .find((themeAnimation) => !!themeAnimation) || themeAnimations[0];
          if (!getAnimationFirstFrame(themeAnimation)) return null;
          return {
            animation,
            slotId,
            slot,
            placeholderFrame,
            placeholderImage,
            themeAnimation,
          };
        });
        if (themedAnimations.some((themedAnimation) => !themedAnimation)) {
          usedSlotIds.forEach((slotId) => {
            const slot = theme.slots[slotId];
            if (!slot || slot.kind !== 'sprite') missingSlots.add(slotId);
          });
          if (!usedSlotIds.some((slotId) => missingSlots.has(slotId))) {
            usedSlotIds.forEach((slotId) => missingSlots.add(slotId));
          }
          return;
        }

        /** @param {any} themedAnimation @param {number=} forcedScale */
        const place = (themedAnimation, forcedScale) =>
          placeThemeSprite(
            themedAnimation.placeholderImage,
            getAnimationFirstFrame(themedAnimation.themeAnimation),
            anchor,
            fit,
            // Art drawn on a grid of tiles (pixel art) is scaled so its grid
            // becomes the one of the starter: the same scale for the whole
            // theme, whatever the size of each placeholder.
            forcedScale ||
              (themedAnimation.slot.tileSize
                ? starterTileSize / themedAnimation.slot.tileSize
                : undefined)
          );
        const placements = themedAnimations.map((themedAnimation) =>
          place(themedAnimation)
        );
        if (placements.some((placement) => !placement)) {
          usedSlotIds.forEach((slotId) => missingSlots.add(slotId));
          return;
        }
        const scale = Math.min(
          ...placements.map((placement) => (placement ? placement.scale : 1))
        );

        /** @type {Array<string>} */
        const placeholderImageNames = objectAnimations.flatMap(
          /** @param {any} animation */ (animation) =>
            (animation.directions || []).flatMap(
              /** @param {any} direction */ (direction) =>
                (direction.sprites || []).map(
                  /** @param {any} frame */ (frame) => frame.image
                )
            )
        );
        /** @param {any} slot @param {string} slotId */
        const makeUseThemeImage =
          (slot, slotId) =>
          /** @param {string} imageName */
          (imageName) => {
            const themeResource = slot.resources.find(
              /** @param {any} resource */ (resource) =>
                resource.name === imageName
            );
            return themeResource
              ? useThemeResource(
                  '',
                  slotId,
                  {
                    file: themeResource.file,
                    resourceName: themeResource.name,
                    origin: themeResource.origin,
                  },
                  themeResource
                )
              : null;
          };

        const animations = themedAnimations.map((themedAnimation) => {
          // @ts-ignore - checked above: every animation is themed and placed.
          const { animation, slot, slotId, themeAnimation } = themedAnimation;
          return makeThemedAnimation(
            themeAnimation,
            animation.name,
            // @ts-ignore
            themedAnimation.placeholderFrame,
            // @ts-ignore
            themedAnimation.placeholderImage,
            // @ts-ignore
            place(themedAnimation, scale),
            makeUseThemeImage(slot, slotId)
          );
        });
        // A sprite played by a single theme sprite also gets the other
        // animations of that sprite, ready to be used.
        const firstThemed = themedAnimations[0];
        if (usedSlotIds.length === 1 && firstThemed) {
          const usedNames = new Set(
            themedAnimations.map((themedAnimation) =>
              themedAnimation
                ? (themedAnimation.themeAnimation.name || '').toLowerCase()
                : ''
            )
          );
          (firstThemed.slot.objectContent.animations || []).forEach(
            /** @param {any} themeAnimation */ (themeAnimation) => {
              const name = themeAnimation.name || '';
              const isUsed =
                !name ||
                usedNames.has(name.toLowerCase()) ||
                objectAnimations.some(
                  (animation) =>
                    (animation.name || '').toLowerCase() === name.toLowerCase()
                );
              if (isUsed) return;
              animations.push(
                makeThemedAnimation(
                  themeAnimation,
                  name,
                  firstThemed.placeholderFrame,
                  firstThemed.placeholderImage,
                  // @ts-ignore
                  place(firstThemed, scale),
                  makeUseThemeImage(firstThemed.slot, firstThemed.slotId)
                )
              );
            }
          );
        }

        object.animations = animations;
        object.preScale = (object.preScale || 1) * scale;
        placeholderImageNames.forEach((imageName) =>
          replacedResourceNames.add(imageName)
        );

        // An instance with a custom size was sized for the placeholder image.
        if (firstThemed) {
          const widthRatio =
            (firstThemed.slot.width * scale) /
            firstThemed.placeholderImage.width;
          const heightRatio =
            (firstThemed.slot.height * scale) /
            firstThemed.placeholderImage.height;
          const themedOrigin = getAnimationFirstFrame(
            animations[0]
          ).originPoint;
          getInstancesOfObject(projectObject, objectPath).forEach(
            (instance) => {
              if (!instance.customSize) return;
              if (!firstThemed.slot.tileSize) {
                instance.width *= widthRatio;
                instance.height *= heightRatio;
                return;
              }

              // Art drawn on a grid keeps the scale of its grid: the instance
              // takes the size of the art, placed where the instance was.
              const { placeholderFrame, placeholderImage } = firstThemed;
              const left =
                instance.x -
                (placeholderFrame.originPoint.x * instance.width) /
                  placeholderImage.width;
              const top =
                instance.y -
                (placeholderFrame.originPoint.y * instance.height) /
                  placeholderImage.height;
              // Art wider than the instance is drawn at half the scale, so
              // that it does not cover what is next to the instance.
              const isHalved =
                scale % 2 === 0 &&
                firstThemed.slot.width * scale > instance.width;
              const instanceScale = isHalved ? scale / 2 : scale;
              const width = firstThemed.slot.width * instanceScale;
              const height = firstThemed.slot.height * instanceScale;
              instance.x =
                left +
                (instance.width - width) / 2 +
                themedOrigin.x * instanceScale;
              instance.y =
                top +
                (anchor === 'bottom'
                  ? instance.height - height
                  : (instance.height - height) / 2) +
                themedOrigin.y * instanceScale;
              instance.customSize = isHalved;
              instance.width = width;
              instance.height = height;
            }
          );
          if (usedSlotIds.length === 1 && firstThemed.slot.assetStoreId) {
            object.assetStoreId = firstThemed.slot.assetStoreId;
          }
        }
        changedObjectsCount++;
        return;
      }

      if (
        object.type === 'TiledSpriteObject::TiledSprite' ||
        object.type === 'PanelSpriteObject::PanelSprite'
      ) {
        if (typeof mapping !== 'string') return;
        const content = object.content || object;
        // An image is made for a size of tiles: 64 pixels unless it says so.
        const slot = getSlotCandidates(mapping).find(
          (candidate) =>
            candidate.kind === 'texture' &&
            (candidate.tileSize || 64) === starterTileSize
        );
        if (!slot || slot.kind !== 'texture') {
          missingSlots.add(mapping);
          return;
        }
        const textureResourceName = useThemeResource(
          content.texture,
          mapping,
          slot
        );
        if (!textureResourceName) return;
        content.texture = textureResourceName;
        changedObjectsCount++;
        return;
      }

      if (object.type === 'TileMap::SimpleTileMap') {
        const slotId = mappingObject.slot;
        if (typeof slotId !== 'string') return;
        const content = object.content;
        const slot = getSlotCandidates(slotId).find(
          (candidate) =>
            candidate.kind === 'tilemap' &&
            candidate.tileSize === content.tileSize
        );
        /** @type {Object.<string, string>} */
        const roleByTileId = mappingObject.tiles || {};
        if (
          !slot ||
          slot.kind !== 'tilemap' ||
          slot.tileSize !== content.tileSize ||
          Object.values(roleByTileId).some(
            (role) => slot.tiles[role] === undefined
          )
        ) {
          missingSlots.add(slotId);
          return;
        }
        const atlasResourceName = useThemeResource(
          content.atlasImage,
          slotId,
          slot
        );
        if (!atlasResourceName) return;

        /** @param {number} tileId */
        const toThemeTileId = (tileId) => {
          const role = roleByTileId[String(tileId)];
          return role === undefined ? -1 : slot.tiles[role];
        };
        content.atlasImage = atlasResourceName;
        content.columnCount = slot.columnCount;
        content.rowCount = slot.rowCount;
        content.tilesWithHitBox = String(content.tilesWithHitBox || '')
          .split(',')
          .filter((tileId) => tileId !== '')
          .map((tileId) => toThemeTileId(Number(tileId)))
          .filter((tileId) => tileId >= 0)
          .join(',');
        getInstancesOfObject(projectObject, objectPath).forEach((instance) =>
          (instance.stringProperties || []).forEach(
            /** @param {any} property */ (property) => {
              if (property.name !== 'tilemap' || !property.value) return;
              const tileMap = JSON.parse(property.value);
              (tileMap.layers || []).forEach(
                /** @param {any} layer */ (layer) => {
                  layer.tiles = (layer.tiles || []).map(
                    /** @param {Array<number>} row */ (row) =>
                      row.map((tileId) =>
                        tileId < 0 ? tileId : toThemeTileId(tileId)
                      )
                  );
                }
              );
              property.value = JSON.stringify(tileMap);
            }
          )
        );
        changedObjectsCount++;
        return;
      }

      if (!object.content) return;
      const objectContent = object.content;

      if (object.type === 'Scene3D::Model3DObject') {
        if (typeof mapping !== 'string') return;
        const slot = theme.slots[mapping];
        if (!slot || slot.kind !== 'model' || !slot.objectContent) {
          missingSlots.add(mapping);
          return;
        }
        const modelResourceName = useThemeResource(
          objectContent.modelResourceName,
          mapping,
          slot
        );
        if (!modelResourceName) return;

        const themeContent = slot.objectContent;
        const fit = getModelFit(mapping);
        const placeholderSize = getStarterModelSize(
          objectContent.modelResourceName
        );
        const placeholderModel = placeholderSize
          ? getRotatedModelDimensions(
              placeholderSize,
              objectContent.rotationX || 0,
              objectContent.rotationY || 0,
              objectContent.rotationZ || 0
            )
          : null;
        /** @param {ModelDimensions} box @returns {ModelDimensions} */
        const getDrawnPlaceholder = (box) =>
          getDrawnModelDimensions(
            box,
            placeholderModel,
            !!objectContent.keepAspectRatio
          );
        const room = {
          width: objectContent.width || 0,
          height: objectContent.height || 0,
          depth: objectContent.depth || 0,
        };
        const placeholder = getDrawnPlaceholder(room);
        const modelDimensions = slot.dimensions;
        const scale = getModelScale(mapping, slot);
        const fitScale =
          fit && modelDimensions
            ? getFitScale(fit, placeholder, room, modelDimensions)
            : null;
        const sizeRatio = getSizeRatio(objectContent, themeContent) * scale;
        /** @type {SizedModel} */
        const sizedModel = {
          objectPath,
          slotId: mapping,
          fit: null,
          scale,
          placeholder,
          themed: {
            width: (themeContent.width || 0) * sizeRatio,
            height: (themeContent.height || 0) * sizeRatio,
            depth: (themeContent.depth || 0) * sizeRatio,
          },
        };
        if (fit && modelDimensions && fitScale) {
          sizedModel.fit = fit;
          sizedModel.themed = scaleModelDimensions(
            modelDimensions,
            fitScale * scale
          );

          // An instance given its own size is the placeholder at another
          // size: the theme model takes the size its slot means there too.
          getInstancesOfObject(projectObject, objectPath).forEach(
            (instance) => {
              if (!instance.customSize) return;
              const instanceRoom = {
                width: instance.width,
                height: instance.height,
                depth:
                  instance.depth === undefined
                    ? objectContent.depth || 0
                    : instance.depth,
              };
              const instanceFitScale = getFitScale(
                fit,
                getDrawnPlaceholder(instanceRoom),
                instanceRoom,
                modelDimensions
              );
              if (!instanceFitScale) return;
              const instanceSize = scaleModelDimensions(
                modelDimensions,
                instanceFitScale * scale
              );
              instance.width = instanceSize.width;
              instance.height = instanceSize.height;
              instance.depth = instanceSize.depth;
            }
          );
        }
        sizedModels.push(sizedModel);
        const { themed } = sizedModel;

        object.content = {
          ...themeContent,
          modelResourceName,
          animations: mergeModel3DAnimations(
            objectContent.animations || [],
            themeContent.animations || []
          ),
          width: themed.width,
          height: themed.height,
          depth: themed.depth,
          // The origin and center drive collisions and placement: keep the
          // starter's, which its events and instances were built around.
          originLocation: objectContent.originLocation,
          centerLocation: objectContent.centerLocation,
        };
        if (slot.assetStoreId) object.assetStoreId = slot.assetStoreId;
        changedObjectsCount++;
        return;
      }

      if (object.type === 'Scene3D::Cube3DObject') {
        let changed = false;
        Object.keys(cubeFaceProperties).forEach((face) => {
          const faceMapping =
            typeof mapping === 'string' ? mapping : mappingObject[face];
          const slotId = typeof faceMapping === 'string' ? faceMapping : null;
          const faceProperty = cubeFaceProperties[face];
          const resourceName = objectContent[faceProperty];
          if (!slotId || !resourceName) return;
          const slot = theme.slots[slotId];
          if (!slot || (slot.kind !== 'texture' && slot.kind !== 'material')) {
            missingSlots.add(slotId);
            return;
          }
          const themeResourceName = useThemeResource(
            resourceName,
            slotId,
            slot
          );
          if (!themeResourceName) return;
          objectContent[faceProperty] = themeResourceName;
          changed = true;
        });
        if (changed) changedObjectsCount++;
        return;
      }

      if (
        typeof mapping !== 'string' &&
        themeCustomObjectProperties(objectPath, object, mappingObject)
      ) {
        changedObjectsCount++;
      }
    }
  );

  Object.entries(starterThemeSlots.effects || {}).forEach(
    ([effectPath, slotId]) => {
      const effect = effectsByPath.get(effectPath);
      if (!effect || !effect.stringParameters) return;
      const slot = theme.slots[slotId];
      if (!slot || slot.kind !== 'skybox') {
        missingSlots.add(slotId);
        return;
      }
      Object.entries(cubeFaceProperties).forEach(([face, faceProperty]) => {
        const resourceName = effect.stringParameters[faceProperty];
        const themeFile = slot.faces[face];
        if (!resourceName || !themeFile) return;
        const themeResourceName = useThemeResource(
          String(resourceName),
          slotId,
          themeFile
        );
        if (themeResourceName) {
          effect.stringParameters[faceProperty] = themeResourceName;
        }
      });
    }
  );

  // Remove the replaced resources, unless something else still refers to them.
  const projectWithoutResources = JSON.stringify({
    ...projectObject,
    resources: undefined,
  });
  const unusedResourceNames = [...replacedResourceNames].filter(
    (resourceName) =>
      !themeResourceNames.has(resourceName) &&
      !projectWithoutResources.includes(JSON.stringify(resourceName))
  );
  unusedResourceNames.forEach((resourceName) =>
    resources.splice(resources.indexOf(resourceByName.get(resourceName)), 1)
  );

  return {
    appliedSlots: [...appliedSlots].sort(),
    missingSlots: [...missingSlots].sort(),
    changedObjectsCount,
    changedResourcesCount: themeResourceNames.size,
    sizedModels,
  };
};

/**
 * The file a themed copy of a starter is written to: next to the starter, so
 * the resources it refers to by a relative path still resolve.
 * @param {string} slug
 * @param {string} themeId
 * @returns {string}
 */
const getThemedStarterFileName = (slug, themeId) =>
  `${slug}.theme-${themeId}.json`;

module.exports = {
  applyThemeToStarter,
  getThemedStarterFileName,
};

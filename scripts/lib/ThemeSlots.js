// @ts-check
const path = require('path');
const fs = require('fs').promises;

/**
 * The vocabulary of slots a theme can fill, shared by every starter. The
 * description of a slot is what the authors of themes read to choose its asset.
 * @typedef {{
 *   version: number,
 *   slots: Array<{id: string, kind: ThemeSlotKind, label: string, description: string}>,
 * }} ThemeSlotsVocabulary
 *
 * @typedef {'model' | 'texture' | 'material' | 'skybox' | 'color' | 'sprite' | 'tilemap'} ThemeSlotKind
 */

/**
 * A starter's own mapping, next to its game file: which of its objects a theme
 * re-skins, and as what. Object paths are `scene:<scene>/<object>`,
 * `global/<object>` or `object:<Extension>::<CustomObject>/<child>`. A cube
 * maps either to one texture slot for all six faces, or to one slot per face.
 * A skybox effect (`effect:<scene>/<layer>/<effect>`) maps to one skybox slot.
 *
 * A custom object (like a 3D terrain) maps its properties: an image resource
 * to a texture slot, a color to a color slot, or an image resource to a
 * material slot along with the property taking the normal map of the material
 * (`{"slot": "terrain.ground", "normalMap": "Layer1NormalMap"}`).
 *
 * In a 2D starter, a sprite maps to a sprite slot, or to
 * `{"slot": "2d.side.player", "anchor": "bottom", "fit": "height"}` to say how
 * the theme art is placed where the placeholder art was: standing on its
 * bottom instead of centered, taking its width or its height instead of
 * covering the same area. A tiled sprite or a panel sprite maps to a texture
 * slot. A tile map maps to a tile map slot along with the role each of its
 * tiles plays (`{"slot": "2d.overhead.tilemap", "tiles": {"0": "ground"}}`).
 * With `requireAllSlots`, a theme re-skins the starter only if it fills every
 * slot the starter maps: 2D art of a theme next to placeholder art looks
 * broken, where an unthemed 3D model is hardly noticed.
 * @typedef {{
 *   version: number,
 *   requireAllSlots?: boolean,
 *   tileSize?: number,
 *   objects: Object.<string, string | SpriteMapping | TileMapMapping | Object.<string, string | MaterialMapping>>,
 *   effects?: Object.<string, string>,
 *   ignoredObjects?: Array<string>,
 * }} StarterThemeSlots
 *
 * @typedef {{slot: string, normalMap: string}} MaterialMapping
 * @typedef {{slot?: string, anchor?: 'center' | 'bottom', fit?: 'area' | 'width' | 'height', animations?: Object.<string, Array<string>>, animationSlots?: Object.<string, string>}} SpriteMapping
 * @typedef {{slot: string, tiles: Object.<string, string>}} TileMapMapping
 */

const vocabularyPath = path.join(__dirname, '../../theme-slots.json');

/** @returns {Promise<ThemeSlotsVocabulary>} */
const loadThemeSlotsVocabulary = async () =>
  JSON.parse(await fs.readFile(vocabularyPath, 'utf8'));

/** The kind of slot each type of 2D object maps to. */
const slotKindBy2DObjectType = {
  Sprite: 'sprite',
  'TiledSpriteObject::TiledSprite': 'texture',
  'PanelSpriteObject::PanelSprite': 'texture',
  'TileMap::SimpleTileMap': 'tilemap',
};

/**
 * The 2D objects of a project a theme can re-skin, by the path a mapping
 * refers to them by.
 * @param {any} projectObject
 * @returns {Map<string, string>} The type of each object.
 */
const get2DThemeableObjects = (projectObject) => {
  /** @type {Map<string, string>} */
  const typeByPath = new Map();
  /** @param {string} prefix @param {Array<any>} list */
  const collect = (prefix, list) =>
    (list || []).forEach((object) => {
      if (object.type in slotKindBy2DObjectType) {
        typeByPath.set(`${prefix}/${object.name}`, object.type);
      }
    });
  collect('global', projectObject.objects);
  (projectObject.layouts || []).forEach(
    /** @param {any} layout */ (layout) =>
      collect(`scene:${layout.name}`, layout.objects)
  );
  return typeByPath;
};

/**
 * The 2D objects a starter maps must exist and map to a slot of their kind.
 * Unlike 3D objects, the 2D objects left unmapped are not an error: they are
 * the interface of the starter (buttons, joysticks, texts).
 * @param {ThemeSlotsVocabulary} vocabulary
 * @param {string} slug
 * @param {any} projectObject
 * @param {StarterThemeSlots} starterThemeSlots
 * @param {boolean} is3D
 * @returns {Error[]}
 */
const check2DObjectsThemeSlots = (
  vocabulary,
  slug,
  projectObject,
  starterThemeSlots,
  is3D
) => {
  /** @type {Error[]} */
  const errors = [];
  const slotKindById = new Map(
    vocabulary.slots.map((slot) => [slot.id, slot.kind])
  );
  const typeByPath = get2DThemeableObjects(projectObject);

  Object.entries(starterThemeSlots.objects || {}).forEach(
    ([objectPath, mapping]) => {
      const type = typeByPath.get(objectPath);
      if (!type) {
        // The objects of a 3D starter are checked with its 3D objects.
        if (!is3D) {
          errors.push(
            new Error(
              `Starter "${slug}": theme-slots.json maps "${objectPath}", which is not a sprite, tiled sprite, panel sprite or tile map of the starter.`
            )
          );
        }
        return;
      }

      // @ts-ignore - the type is one of the keys.
      const expectedKind = slotKindBy2DObjectType[type];
      /** @type {any} */
      const mappingObject = typeof mapping === 'string' ? {} : mapping;
      // A sprite can map each of its animations to its own slot.
      /** @type {Array<string>} */
      const slotIds = [
        ...(typeof mapping === 'string'
          ? [mapping]
          : mappingObject.slot !== undefined || !mappingObject.animationSlots
          ? [mappingObject.slot]
          : []),
        ...Object.values(mappingObject.animationSlots || {}),
      ];
      let hasError = false;
      slotIds.forEach((slotId) => {
        const declaredKind = slotKindById.get(slotId);
        if (typeof slotId !== 'string' || !declaredKind) {
          hasError = true;
          errors.push(
            new Error(
              `Starter "${slug}": "${objectPath}" maps to "${slotId}", which is not a slot of theme-slots.json.`
            )
          );
        } else if (declaredKind !== expectedKind) {
          hasError = true;
          errors.push(
            new Error(
              `Starter "${slug}": "${objectPath}" maps to "${slotId}", a ${declaredKind} slot, but needs a ${expectedKind} slot.`
            )
          );
        }
      });
      if (hasError) return;
      if (expectedKind === 'tilemap' && !mappingObject.tiles) {
        errors.push(
          new Error(
            `Starter "${slug}": the tile map "${objectPath}" must map the role of each of its tiles ("tiles").`
          )
        );
      }
    }
  );
  return errors;
};

const cubeFaceProperties = [
  'frontFaceResourceName',
  'backFaceResourceName',
  'leftFaceResourceName',
  'rightFaceResourceName',
  'topFaceResourceName',
  'bottomFaceResourceName',
];

/**
 * The type of a property of a custom object, and for a resource, its kind
 * (like "image" or "model3D").
 * @typedef {{type: string, resourceKind: string}} PropertyType
 */

/**
 * The properties of each custom object type of a project, by type.
 * @param {any} projectObject
 * @returns {Map<string, Map<string, PropertyType>>}
 */
const getCustomObjectPropertyTypes = (projectObject) => {
  /** @type {Map<string, Map<string, PropertyType>>} */
  const propertyTypesByObjectType = new Map();
  (projectObject.eventsFunctionsExtensions || []).forEach(
    /** @param {any} extension */ (extension) =>
      (extension.eventsBasedObjects || []).forEach(
        /** @param {any} eventsBasedObject */ (eventsBasedObject) =>
          propertyTypesByObjectType.set(
            `${extension.name}::${eventsBasedObject.name}`,
            new Map(
              (eventsBasedObject.propertyDescriptors || []).map(
                /** @param {any} property */ (property) => [
                  property.name,
                  {
                    type: property.type,
                    resourceKind:
                      property.type === 'Resource'
                        ? (property.extraInformation || [])[0] || ''
                        : '',
                  },
                ]
              )
            )
          )
      )
  );
  return propertyTypesByObjectType;
};

/**
 * Every object of a project a theme could re-skin, with the path a mapping
 * refers to it by, plus every skybox effect. Custom objects are listed apart:
 * a starter maps those of their properties it wants themed, if any.
 * @param {any} projectObject
 * @returns {{
 *   objects: Array<{path: string, type: string}>,
 *   customObjects: Array<{path: string, type: string, propertyTypes: Map<string, PropertyType>}>,
 *   effects: Array<string>,
 *   is3D: boolean,
 * }}
 */
const getThemeableObjects = (projectObject) => {
  /** @type {Array<{path: string, type: string}>} */
  const objects = [];
  /** @type {Array<{path: string, type: string, propertyTypes: Map<string, PropertyType>}>} */
  const customObjects = [];
  /** @type {Array<string>} */
  const effects = [];
  const themeableTypes = ['Scene3D::Model3DObject', 'Scene3D::Cube3DObject'];
  const propertyTypesByObjectType = getCustomObjectPropertyTypes(projectObject);

  /** @param {string} prefix @param {Array<any>} list */
  const collect = (prefix, list) =>
    (list || []).forEach((object) => {
      const objectPath = `${prefix}/${object.name}`;
      if (themeableTypes.includes(object.type)) {
        objects.push({ path: objectPath, type: object.type });
        return;
      }
      const propertyTypes = propertyTypesByObjectType.get(object.type);
      if (propertyTypes) {
        customObjects.push({
          path: objectPath,
          type: object.type,
          propertyTypes,
        });
      }
    });

  collect('global', projectObject.objects);
  (projectObject.layouts || []).forEach(
    /** @param {any} layout */ (layout) => {
      collect(`scene:${layout.name}`, layout.objects);
      (layout.layers || []).forEach(
        /** @param {any} layer */ (layer) =>
          (layer.effects || []).forEach(
            /** @param {any} effect */ (effect) => {
              if ((effect.effectType || '').includes('Skybox')) {
                effects.push(
                  `effect:${layout.name}/${layer.name}/${effect.name}`
                );
              }
            }
          )
      );
    }
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

  return {
    objects,
    customObjects,
    effects,
    is3D: objects.length > 0 || effects.length > 0,
  };
};

/**
 * A 3D starter must say, for each object a theme could re-skin, which slot it
 * plays or that it is deliberately left alone; and must not refer to objects
 * or slots that do not exist. Enforced by the build so a starter cannot ship
 * art the themes don't know how to replace.
 * @param {ThemeSlotsVocabulary} vocabulary
 * @param {string} slug
 * @param {any} projectObject
 * @param {StarterThemeSlots | null} starterThemeSlots
 * @returns {Error[]}
 */
const checkStarterThemeSlots = (
  vocabulary,
  slug,
  projectObject,
  starterThemeSlots
) => {
  /** @type {Error[]} */
  const errors = [];
  const { objects, customObjects, effects, is3D } =
    getThemeableObjects(projectObject);
  if (starterThemeSlots) {
    errors.push(
      ...check2DObjectsThemeSlots(
        vocabulary,
        slug,
        projectObject,
        starterThemeSlots,
        is3D
      )
    );
  }
  if (!is3D) return errors;

  if (!starterThemeSlots) {
    errors.push(
      new Error(
        `Starter "${slug}" is a 3D starter but has no theme-slots.json: add one mapping its objects to theme slots (see the README).`
      )
    );
    return errors;
  }

  const slotKindById = new Map(
    vocabulary.slots.map((slot) => [slot.id, slot.kind])
  );
  const typeByPath = new Map(
    objects.map((object) => [object.path, object.type])
  );
  const customObjectByPath = new Map(
    customObjects.map((customObject) => [customObject.path, customObject])
  );
  const effectPaths = new Set(effects);
  const mapped = starterThemeSlots.objects || {};
  const ignored = new Set(starterThemeSlots.ignoredObjects || []);
  const mappedEffects = starterThemeSlots.effects || {};

  /** @param {string} where @param {string} slotId @param {ThemeSlotKind} kind */
  const checkSlot = (where, slotId, kind) => {
    const declaredKind = slotKindById.get(slotId);
    if (!declaredKind) {
      errors.push(
        new Error(
          `Starter "${slug}": ${where} maps to "${slotId}", which is not a slot of theme-slots.json.`
        )
      );
    } else if (declaredKind !== kind) {
      errors.push(
        new Error(
          `Starter "${slug}": ${where} maps to "${slotId}", a ${declaredKind} slot, but needs a ${kind} slot.`
        )
      );
    }
  };

  objects.forEach(({ path: objectPath, type }) => {
    if (ignored.has(objectPath)) return;
    const mapping = mapped[objectPath];
    if (mapping === undefined) {
      errors.push(
        new Error(
          `Starter "${slug}": the ${type} "${objectPath}" is neither mapped to a slot nor listed in ignoredObjects in theme-slots.json.`
        )
      );
      return;
    }
    if (type === 'Scene3D::Model3DObject') {
      if (typeof mapping !== 'string') {
        errors.push(
          new Error(
            `Starter "${slug}": "${objectPath}" is a 3D model and must map to a single model slot.`
          )
        );
        return;
      }
      checkSlot(`"${objectPath}"`, mapping, 'model');
    } else if (typeof mapping === 'string') {
      checkSlot(`"${objectPath}"`, mapping, 'texture');
    } else {
      Object.entries(mapping).forEach(([face, slotId]) => {
        if (
          typeof slotId !== 'string' ||
          !cubeFaceProperties.some((property) => property.startsWith(face))
        ) {
          errors.push(
            new Error(
              `Starter "${slug}": "${objectPath}" maps the unknown cube face "${face}".`
            )
          );
          return;
        }
        checkSlot(`"${objectPath}" face "${face}"`, slotId, 'texture');
      });
    }
  });

  /**
   * @param {string} objectPath
   * @param {Map<string, PropertyType>} propertyTypes
   * @param {string} property
   * @param {string} expectedType
   * @returns {boolean}
   */
  const checkProperty = (objectPath, propertyTypes, property, expectedType) => {
    const propertyType = propertyTypes.get(property);
    if (propertyType && propertyType.type === expectedType) return true;
    errors.push(
      new Error(
        propertyType
          ? `Starter "${slug}": "${objectPath}" maps its property "${property}", a ${propertyType.type}, but only resources and colors can be themed.`
          : `Starter "${slug}": "${objectPath}" maps the property "${property}", which its object does not have.`
      )
    );
    return false;
  };

  customObjects.forEach(({ path: objectPath, type, propertyTypes }) => {
    if (ignored.has(objectPath)) return;
    const mapping = mapped[objectPath];
    if (mapping === undefined) {
      // Like 3D model objects, the models drawn by a custom object (like
      // scattered trees) must follow the theme or be explicitly kept.
      const hasModel = [...propertyTypes.values()].some(
        (propertyType) => propertyType.resourceKind === 'model3D'
      );
      if (hasModel) {
        errors.push(
          new Error(
            `Starter "${slug}": the ${type} "${objectPath}" draws a 3D model but is neither mapped to slots nor listed in ignoredObjects in theme-slots.json.`
          )
        );
      }
      return;
    }
    if (typeof mapping === 'string') {
      errors.push(
        new Error(
          `Starter "${slug}": "${objectPath}" is a custom object and must map its properties to slots.`
        )
      );
      return;
    }
    /** @type {Object.<string, string | MaterialMapping>} */
    // @ts-ignore - the mapping of a custom object maps its properties.
    const propertiesMapping = mapping;
    Object.entries(propertiesMapping).forEach(([property, propertyMapping]) => {
      const where = `"${objectPath}" property "${property}"`;
      if (typeof propertyMapping !== 'string') {
        if (
          checkProperty(objectPath, propertyTypes, property, 'Resource') &&
          checkProperty(
            objectPath,
            propertyTypes,
            propertyMapping.normalMap,
            'Resource'
          )
        ) {
          checkSlot(where, propertyMapping.slot, 'material');
        }
        return;
      }
      const propertyType = propertyTypes.get(property);
      if (propertyType && propertyType.type === 'Color') {
        checkSlot(where, propertyMapping, 'color');
      } else if (
        checkProperty(objectPath, propertyTypes, property, 'Resource')
      ) {
        checkSlot(
          where,
          propertyMapping,
          propertyType && propertyType.resourceKind === 'model3D'
            ? 'model'
            : 'texture'
        );
      }
    });
  });

  Object.keys(mapped).forEach((objectPath) => {
    if (!typeByPath.has(objectPath) && !customObjectByPath.has(objectPath)) {
      errors.push(
        new Error(
          `Starter "${slug}": theme-slots.json maps "${objectPath}", which is not a 3D object of the starter anymore.`
        )
      );
    }
  });
  ignored.forEach((objectPath) => {
    if (!typeByPath.has(objectPath) && !customObjectByPath.has(objectPath)) {
      errors.push(
        new Error(
          `Starter "${slug}": theme-slots.json ignores "${objectPath}", which is not a 3D object of the starter anymore.`
        )
      );
    }
  });
  Object.entries(mappedEffects).forEach(([effectPath, slotId]) => {
    if (!effectPaths.has(effectPath)) {
      errors.push(
        new Error(
          `Starter "${slug}": theme-slots.json maps the effect "${effectPath}", which is not a skybox of the starter anymore.`
        )
      );
      return;
    }
    if (typeof slotId !== 'string') {
      errors.push(
        new Error(
          `Starter "${slug}": the skybox "${effectPath}" must map to a single skybox slot.`
        )
      );
      return;
    }
    checkSlot(`skybox "${effectPath}"`, slotId, 'skybox');
  });

  return errors;
};

module.exports = {
  loadThemeSlotsVocabulary,
  getThemeableObjects,
  checkStarterThemeSlots,
  cubeFaceProperties,
};

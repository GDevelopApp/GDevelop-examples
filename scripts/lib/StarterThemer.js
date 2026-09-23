// @ts-check

/** @typedef {import('./ThemeSlots.js').StarterThemeSlots} StarterThemeSlots */

/**
 * A theme, as published by the assets repository: for each slot, the file to
 * use and, for a 3D model, the serialized content of the asset's object.
 * @typedef {{
 *   kind: 'model' | 'texture',
 *   file: string,
 *   resourceName: string,
 *   objectContent?: any,
 *   assetStoreId?: string,
 *   origin?: {name: string, identifier: string},
 * }} ThemeSlot
 *
 * @typedef {{
 *   id: string,
 *   name: string,
 *   description: string,
 *   slots: Object.<string, ThemeSlot>,
 * }} Theme
 *
 * @typedef {{
 *   appliedSlots: Array<string>,
 *   missingSlots: Array<string>,
 *   changedObjectsCount: number,
 *   changedResourcesCount: number,
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
 * Re-skin a starter with a theme by rewriting its serialized project, in place.
 *
 * The starter's theme-slots.json says which of its objects play which slot.
 * Each such object gets the theme's asset for that slot: a 3D model takes the
 * theme model's dimensions, rotation, material and animations while keeping
 * its name, behaviors, variables, instances, origin and center; a cube face or
 * a skybox face points at the theme image.
 *
 * Each theme file becomes a resource named like in the asset store, and the
 * resources of the starter that nothing uses anymore are removed.
 *
 * @param {any} projectObject
 * @param {StarterThemeSlots} starterThemeSlots
 * @param {Theme} theme
 * @returns {ThemeApplicationResult}
 */
const applyThemeToStarter = (projectObject, starterThemeSlots, theme) => {
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

  /**
   * Add the resource of a slot to the project, configured like the resource it
   * replaces, and return its name.
   * @param {string} replacedResourceName
   * @param {string} slotId
   * @returns {string | null}
   */
  const useThemeResource = (replacedResourceName, slotId) => {
    const slot = theme.slots[slotId];
    if (!slot) {
      missingSlots.add(slotId);
      return null;
    }
    const replacedResource = resourceByName.get(replacedResourceName);
    if (!replacedResource) return null;

    // A resource of the starter can already have that name: number the new one.
    let name = slot.resourceName;
    for (
      let index = 2;
      resourceByName.has(name) && resourceByName.get(name).file !== slot.file;
      index++
    ) {
      name = `${slot.resourceName} ${index}`;
    }

    if (!resourceByName.has(name)) {
      const themeResource = {
        ...replacedResource,
        name,
        file: slot.file,
        origin: slot.origin || {
          name: 'gdevelop-asset-store',
          identifier: slot.file,
        },
      };
      resources.push(themeResource);
      resourceByName.set(name, themeResource);
    }

    appliedSlots.add(slotId);
    themeResourceNames.add(name);
    replacedResourceNames.add(replacedResourceName);
    return name;
  };

  Object.entries(starterThemeSlots.objects || {}).forEach(
    ([objectPath, mapping]) => {
      const object = objectsByPath.get(objectPath);
      if (!object || !object.content) return;
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
          mapping
        );
        if (!modelResourceName) return;

        const themeContent = slot.objectContent;
        const sizeRatio = getSizeRatio(objectContent, themeContent);
        object.content = {
          ...themeContent,
          modelResourceName,
          animations: mergeModel3DAnimations(
            objectContent.animations || [],
            themeContent.animations || []
          ),
          width: (themeContent.width || 0) * sizeRatio,
          height: (themeContent.height || 0) * sizeRatio,
          depth: (themeContent.depth || 0) * sizeRatio,
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
          const slotId = typeof mapping === 'string' ? mapping : mapping[face];
          const faceProperty = cubeFaceProperties[face];
          const resourceName = objectContent[faceProperty];
          if (!slotId || !resourceName) return;
          const themeResourceName = useThemeResource(resourceName, slotId);
          if (!themeResourceName) return;
          objectContent[faceProperty] = themeResourceName;
          changed = true;
        });
        if (changed) changedObjectsCount++;
      }
    }
  );

  Object.entries(starterThemeSlots.effects || {}).forEach(
    ([effectPath, parameters]) => {
      const effect = effectsByPath.get(effectPath);
      if (!effect || !effect.stringParameters) return;
      Object.entries(parameters).forEach(([parameter, slotId]) => {
        const resourceName = effect.stringParameters[parameter];
        if (!resourceName) return;
        const themeResourceName = useThemeResource(
          String(resourceName),
          slotId
        );
        if (themeResourceName) {
          effect.stringParameters[parameter] = themeResourceName;
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

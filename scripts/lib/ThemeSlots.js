// @ts-check
const path = require('path');
const fs = require('fs').promises;

/**
 * The vocabulary of slots a theme can fill, shared by every starter.
 * @typedef {{
 *   version: number,
 *   slots: Array<{id: string, kind: 'model' | 'texture', label: string}>,
 * }} ThemeSlotsVocabulary
 */

/**
 * A starter's own mapping, next to its game file: which of its objects a theme
 * re-skins, and as what. Object paths are `scene:<scene>/<object>`,
 * `global/<object>` or `object:<Extension>::<CustomObject>/<child>`. A cube
 * maps either to one texture slot for all six faces, or to one slot per face.
 * @typedef {{
 *   version: number,
 *   objects: Object.<string, string | Object.<string, string>>,
 *   effects?: Object.<string, Object.<string, string>>,
 *   ignoredObjects?: Array<string>,
 * }} StarterThemeSlots
 */

const vocabularyPath = path.join(__dirname, '../../theme-slots.json');

/** @returns {Promise<ThemeSlotsVocabulary>} */
const loadThemeSlotsVocabulary = async () =>
  JSON.parse(await fs.readFile(vocabularyPath, 'utf8'));

const cubeFaceProperties = [
  'frontFaceResourceName',
  'backFaceResourceName',
  'leftFaceResourceName',
  'rightFaceResourceName',
  'topFaceResourceName',
  'bottomFaceResourceName',
];

/**
 * Every object of a project a theme could re-skin, with the path a mapping
 * refers to it by, plus every skybox effect.
 * @param {any} projectObject
 * @returns {{objects: Array<{path: string, type: string}>, effects: Array<string>, is3D: boolean}}
 */
const getThemeableObjects = (projectObject) => {
  /** @type {Array<{path: string, type: string}>} */
  const objects = [];
  /** @type {Array<string>} */
  const effects = [];
  const themeableTypes = ['Scene3D::Model3DObject', 'Scene3D::Cube3DObject'];

  /** @param {string} prefix @param {Array<any>} list */
  const collect = (prefix, list) =>
    (list || []).forEach((object) => {
      if (themeableTypes.includes(object.type)) {
        objects.push({ path: `${prefix}/${object.name}`, type: object.type });
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

  return { objects, effects, is3D: objects.length > 0 || effects.length > 0 };
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
  const { objects, effects, is3D } = getThemeableObjects(projectObject);
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
  const effectPaths = new Set(effects);
  const mapped = starterThemeSlots.objects || {};
  const ignored = new Set(starterThemeSlots.ignoredObjects || []);
  const mappedEffects = starterThemeSlots.effects || {};

  /** @param {string} where @param {string} slotId @param {'model'|'texture'} kind */
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
        if (!cubeFaceProperties.some((property) => property.startsWith(face))) {
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

  Object.keys(mapped).forEach((objectPath) => {
    if (!typeByPath.has(objectPath)) {
      errors.push(
        new Error(
          `Starter "${slug}": theme-slots.json maps "${objectPath}", which is not a 3D object of the starter anymore.`
        )
      );
    }
  });
  ignored.forEach((objectPath) => {
    if (!typeByPath.has(objectPath)) {
      errors.push(
        new Error(
          `Starter "${slug}": theme-slots.json ignores "${objectPath}", which is not a 3D object of the starter anymore.`
        )
      );
    }
  });
  Object.entries(mappedEffects).forEach(([effectPath, faces]) => {
    if (!effectPaths.has(effectPath)) {
      errors.push(
        new Error(
          `Starter "${slug}": theme-slots.json maps the effect "${effectPath}", which is not a skybox of the starter anymore.`
        )
      );
      return;
    }
    Object.entries(faces).forEach(([parameter, slotId]) =>
      checkSlot(
        `skybox "${effectPath}" parameter "${parameter}"`,
        slotId,
        'texture'
      )
    );
  });

  return errors;
};

module.exports = {
  loadThemeSlotsVocabulary,
  getThemeableObjects,
  checkStarterThemeSlots,
  cubeFaceProperties,
};

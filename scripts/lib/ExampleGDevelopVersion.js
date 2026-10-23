// @ts-check

/**
 * The actions and conditions that need a GDevelop more recent than the one
 * needed by the extensions used by an example.
 * @type {Object.<string, string>}
 */
const gdevelopVersionsByInstructionType = {
  // The "Body type" action of the 3D physics.
  'Physics3D::Physics3DBehavior::SetBodyType': '>=5.6.285',
};

/**
 * @param {*} value A part of a project, as read from its file.
 * @param {Set<string>} instructionTypes Filled with the types of the actions
 * and conditions found in it.
 */
const collectInstructionTypes = (value, instructionTypes) => {
  if (Array.isArray(value)) {
    for (const item of value) collectInstructionTypes(item, instructionTypes);
    return;
  }
  if (!value || typeof value !== 'object') return;
  if (
    value.type &&
    typeof value.type.value === 'string' &&
    Array.isArray(value.parameters)
  ) {
    instructionTypes.add(value.type.value);
  }
  for (const key in value)
    collectInstructionTypes(value[key], instructionTypes);
};

/**
 * The versions of GDevelop able to open an example, like ">=5.5.220", or an
 * empty string for any version.
 * TODO: set to the GDevelop version used to author the example?
 * @param {*} projectObject The project, as read from its file.
 * @param {Array<string>} usedExtensionNames
 * @returns {string}
 */
const getExampleGDevelopVersion = (projectObject, usedExtensionNames) => {
  /** @type {Set<string>} */
  const instructionTypes = new Set();
  collectInstructionTypes(projectObject, instructionTypes);
  for (const instructionType in gdevelopVersionsByInstructionType) {
    if (instructionTypes.has(instructionType)) {
      return gdevelopVersionsByInstructionType[instructionType];
    }
  }
  return usedExtensionNames.includes('Physics3D') ? '>=5.5.220' : '';
};

module.exports = { getExampleGDevelopVersion };

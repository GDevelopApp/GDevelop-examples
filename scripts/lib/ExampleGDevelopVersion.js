// @ts-check

/**
 * The actions and conditions that need a GDevelop more recent than the one
 * needed by the extensions used by an example.
 * @type {Object.<string, string>}
 */
const gdevelopVersionsByInstructionType = {
  // The "Body type" action of the 3D physics.
  'Physics3D::Physics3DBehavior::SetBodyType': '>=5.6.285',
  // The conditions comparing objects in 3D.
  Distance3D: '>=5.6.286',
  IsTurnedTowardObject3D: '>=5.6.286',
};

/**
 * The expressions, written in the parameters of the actions and conditions,
 * that need a GDevelop more recent than the one needed by the extensions used
 * by an example.
 * @type {Array<{expressionPattern: RegExp, gdevelopVersion: string}>}
 */
const gdevelopVersionsByExpression = [
  {
    // The conversions of a custom object to and from the space containing it,
    // used by the events of the custom object.
    expressionPattern:
      /\bObject\.(?:To|From)Parent(?:X|Y|Z|Angle|DirectionX|DirectionY|DirectionZ)\(/,
    gdevelopVersion: '>=5.6.286',
  },
  {
    // The distances in 3D.
    expressionPattern:
      /::Distance3D\(|::DistanceToPosition3D\(|\bDistanceBetweenPositions3D\(/,
    gdevelopVersion: '>=5.6.286',
  },
];

/**
 * @param {*} value A part of a project, as read from its file.
 * @param {Set<string>} instructionTypes Filled with the types of the actions
 * and conditions found in it.
 * @param {Set<string>} instructionParameters Filled with the parameters of
 * these actions and conditions.
 */
const collectInstructions = (
  value,
  instructionTypes,
  instructionParameters
) => {
  if (Array.isArray(value)) {
    for (const item of value)
      collectInstructions(item, instructionTypes, instructionParameters);
    return;
  }
  if (!value || typeof value !== 'object') return;
  if (
    value.type &&
    typeof value.type.value === 'string' &&
    Array.isArray(value.parameters)
  ) {
    instructionTypes.add(value.type.value);
    for (const parameter of value.parameters) {
      if (typeof parameter === 'string') instructionParameters.add(parameter);
    }
  }
  for (const key in value)
    collectInstructions(value[key], instructionTypes, instructionParameters);
};

/**
 * @param {string} gdevelopVersion Like ">=5.6.285".
 * @returns {Array<number>}
 */
const getVersionNumbers = (gdevelopVersion) =>
  gdevelopVersion.replace('>=', '').split('.').map(Number);

/**
 * @param {string} gdevelopVersion Like ">=5.6.286".
 * @param {string} otherGDevelopVersion Like ">=5.6.285".
 * @returns {boolean}
 */
const isMoreRecentThan = (gdevelopVersion, otherGDevelopVersion) => {
  const versionNumbers = getVersionNumbers(gdevelopVersion);
  const otherVersionNumbers = getVersionNumbers(otherGDevelopVersion);
  for (let index = 0; index < versionNumbers.length; index++) {
    const difference =
      (versionNumbers[index] || 0) - (otherVersionNumbers[index] || 0);
    if (difference !== 0) return difference > 0;
  }
  return false;
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
  /** @type {Set<string>} */
  const instructionParameters = new Set();
  collectInstructions(projectObject, instructionTypes, instructionParameters);

  const neededGDevelopVersions = [
    ...Object.keys(gdevelopVersionsByInstructionType)
      .filter((instructionType) => instructionTypes.has(instructionType))
      .map(
        (instructionType) => gdevelopVersionsByInstructionType[instructionType]
      ),
    ...gdevelopVersionsByExpression
      .filter(({ expressionPattern }) =>
        [...instructionParameters].some((parameter) =>
          expressionPattern.test(parameter)
        )
      )
      .map(({ gdevelopVersion }) => gdevelopVersion),
    ...(usedExtensionNames.includes('Physics3D') ? ['>=5.5.220'] : []),
  ];
  return neededGDevelopVersions.reduce(
    (mostRecentGDevelopVersion, gdevelopVersion) =>
      !mostRecentGDevelopVersion ||
      isMoreRecentThan(gdevelopVersion, mostRecentGDevelopVersion)
        ? gdevelopVersion
        : mostRecentGDevelopVersion,
    ''
  );
};

module.exports = { getExampleGDevelopVersion };

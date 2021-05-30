const fs = require('fs');

/** @typedef {import('../types').libGDevelop} libGDevelop */
/** @typedef {import('../types').gdProject} gdProject */

/**
 * @param {libGDevelop} gd
 * @param {any} serializable
 * @param {string} methodName
 * @returns {string}
 */
const serializeToJSON = (gd, serializable, methodName = 'serializeTo') => {
  const serializedElement = new gd.SerializerElement();
  serializable[methodName](serializedElement);
  // TODO: this could be speed up with a gd.Serializer.toPrettyJSON
  // (and used in the IDE LocalProjectWriter.js too).
  const json = JSON.stringify(
    JSON.parse(gd.Serializer.toJSON(serializedElement)),
    null,
    2
  );
  serializedElement.delete();

  return json;
};

module.exports = {
  /**
   * @param {libGDevelop} gd
   * @param {gdProject} project
   * @param {string} filepath
   * @returns {Promise<void>}
   */
  writeProjectJSONFile: (gd, project, filepath) => {
    return new Promise((resolve, reject) => {
      if (!fs) return reject('Not supported');

      try {
        const content = serializeToJSON(gd, project);
        fs.writeFile(filepath, content, (err) => {
          if (err) return reject(err);

          resolve();
        });
      } catch (e) {
        return reject(e);
      }
    });
  },
};

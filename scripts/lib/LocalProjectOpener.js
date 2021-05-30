/** @typedef {import('../types').libGDevelop} libGDevelop */

module.exports = {
  /**
   * @param {libGDevelop} gd
   * @param {Object} projectObject
   */
  loadSerializedProject: (gd, projectObject) => {
    const serializedProject = gd.Serializer.fromJSObject(projectObject);
    const newProject = gd.ProjectHelper.createNewGDJSProject();
    newProject.unserializeFrom(serializedProject);

    return newProject;
  },
};

// @ts-check

/**
 * The size of the model of a .glb file along each axis of the file, before
 * any rotation: most models stand on Y.
 * @typedef {{x: number, y: number, z: number}} GlbSize
 */

/**
 * @param {Array<number>} a
 * @param {Array<number>} b
 * @returns {Array<number>} The product of two 4x4 matrices, column-major.
 */
const multiply = (a, b) => {
  const result = new Array(16).fill(0);
  for (let column = 0; column < 4; column++) {
    for (let row = 0; row < 4; row++) {
      for (let k = 0; k < 4; k++) {
        result[column * 4 + row] += a[k * 4 + row] * b[column * 4 + k];
      }
    }
  }
  return result;
};

/**
 * @param {any} node A glTF node.
 * @returns {Array<number>} Its local matrix, column-major.
 */
const getNodeMatrix = (node) => {
  if (node.matrix) return node.matrix;
  const [x, y, z, w] = node.rotation || [0, 0, 0, 1];
  const [sx, sy, sz] = node.scale || [1, 1, 1];
  const [tx, ty, tz] = node.translation || [0, 0, 0];
  return [
    (1 - 2 * (y * y + z * z)) * sx,
    2 * (x * y + z * w) * sx,
    2 * (x * z - y * w) * sx,
    0,
    2 * (x * y - z * w) * sy,
    (1 - 2 * (x * x + z * z)) * sy,
    2 * (y * z + x * w) * sy,
    0,
    2 * (x * z + y * w) * sz,
    2 * (y * z - x * w) * sz,
    (1 - 2 * (x * x + y * y)) * sz,
    0,
    tx,
    ty,
    tz,
    1,
  ];
};

/**
 * The size of the model of a .glb file, from the bounds of its meshes moved by
 * their nodes.
 * @param {Buffer} buffer The content of a .glb file.
 * @returns {GlbSize | null} null if the file cannot be read.
 */
const readGlbSize = (buffer) => {
  /** @type {any} */
  let gltf;
  try {
    if (buffer.toString('utf8', 0, 4) !== 'glTF') return null;
    const jsonLength = buffer.readUInt32LE(12);
    gltf = JSON.parse(buffer.toString('utf8', 20, 20 + jsonLength));
  } catch (error) {
    return null;
  }

  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  /**
   * @param {number} nodeIndex
   * @param {Array<number>} parentMatrix
   */
  const visit = (nodeIndex, parentMatrix) => {
    const node = gltf.nodes[nodeIndex];
    const matrix = multiply(parentMatrix, getNodeMatrix(node));
    if (node.mesh !== undefined) {
      for (const primitive of gltf.meshes[node.mesh].primitives) {
        const accessor = gltf.accessors[primitive.attributes.POSITION];
        if (!accessor || !accessor.min || !accessor.max) continue;
        for (const x of [accessor.min[0], accessor.max[0]]) {
          for (const y of [accessor.min[1], accessor.max[1]]) {
            for (const z of [accessor.min[2], accessor.max[2]]) {
              for (let axis = 0; axis < 3; axis++) {
                const value =
                  matrix[axis] * x +
                  matrix[4 + axis] * y +
                  matrix[8 + axis] * z +
                  matrix[12 + axis];
                min[axis] = Math.min(min[axis], value);
                max[axis] = Math.max(max[axis], value);
              }
            }
          }
        }
      }
    }
    for (const child of node.children || []) visit(child, matrix);
  };
  const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  const scene = (gltf.scenes || [])[gltf.scene || 0];
  for (const nodeIndex of (scene && scene.nodes) || []) {
    visit(nodeIndex, identity);
  }
  if (!(max[0] >= min[0])) return null;

  return { x: max[0] - min[0], y: max[1] - min[1], z: max[2] - min[2] };
};

module.exports = { readGlbSize };

// @ts-check
const { readGlbSize } = require('../GlbBox');

/**
 * A .glb file with only its JSON chunk: enough for the bounds of its meshes.
 * @param {any} gltf
 * @returns {Buffer}
 */
const makeGlb = (gltf) => {
  const json = Buffer.from(JSON.stringify(gltf));
  const paddedJson = Buffer.concat([
    json,
    Buffer.alloc((4 - (json.length % 4)) % 4, ' '),
  ]);
  const header = Buffer.alloc(20);
  header.write('glTF', 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(20 + paddedJson.length, 8);
  header.writeUInt32LE(paddedJson.length, 12);
  header.write('JSON', 16);
  return Buffer.concat([header, paddedJson]);
};

describe('readGlbSize', () => {
  it('reads the size of the meshes moved by their nodes', () => {
    const glb = makeGlb({
      scene: 0,
      scenes: [{ nodes: [0] }],
      nodes: [
        { children: [1], scale: [2, 2, 2] },
        {
          mesh: 0,
          // A quarter turn around X: Y becomes Z.
          rotation: [Math.SQRT1_2, 0, 0, Math.SQRT1_2],
          translation: [10, 0, 0],
        },
      ],
      meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
      accessors: [{ min: [0, 0, 0], max: [1, 2, 3] }],
    });

    const size = readGlbSize(glb);
    expect(size && size.x).toBeCloseTo(2);
    expect(size && size.y).toBeCloseTo(6);
    expect(size && size.z).toBeCloseTo(4);
  });

  it('cannot read a file that is not a .glb', () => {
    expect(readGlbSize(Buffer.from('not a model'))).toBeNull();
  });
});

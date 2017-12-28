const allModules = new Map();

/**
 * @param {string} id
 * @param {string} version
 */
export async function loadModule(id, version, depth) {
  const old = allModules.get(id);
  if (old !== undefined) {
    console.log(`reuse: ${id}`);
    return old;
  }

  const result = await fetch(`https://registry.npmjs.org/${id}`);
  const module = await addModule(await result.json(), version, depth);

  allModules.set(id, module);

  return module;
}

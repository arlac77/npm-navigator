/**
 * module cache
 */
const allModules = new Map();

/**
 * Load and cache a module
 * @param {string} id
 * @param {string} version
 * @return {Object} module
 */
export async function loadModule(wiredPanels, id, version, depth) {
  const old = allModules.get(id);
  if (old !== undefined) {
    console.log(`reuse: ${id}`);
    return old;
  }

  const result = await fetch(`https://registry.npmjs.org/${id}`);
  const module = await addModule(
    wiredPanels,
    await result.json(),
    version,
    depth
  );

  allModules.set(id, module);

  return module;
}

export async function addModule(
  wiredPanels,
  module,
  version = "latest",
  depth = 1
) {
  version = version.replace(/^\^/, "");

  const t = module["dist-tags"][version];
  const latest = (t && module.versions[t]) || module.versions[version];

  const panel = wiredPanels.createPanel();

  const sockets = [];
  const wires = [];
  panel.x = 100 * depth;
  panel.y = 100;
  panel.label.textContent = module.name;

  const socket = wiredPanels.createSocket();
  socket.panel = panel;
  socket.orientation = "top";
  sockets.push(socket);

  if (latest && latest.dependencies !== undefined) {
    await Promise.all(
      Object.keys(latest.dependencies).map(async d => {
        const socket = wiredPanels.createSocket();
        socket.panel = panel;
        socket.orientation = "left";
        socket.label.textContent = `${d}@${latest.dependencies[d]}`;
        sockets.push(socket);

        if (depth > 0) {
          const v = latest.dependencies[d];
          const p2 = await loadModule(d, v, depth - 1);
          const s2 = p2.sockets.filter(s => s.orientation === "top")[0];

          const wire = wiredPanels.createWire();
          wire.srcSocket = socket;
          wire.dstSocket = s2;
          wires.push(wire);
        }
      })
    );
  }

  wiredPanels.changeGraphUndoable(new Set([panel, ...sockets, ...wires]), []);

  return panel;
}

import WiredPanels from '../node_modules/WiredPanels/WiredPanels.js';

const wiredPanels = new WiredPanels(
  document.getElementById('graph'),
  {},
  {
    activate() {},
    remove() {},
    wireDrag(socket) {
      console.log(socket);
      return true;
    },
    wireConnect(node, wire, nodesToAdd) {
      if (node.type === 'panel') {
      } else {
        wire.dstSocket = node;
        return function(forward) {
          wiredPanels.updatePanelGeometry(node.panel);
        };
      }
    }
  }
);

wiredPanels.svg.ondblclick = async function(event) {
  const panel = loadModule('expression-expander');
  const mousePos = wiredPanels.mousePositionOfEvent(event);

  panel.x = mousePos[0];
  panel.y = mousePos[1];
};

async function addModule(module, version = 'latest', depth = 1) {
  version = version.replace(/^\^/, '');

  const t = module['dist-tags'][version];
  const latest = (t && module.versions[t]) || module.versions[version];

  const panel = wiredPanels.createPanel();
  const sockets = [];
  const wires = [];
  panel.x = 100;
  panel.y = 100;
  panel.label.textContent = module.name;

  const socket = wiredPanels.createSocket();
  socket.panel = panel;
  socket.orientation = 'top';
  sockets.push(socket);

  if (latest && latest.dependencies !== undefined) {
    await Promise.all(
      Object.keys(latest.dependencies).map(async d => {
        const socket = wiredPanels.createSocket();
        socket.panel = panel;
        socket.orientation = 'left';
        socket.label.textContent = `${d}@${latest.dependencies[d]}`;
        sockets.push(socket);

        if (depth > 0) {
          const v = latest.dependencies[d];
          const p2 = await loadModule(d, v, depth - 1);
          const s2 = p2.sockets.filter(s => s.orientation === 'top')[0];

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

async function loadModule(id, version, depth) {
  const result = await fetch(`https://registry.npmjs.org/${id}`);
  return addModule(await result.json(), version, depth);
}

loadModule('config-expander', 'latest', 2);

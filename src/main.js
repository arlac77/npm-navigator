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

function addModule(module, version = 'latest') {
  const t = module['dist-tags'][version];
  const latest = (t && module.versions[t]) || module.versions[version];

  const panel = wiredPanels.createPanel();
  const sockets = [];
  panel.x = 100;
  panel.y = 100;
  panel.label.textContent = module.name;

  const socket = wiredPanels.createSocket();
  socket.panel = panel;
  socket.orientation = 'top';
  sockets.push(socket);

  Object.keys(latest.dependencies).forEach(d => {
    const socket = wiredPanels.createSocket();
    socket.panel = panel;
    socket.orientation = 'left';
    socket.label.textContent = `${d}@${latest.dependencies[d]}`;
    sockets.push(socket);
  });

  wiredPanels.changeGraphUndoable(new Set([panel, ...sockets]), []);

  return panel;
}

export async function loadModule(id, version) {
  const result = await fetch(`https://registry.npmjs.org/${id}`);
  return addModule(await result.json(), version);
}

loadModule('config-expander');

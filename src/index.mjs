import WiredPanels from 'WiredPanels';
import { loadModule } from './util.mjs';
import './main.css';
import 'WiredPanels/WiredPanels.css';
import 'WiredPanels/Colors/Neon.css';

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
        return forward => wiredPanels.updatePanelGeometry(node.panel);
      }
    }
  }
);

wiredPanels.svg.ondblclick = async event => {
  const panel = loadModule('expression-expander');
  const mousePos = wiredPanels.mousePositionOfEvent(event);

  panel.x = mousePos[0];
  panel.y = mousePos[1];
};

loadModule(wiredPanels, 'kronos-cluster-node', 'latest', 1);

import WiredPanels from '../node_modules/WiredPanels/WiredPanels.js';

function addPanel(nodesToAdd, symbol) {
  if (panelIndex.has(symbol)) return panelIndex.get(symbol);

  const panel = wiredPanels.createPanel();
  panel.symbol = symbol;
  nodesToAdd.add(panel);

  const sockets = [];
  const topSocket = wiredPanels.createSocket();
  topSocket.panel = panel;
  topSocket.orientation = 'top';
  setSocketVisibility(topSocket, panel.symbol);
  nodesToAdd.add(topSocket);

  function connectWires(triple, side) {
    if (!panelIndex.has(triple[0])) return;
    const sockets = panelIndex.get(triple[0])[side];
    for (const socket of sockets)
      if (socket.symbol == symbol) {
        const wire = wiredPanels.createWire();
        wire.srcSocket = topSocket;
        wire.dstSocket = socket;
        nodesToAdd.add(wire);
      }
  }
  for (const triple of backend.queryTriples(
    symbolSpace,
    NativeBackend.queryMask.VMI,
    [0, panel.symbol, 0]
  ))
    connectWires(triple, 'leftSockets');
  for (const triple of backend.queryTriples(
    symbolSpace,
    NativeBackend.queryMask.VIM,
    [0, 0, panel.symbol]
  ))
    connectWires(triple, 'rightSockets');
  for (const triple of backend.queryTriples(
    symbolSpace,
    NativeBackend.queryMask.MVV,
    [panel.symbol, 0, 0]
  ))
    linkedTriple(nodesToAdd, triple, panel);

  return panel;
}

const wiredPanels = new WiredPanels(
  document.getElementById('graph'),
  {},
  {
    activate() {
      const nodesToAdd = new Set(),
        nodesToRemove = new Set(),
        updateData = new Set(),
        panels = new Set();
      for (const node of wiredPanels.selection)
        if (node.type === 'panel') {
          const update = {
            symbol: node.symbol,
            prev: backend.getData(symbolSpace, node.symbol)
          };
          const from = labelForData(update.prev, node.symbol),
            to = prompt('Data', from);
          if (to != undefined && to != from) {
            update.next = NativeBackend.decodeText(to);
            updateData.add(update);
            let prevEncoding = [
                update.symbol,
                backend.symbolByName.Encoding,
                undefined
              ],
              nextEncoding = [
                update.symbol,
                backend.symbolByName.Encoding,
                undefined
              ];
            prevEncoding[2] = backend.getSolitary(
              symbolSpace,
              prevEncoding[0],
              prevEncoding[1]
            );
            backend.setData(symbolSpace, update.symbol, update.next);
            nextEncoding[2] = backend.getSolitary(
              symbolSpace,
              nextEncoding[0],
              nextEncoding[1]
            );
            if (prevEncoding[2] != nextEncoding[2]) {
              if (prevEncoding[2] != undefined)
                unlinkedTriple(nodesToRemove, prevEncoding);
              if (nextEncoding[2] != undefined)
                linkedTriple(nodesToAdd, nextEncoding);
            }
          }
        } else if (node.type === 'socket') {
          if (
            node.orientation != 'top' &&
            node.wiresPerPanel.size == 0 &&
            node.symbol != undefined
          )
            panels.add(addPanel(nodesToAdd, node.symbol));
        }
      if (nodesToAdd.size > 0 || nodesToRemove.size > 0 || updateData.size > 0)
        wiredPanels.changeGraphUndoable(nodesToAdd, nodesToRemove, function(
          forward
        ) {
          for (const update of updateData) {
            backend.setData(
              symbolSpace,
              update.symbol,
              forward ? update.next : update.prev
            );
            updateLabels(update.symbol, true);
          }
          for (const panel of panels) setPanelVisibility(panel, forward);
        });
    },
    remove() {
      const nodesToDeselect = new Set();
      for (const node of wiredPanels.selection)
        if (node.type == 'wire') nodesToDeselect.add(node);

      const nodesToSelect = new Set(),
        triples = new Set(),
        panels = new Set();
      for (const node of wiredPanels.selection)
        switch (node.type) {
          case 'socket':
            if (wiredPanels.selection.has(node.panel)) {
              nodesToDeselect.add(node);
              continue;
            }
            switch (node.orientation) {
              case 'top':
                nodesToSelect.add(node.panel);
                break;
              case 'left':
              case 'right':
                {
                  const triple = [],
                    oppositeSocket = getOppositeSocket(node, triple);
                  if (!wiredPanels.selection.has(oppositeSocket))
                    nodesToSelect.add(oppositeSocket);
                  if (triple[1] != undefined && triple[2] != undefined)
                    triples.add(triple);
                }
                break;
            }
            break;
          case 'panel':
            const update = {
              panel: node,
              symbol: node.symbol,
              data: backend.getData(symbolSpace, node.symbol),
              triples: [
                ...backend.queryTriples(
                  symbolSpace,
                  NativeBackend.queryMask.MVV,
                  [node.symbol, 0, 0]
                )
              ]
            };
            panels.add(update);
            break;
        }

      wiredPanels.setSelected(nodesToDeselect, false);
      for (const panel of nodesToSelect) wiredPanels.selection.add(panel);

      return function(forward) {
        for (const triple of triples)
          backend.setTriple(symbolSpace, !forward, triple);
        for (const update of panels) {
          if (forward) backend.unlinkSymbol(symbolSpace, update.symbol);
          else {
            backend.createSymbol(symbolSpace, update.symbol);
            backend.setData(symbolSpace, update.symbol, update.data);
            for (const triple of update.triples)
              backend.setTriple(symbolSpace, true, triple);
          }
          setPanelVisibility(update.panel, !forward);
        }
      };
    },
    wireDrag(socket) {
      return socket.orientation == 'top';
    },
    wireConnect(node, wire, nodesToAdd) {
      if (node.type === 'panel') {
        const rect = wiredPanels.boundingRectOfPanel(node),
          diffX = wire.dstSocket.primaryElement.x - (rect[0] + rect[1]) / 2,
          diffY = wire.dstSocket.primaryElement.y - (rect[2] + rect[3]) / 2;

        wire.dstSocket = wiredPanels.createSocket();
        wire.dstSocket.panel = node;
        wire.dstSocket.orientation = diffX < 0 ? 'left' : 'right';
        setSocketVisibility(wire.dstSocket, wire.srcSocket.symbol);
        nodesToAdd.add(wire.dstSocket);

        const oppositeSocket = wiredPanels.createSocket();
        oppositeSocket.panel = node;
        oppositeSocket.orientation = diffX >= 0 ? 'left' : 'right';
        nodesToAdd.add(oppositeSocket);
      } else {
        if (node.symbol != undefined) return;
        const symbol = wire.srcSocket.symbol;
        wire.dstSocket = node;
        wire.dstSocket.symbol = symbol;
        const triple = [],
          oppositeSocket = getOppositeSocket(node, triple);
        return function(forward) {
          backend.setTriple(symbolSpace, forward, triple);
          setSocketVisibility(node, forward ? symbol : undefined);
          wiredPanels.updatePanelGeometry(node.panel);
        };
      }
    }
  }
);

wiredPanels.svg.ondblclick = function(event) {
  const mousePos = wiredPanels.mousePositionOfEvent(event),
    nodesToAdd = new Set(),
    panel = addPanel(nodesToAdd, backend.createSymbol(symbolSpace));
  panel.x = mousePos[0];
  panel.y = mousePos[1];
  wiredPanels.changeGraphUndoable(nodesToAdd, [], function(forward) {
    if (forward) backend.createSymbol(symbolSpace, panel.symbol);
    else backend.unlinkSymbol(symbolSpace, panel.symbol);
    setPanelVisibility(panel, forward);
  });
};

function addModule(module) {
  const panel = wiredPanels.createPanel();

  panel.label.textContent = module.name;
  //panel.symbol = module.name;

  const topSocket = wiredPanels.createSocket();
  topSocket.panel = panel;
  topSocket.orientation = 'top';

  console.log(panel);

  return panel;
}

export async function initialize() {
  const id = 'config-expander';
  const result = await fetch(`https://registry.npmjs.org/${id}`);
  const json = await result.json();

  //console.log(json);

  addModule(json);
}

initialize();

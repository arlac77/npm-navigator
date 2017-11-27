'use strict';

function createElement(tag, parentNode) {
    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if(parentNode)
        parentNode.appendChild(svgElement);
    return svgElement;
}

function animateVisibility(svgElement, visible) {
    if(visible) {
        svgElement.classList.remove('fadeOut');
        svgElement.classList.add('fadeIn');
    } else {
        svgElement.classList.remove('fadeIn');
        svgElement.classList.add('fadeOut');
    }
}

function animateElementRemoval(svgElements, panels) {
    for(const svgElement of svgElements)
        animateVisibility(svgElement, false);
    window.setTimeout(function() {
        for(const svgElement of svgElements)
            svgElement.parentNode.removeChild(svgElement);
        if(panels)
            for(const panel of panels)
                this.updatePanelSockets(panel);
    }.bind(this), 300);
}

function setupEventListeners(node) {
    const mousedown = function(event) {
        this.draggingMoved = false;
        const mousePos = this.mousePositionOfEvent((event.touches) ? event.touches[0] : event);
        if(event.shiftKey)
            this.setSelected([node], 'toggle');
        else {
            this.setSelected([node], true);
            switch(node.type) {
                case 'panel':
                    this.dragging = new Map();
                    for(const node of this.selection)
                        if(node.type === 'panel')
                            this.dragging.set(node, {
                                x: mousePos[0] - node.x,
                                y: mousePos[1] - node.y
                            });
                    break;
                case 'socket':
                    if(!this.eventListeners.wireDrag || !this.eventListeners.wireDrag(node))
                        break;
                    this.dragging = {
                        srcSocket: node,
                        dstSocket: { primaryElement: {} }
                    };
                    break;
            }
        }
        event.stopPropagation();
        event.preventDefault();
    }.bind(this);
    node.primaryElement.addEventListener('mousedown', mousedown);
    node.primaryElement.addEventListener('touchstart', mousedown);
    const mouseup = function(event) {
        if(!this.draggingMoved) {
            if(!event.shiftKey && this.eventListeners.activate)
                this.eventListeners.activate();
        } else if(this.dragging.type === 'wire' &&
                  this.eventListeners.wireConnect) {
            const nodesToAdd = new Set([this.dragging]);
            let callback = this.eventListeners.wireConnect(node, this.dragging, nodesToAdd);
            if(this.dragging.dstSocket.type === 'socket') {
                this.dragging.primaryElement.classList.remove('ignore');
                this.changeGraphUndoable(nodesToAdd, [], callback);
                delete this.dragging;
            }
        }
    }.bind(this);
    node.primaryElement.addEventListener('mouseup', mouseup);
    node.primaryElement.addEventListener('touchend', mouseup);
}

function tickPanel(panel) {
    const posX = Math.round(panel.x - panel.width / 2),
          posY = Math.round(panel.y - panel.height / 2);
    panel.group.setAttribute('transform', 'translate(' + posX + ', ' + posY + ')');
    for(const socket of panel.sockets) {
        socket.primaryElement.x = posX + socket.x;
        socket.primaryElement.y = posY + socket.y;
    }
}

function tickWire(wire) {
    const src = wire.srcSocket.primaryElement,
          dst = wire.dstSocket.primaryElement;
    let pathD = 'M' + src.x + ',' + src.y;
    switch(this.config.wireStyle) {
        case 'straight':
            pathD += 'L' + dst.x + ',' + dst.y;
            break;
        case 'vertical':
            pathD += 'C' + dst.x + ',' + src.y + ' ' + src.x + ',' + dst.y + ' ' + dst.x + ',' + dst.y;
            break;
        case 'horizontal':
            pathD += 'C' + src.x + ',' + dst.y + ' ' + dst.x + ',' + src.y + ' ' + dst.x + ',' + dst.y;
            break;
        case 'hybrid':
            if(Math.abs(src.x - dst.x) < Math.abs(src.y - dst.y))
                pathD += 'C' + dst.x + ',' + src.y + ' ' + src.x + ',' + dst.y + ' ' + dst.x + ',' + dst.y;
            else
                pathD += 'C' + src.x + ',' + dst.y + ' ' + dst.x + ',' + src.y + ' ' + dst.x + ',' + dst.y;
            break;
        case 'gravity':
            const diffX = dst.x - src.x;
            const maxY = Math.max(dst.y, src.y) + 20;
            pathD += 'C' + (src.x + diffX * 0.25) + ',' + maxY + ' ' + (src.x + diffX * 0.75) + ',' + maxY + ' ' + dst.x + ',' + dst.y;
            break;
    }
    wire.primaryElement.setAttribute('d', pathD);
}

function deleteSelected(event) {
    if(this.selection.size === 0)
        return;
    let callback;
    if(this.eventListeners.remove)
        callback = this.eventListeners.remove();
    if(this.selection.size > 0)
        this.changeGraphUndoable([], new Set(this.selection), callback);
}

class WiredPanels {
    constructor(parentElement, config={}, eventListeners={}) {
        const acceptClipboard = function(event) {
            if(!this.eventListeners.acceptClipboard)
                return false;
            event.stopPropagation();
            if(!this.eventListeners.acceptClipboard(event.dataTransfer))
                return false;
            event.preventDefault();
            return true;
        }.bind(this);
        const copy = function(event) {
            if(!this.eventListeners.copy)
                return false;
            event.stopPropagation();
            if(!this.eventListeners.copy(event.clipboardData))
                return false;
            event.preventDefault();
            return true;
        }.bind(this);
        const cut = function(event) {
            if(copy(event))
                deleteSelected.call(this);
        }.bind(this);
        const paste = function(event) {
            if(acceptClipboard(event))
                this.eventListeners.paste(event.clipboardData);
        }.bind(this);
        const drop = function(event) {
            if(acceptClipboard(event))
                this.eventListeners.paste(event.dataTransfer);
        }.bind(this);
        const dragover = function(event) {
            if(acceptClipboard(event))
                event.dataTransfer.dropEffect = 'copy';
        }.bind(this);

        const keydown = function(event) {
            if(this.svg.parentNode.querySelector('svg:hover') === null || event.ctrlKey)
                return;
            switch(event.keyCode) {
                case 8: // Backspace
                    deleteSelected.call(this);
                    break;
                case 13: // Enter
                    if(this.selection.size === 0 || !this.eventListeners.activate)
                        return;
                    this.eventListeners.activate();
                    break;
                case 90: // Meta (+ Shift) + Z
                    if(!event.metaKey)
                        return;
                    if(event.shiftKey) {
                        if(this.actionIndex < this.actionStack.length)
                            this.actionStack[this.actionIndex++](true);
                    } else {
                        if(this.actionIndex > 0)
                            this.actionStack[--this.actionIndex](false);
                    }
                    break;
                case 65: // Meta + A
                    if(!event.metaKey)
                        return;
                    this.setSelected(this.panels, true);
                    break;
                default:
                    return;
            }
            event.stopPropagation();
            event.preventDefault();
        }.bind(this);

        const mousedown = function(event) {
            if(event.button > 0)
                return;
            this.draggingMoved = false;
            const mousePos = this.mousePositionOfEvent((event.touches) ? event.touches[0] : event);
            this.boxSelection.originX = mousePos[0];
            this.boxSelection.originY = mousePos[1];
            this.boxSelection.setAttribute('width', 0);
            this.boxSelection.setAttribute('height', 0);
            animateVisibility(this.boxSelection, true);
            this.dragging = this.boxSelection;
            event.stopPropagation();
            event.preventDefault();
        }.bind(this);
        const mousemove = function(event) {
            if(!this.dragging)
                return;
            this.draggingMoved = true;
            const mousePos = this.mousePositionOfEvent((event.touches) ? event.touches[0] : event);
            if(this.dragging === this.boxSelection) {
                this.boxSelection.minX = Math.min(this.boxSelection.originX, mousePos[0]);
                this.boxSelection.minY = Math.min(this.boxSelection.originY, mousePos[1]);
                this.boxSelection.maxX = Math.max(this.boxSelection.originX, mousePos[0]);
                this.boxSelection.maxY = Math.max(this.boxSelection.originY, mousePos[1]);
                this.boxSelection.setAttribute('x', this.boxSelection.minX);
                this.boxSelection.setAttribute('y', this.boxSelection.minY);
                this.boxSelection.setAttribute('width', this.boxSelection.maxX-this.boxSelection.minX);
                this.boxSelection.setAttribute('height', this.boxSelection.maxY-this.boxSelection.minY);
            } else if(this.dragging instanceof Map) {
                for(const [panel, dragging] of this.dragging) {
                    panel.x = mousePos[0] - dragging.x;
                    panel.y = mousePos[1] - dragging.y;
                }
                this.stabilizeGraph();
            } else {
                if(this.dragging.type !== 'wire') {
                    this.createWire(this.dragging);
                    this.dragging.primaryElement.classList.add('ignore');
                    this.wiresGroup.appendChild(this.dragging.primaryElement);
                    animateVisibility(this.dragging.primaryElement, true);
                }
                this.dragging.dstSocket.primaryElement.x = mousePos[0];
                this.dragging.dstSocket.primaryElement.y = mousePos[1];
                tickWire.call(this, this.dragging);
            }
            event.stopPropagation();
            event.preventDefault();
        }.bind(this);
        const mouseup = function(event) {
            if(event.button > 0)
                return;
            if(!event.shiftKey && (!this.dragging || this.dragging === this.boxSelection))
                this.setSelected(this.selection, false);
            if(!this.dragging)
                return;
            if(this.dragging === this.boxSelection) {
                animateVisibility(this.boxSelection, false);
                if(this.draggingMoved) {
                    const isSocketInBoxSelection = function(socket) {
                        return this.boxSelection.minX < socket.primaryElement.x && socket.primaryElement.x < this.boxSelection.maxX
                            && this.boxSelection.minY < socket.primaryElement.y && socket.primaryElement.y < this.boxSelection.maxY;
                    }.bind(this);
                    const nodes = new Set();
                    for(const panel of this.panels) {
                        const rect = this.boundingRectOfPanel(panel);
                        if(this.boxSelection.minX < rect[0] && rect[1] < this.boxSelection.maxX &&
                           this.boxSelection.minY < rect[2] && rect[3] < this.boxSelection.maxY)
                            nodes.add(panel);
                        for(const socket of panel.sockets)
                            if(isSocketInBoxSelection(socket))
                                nodes.add(socket);
                    }
                    for(const wire of this.wires)
                        if(isSocketInBoxSelection(wire.srcSocket) && isSocketInBoxSelection(wire.dstSocket))
                            nodes.add(wire);
                    this.setSelected(nodes, (event.shiftKey) ? 'toggle' : true);
                }
            } else if(this.dragging instanceof Map)
                this.setSelected(this.dragging.keys(), false);
            else {
                this.setSelected([this.dragging.srcSocket], false);
                if(this.dragging.type === 'wire')
                    animateElementRemoval.call(this, [this.dragging.primaryElement]);
            }
            this.draggingMoved = false;
            delete this.dragging;
            event.stopPropagation();
            event.preventDefault();
        }.bind(this);

        document.body.addEventListener('copy', copy);
        document.body.addEventListener('cut', cut);
        document.body.addEventListener('paste', paste);
        document.body.addEventListener('drop', drop);
        document.body.addEventListener('dragover', dragover);
        document.body.addEventListener('keydown', keydown);
        while(parentElement.getElementsByClassName('fallback').length > 0)
            parentElement.removeChild(parentElement.getElementsByClassName('fallback')[0]);
        this.svg = createElement('svg', parentElement);
        this.svg.classList.add('WiredPanels');
        this.svg.addEventListener('mousedown', mousedown);
        this.svg.addEventListener('touchstart', mousedown);
        this.svg.addEventListener('mousemove', mousemove);
        this.svg.addEventListener('touchmove', mousemove);
        this.svg.addEventListener('mouseup', mouseup);
        this.svg.addEventListener('mouseleave', mouseup);
        this.svg.addEventListener('touchend', mouseup);

        const svgDefs = createElement('defs', this.svg);
        const blurFilter = createElement('filter', svgDefs);
        blurFilter.setAttribute('id', 'blurFilter');
        blurFilter.setAttribute('x', -10);
        blurFilter.setAttribute('y', -10);
        blurFilter.setAttribute('width', 20);
        blurFilter.setAttribute('height', 20);
        const feGaussianBlur = createElement('feGaussianBlur', blurFilter);
        feGaussianBlur.setAttribute('in', 'SourceGraphic');
        feGaussianBlur.setAttribute('result', 'blur');
        feGaussianBlur.setAttribute('stdDeviation', 3);
        const feComponentTransfer = createElement('feComponentTransfer', blurFilter);
        feComponentTransfer.setAttribute('in', 'blur');
        feComponentTransfer.setAttribute('result', 'brighter');
        const feFunc = createElement('feFuncA', feComponentTransfer);
        feFunc.setAttribute('type', 'linear');
        feFunc.setAttribute('slope', 2.5);
        const feMerge = createElement('feMerge', blurFilter);
        createElement('feMergeNode', feMerge).setAttribute('in', 'brighter');
        createElement('feMergeNode', feMerge).setAttribute('in', 'SourceGraphic');

        this.panelsGroup = createElement('g', this.svg);
        this.wiresGroup = createElement('g', this.svg);
        this.boxSelection = createElement('rect', this.svg);
        this.boxSelection.classList.add('boxSelection');
        this.panels = new Set();
        this.springs = new Set();
        this.wires = new Set();
        this.selection = new Set();
        this.tickCount = 0;
        this.actionStack = [];
        this.actionIndex = 0;
        this.config = Object.assign({
            socketRadius: 5,
            verticalSocketsOutside: false,
            horizontalSocketsOutside: false,
            wireStyle: 'hybrid',
            panelCornerRadius: 10,
            panelPadding: 12,
            panelMargin: 12,
            springLength: 200,
            springStiffness: 0.1,
            panelCollision: true,
            borderCollision: true,
            undoActionLimit: 0
        }, config);
        this.eventListeners = eventListeners;
    }

    setSelected(nodes, selectionMode) {
        for(const node of nodes) {
            const wasSelected = this.selection.has(node);
            if(selectionMode === wasSelected)
                continue;
            if(selectionMode === 'toggle')
                selectionMode = !wasSelected;
            if(selectionMode) {
                this.selection.add(node);
                node.primaryElement.classList.add('selected');
            } else {
                this.selection.delete(node);
                node.primaryElement.classList.remove('selected');
            }
        }
    }

    createWire(wire = {}) {
        wire.type = 'wire';
        wire.primaryElement = createElement('path');
        wire.primaryElement.classList.add('wire');
        setupEventListeners.call(this, wire);
        return wire;
    }

    createPanel(panel = {}) {
        panel.type = 'panel';
        panel.sockets = [];
        panel.springs = new Map();
        const rect = this.svg.getBoundingClientRect();
        panel.x = rect.width * Math.random();
        panel.y = rect.height * Math.random();
        panel.group = createElement('g');
        panel.primaryElement = createElement('rect', panel.group);
        panel.primaryElement.classList.add('panel');
        panel.primaryElement.setAttribute('rx', this.config.panelCornerRadius);
        panel.primaryElement.setAttribute('ry', this.config.panelCornerRadius);
        const createSeparator = function() {
            const line = createElement('rect', panel.group);
            line.setAttribute('x', 0);
            line.setAttribute('width', 0);
            line.setAttribute('height', 1);
            line.classList.add('separator');
            return line;
        }.bind(this);
        panel.topSeparator = createSeparator();
        panel.middleSeparator = createSeparator();
        panel.bottomSeparator = createSeparator();
        panel.label = createElement('text', panel.group);
        panel.label.classList.add('label');
        panel.socketGroup = createElement('g', panel.group);
        setupEventListeners.call(this, panel);
        return panel;
    }

    createSocket(socket = {}) {
        socket.type = 'socket';
        socket.wiresPerPanel = new Map();
        socket.group = createElement('g');
        socket.primaryElement = createElement('circle', socket.group);
        socket.primaryElement.classList.add('socket');
        socket.primaryElement.setAttribute('r', this.config.socketRadius);
        socket.primaryElement.setAttribute('cx', 0);
        socket.primaryElement.setAttribute('cy', 0);
        socket.label = createElement('text', socket.group);
        socket.label.classList.add('label');
        setupEventListeners.call(this, socket);
        return socket;
    }

    updatePanelSockets(panel) {
        panel.topSockets = [];
        panel.leftSockets = [];
        panel.rightSockets = [];
        panel.bottomSockets = [];
        for(const socket of panel.sockets)
            switch(socket.orientation) {
                case 'top':
                    panel.topSockets.push(socket);
                    break;
                case 'left':
                    panel.leftSockets.push(socket);
                    break;
                case 'right':
                    panel.rightSockets.push(socket);
                    break;
                case 'bottom':
                    panel.bottomSockets.push(socket);
                    break;
            }
        panel.topSeparator.setAttribute('opacity', (
            panel.topSockets.length > 0 &&
            (panel.topSockets.length < panel.sockets.length || panel.label.textContent.length > 0)
        ) ? 1 : 0);
        panel.middleSeparator.setAttribute('opacity', (
            panel.label.textContent.length > 0 &&
            panel.leftSockets.length + panel.rightSockets.length + panel.bottomSockets.length > 0
        ) ? 1 : 0);
        panel.bottomSeparator.setAttribute('opacity', (
            panel.bottomSockets.length > 0 &&
            panel.bottomSockets.length < panel.sockets.length &&
            (panel.leftSockets.length > 0 || panel.rightSockets.length > 0)
        ) ? 1 : 0);
        this.updatePanelGeometry(panel);
    }

    updatePanelGeometry(panel) {
        const topAndBottomLine = (this.config.socketsOutside) ? 1 : 1.75,
              horizontalSocketPadding = (this.config.horizontalSocketsOutside) ? 2 : 3,
              topLine = (panel.topSockets.length) ? topAndBottomLine : 0,
              bottomLine = (panel.bottomSockets.length) ? topAndBottomLine : 0,
              nameLine = (panel.label.textContent.length > 0) ? 1 : 0,
              doubleLineCount = Math.min(panel.leftSockets.length, panel.rightSockets.length),
              totalLine = Math.max(topLine + nameLine + Math.max(panel.leftSockets.length, panel.rightSockets.length) + bottomLine, 1);
        for(const socket of panel.sockets)
            socket.label.width = Math.max(this.config.panelPadding, socket.label.getComputedTextLength());
        let topLineWidth = this.config.panelPadding * (panel.topSockets.length + 1),
            bottomLineWidth = this.config.panelPadding * (panel.bottomSockets.length + 1);
        for(const socket of panel.topSockets)
            topLineWidth += socket.label.width;
        for(const socket of panel.bottomSockets)
            bottomLineWidth += socket.label.width;
        panel.width = Math.max(topLineWidth, bottomLineWidth, panel.label.getBBox().width + this.config.panelPadding * 2);
        for(let i = 0; i < doubleLineCount; ++i)
            panel.width = Math.max(panel.width, this.config.panelPadding * (horizontalSocketPadding * 2 - 1) + panel.leftSockets[i].label.width + panel.rightSockets[i].label.width);
        for(let i = doubleLineCount; i < panel.leftSockets.length; ++i)
            panel.width = Math.max(panel.width, this.config.panelPadding * horizontalSocketPadding + panel.leftSockets[i].label.width);
        for(let i = doubleLineCount; i < panel.rightSockets.length; ++i)
            panel.width = Math.max(panel.width, this.config.panelPadding * horizontalSocketPadding + panel.rightSockets[i].label.width);
        panel.width = Math.round(panel.width);
        panel.height = Math.round(totalLine * this.config.panelPadding * 2);
        panel.label.setAttribute('x', Math.round(panel.width / 2));
        panel.label.setAttribute('y', (topLine * 2 + 1) * this.config.panelPadding);
        panel.label.setAttribute('text-anchor', 'middle');
        const verticalSockets = function(sockets, lineWidth, sideFactor) {
            let posX = (panel.width - lineWidth) / 2, lastWidth = 0;
            const posY = Math.round((sideFactor === -1 ? panel.height : 0) - sideFactor * this.config.panelPadding * (this.config.verticalSocketsOutside ? 1 : -1)),
                  labelPosY = Math.round(sideFactor * this.config.panelPadding * (this.config.socketsOutside ? 2 : 1.5));
            for(let i = 0; i < sockets.length; ++i) {
                const socket = sockets[i];
                posX += (lastWidth + socket.label.width) / 2 + this.config.panelPadding;
                lastWidth = socket.label.width;
                socket.x = Math.round(posX);
                socket.y = posY;
                socket.label.setAttribute('x', 0);
                socket.label.setAttribute('y', labelPosY);
                socket.label.setAttribute('text-anchor', 'middle');
            }
        }.bind(this);
        const horizontalSockets = function(sockets, sideFactor) {
            const paddingFactor = (this.config.horizontalSocketsOutside) ? 1 : 0,
                  posX = Math.round((sideFactor === -1 ? panel.width : 0) + sideFactor * (1 - 2 * paddingFactor) * this.config.panelPadding),
                  labelPosX = Math.round(sideFactor * (1 + paddingFactor) * this.config.panelPadding);
            for(let i = 0; i < sockets.length; ++i) {
                const socket = sockets[i];
                socket.x = posX;
                socket.y = ((topLine + nameLine + i) * 2 + 1) * this.config.panelPadding;
                socket.label.setAttribute('x', labelPosX);
                socket.label.setAttribute('y', 0);
                socket.label.setAttribute('text-anchor', (sideFactor === 1) ? 'start' : 'end');
            }
        }.bind(this);
        verticalSockets(panel.topSockets, topLineWidth, 1);
        verticalSockets(panel.bottomSockets, bottomLineWidth, -1);
        horizontalSockets(panel.leftSockets, 1);
        horizontalSockets(panel.rightSockets, -1);
        for(const socket of panel.sockets)
            socket.group.setAttribute('transform', 'translate(' + Math.round(socket.x) + ', ' + Math.round(socket.y) + ')');
        panel.topSeparator.setAttribute('width', panel.width);
        panel.topSeparator.setAttribute('y', Math.round(topLine * this.config.panelPadding * 2));
        panel.middleSeparator.setAttribute('width', panel.width);
        panel.middleSeparator.setAttribute('y', Math.round((topLine + 1) * this.config.panelPadding * 2));
        panel.bottomSeparator.setAttribute('width', panel.width);
        panel.bottomSeparator.setAttribute('y', Math.round((totalLine - bottomLine) * this.config.panelPadding * 2));
        panel.primaryElement.setAttribute('width', panel.width);
        panel.primaryElement.setAttribute('height', panel.height);
        tickPanel(panel);
        return panel;
    }

    boundingRectOfPanel(panel) {
        const halfWidth = panel.width / 2 + this.config.panelMargin,
              halfHeight = panel.height / 2 + this.config.panelMargin;
        return [panel.x - halfWidth, panel.x + halfWidth, panel.y - halfHeight, panel.y + halfHeight];
    }

    mousePositionOfEvent(event) {
        const rect = this.svg.getBoundingClientRect();
        return [event.pageX - rect.left - window.pageXOffset, event.pageY - rect.top - window.pageYOffset];
    }

    stabilizeGraph() {
        this.tickCount = 20;
        if(this.animationRunning)
            return;
        let lastTime = performance.now();
        const tickGraph = function(currentTime) {
            lastTime = currentTime;
            this.animationRunning = this.dragging || --this.tickCount > 0;
            if(this.animationRunning)
                window.requestAnimationFrame(tickGraph);

            const draggingPanels = this.dragging instanceof Map;
            if(this.config.springStiffness > 0)
                for(const spring of this.springs) {
                    let vecX = spring.srcPanel.x - spring.dstPanel.x,
                        vecY = spring.srcPanel.y - spring.dstPanel.y;
                    const distance = Math.max(1, Math.sqrt(vecX * vecX + vecY * vecY)),
                          displacement = this.config.springLength - distance,
                          srcPanelIsFixed = draggingPanels && this.dragging.has(spring.srcPanel),
                          dstPanelIsFixed = draggingPanels && this.dragging.has(spring.dstPanel),
                          factor = this.config.springStiffness * displacement / distance * ((srcPanelIsFixed || dstPanelIsFixed) ? 2 : 1);
                    vecX *= factor;
                    vecY *= factor;
                    if(!srcPanelIsFixed) {
                        spring.srcPanel.x += vecX;
                        spring.srcPanel.y += vecY;
                    }
                    if(!dstPanelIsFixed) {
                        spring.dstPanel.x -= vecX;
                        spring.dstPanel.y -= vecY;
                    }
                }
            if(this.config.panelCollision) {
                let i = 0;
                for(const panelA of this.panels) {
                    let j = 0;
                    for(const panelB of this.panels) {
                        if(i <= j)
                            break;
                        const rectA = this.boundingRectOfPanel(panelA), rectB = this.boundingRectOfPanel(panelB);
                        let overlapX = Math.min(rectA[1], rectB[1]) - Math.max(rectA[0], rectB[0]),
                            overlapY = Math.min(rectA[3], rectB[3]) - Math.max(rectA[2], rectB[2]);
                        if(overlapX <= 0 || overlapY <= 0)
                            continue;
                        if(Math.abs(overlapX) < Math.abs(overlapY)) {
                            if(panelA.x < panelB.x)
                                overlapX *= -1;
                            panelA.x += overlapX;
                            panelB.x -= overlapX;
                        } else {
                            if(panelA.y < panelB.y)
                                overlapY *= -1;
                            panelA.y += overlapY;
                            panelB.y -= overlapY;
                        }
                        ++j;
                    }
                    ++i;
                }
            }
            if(this.config.borderCollision) {
                const rect = this.svg.getBoundingClientRect();
                for(const panel of this.panels) {
                    const panelRect = this.boundingRectOfPanel(panel);
                    if(panelRect[0] < 0)
                        panel.x -= panelRect[0];
                    else if(panelRect[1] > rect.width)
                        panel.x -= panelRect[1] - rect.width;
                    if(panelRect[2] < 0)
                        panel.y -= panelRect[2];
                    else if(panelRect[3] > rect.height)
                        panel.y -= panelRect[3] - rect.height;
                }
            }
            for(const panel of this.panels)
                tickPanel(panel);
            for(const wire of this.wires)
                tickWire.call(this, wire);
        }.bind(this);
        tickGraph(lastTime);
    }

    undoableAction(action) {
        this.actionStack = this.actionStack.slice(0, this.actionIndex);
        this.actionStack.push(action);
        if(this.config.undoActionLimit > 0 && this.actionStack.length > this.config.undoActionLimit) {
            this.actionStack = this.actionStack.slice(this.actionStack.length - this.config.undoActionLimit);
            this.actionIndex = this.actionStack.length;
        }
        this.actionStack[this.actionIndex++](true);
    }

    changeGraphUndoable(nodesToAdd, nodesToRemove, callback) {
        this.undoableAction(function(forward) {
            if(callback)
                callback(forward);
            if(forward)
                this.changeGraph(nodesToAdd, nodesToRemove);
            else
                this.changeGraph(nodesToRemove, nodesToAdd);
        }.bind(this));
    }

    changeGraph(nodesToAdd, nodesToRemove) {
        const panelsToUpdateA = new Set(),
              panelsToUpdateR = new Set(),
              svgElementsToRemove = new Set();
        for(const node of nodesToAdd) {
            if(node.primaryElement.classList.contains('selected'))
                this.selection.add(node);
            switch(node.type) {
                case 'socket':
                    panelsToUpdateA.add(node.panel);
                    if(node.index === undefined)
                        node.panel.sockets.push(node);
                    else
                        node.panel.sockets.splice(node.index, 0, node);
                    node.panel.socketGroup.appendChild(node.group);
                    animateVisibility(node.group, true);
                    break;
                case 'wire':
                    this.wires.add(node);
                    if(node !== this.dragging)
                        this.wiresGroup.appendChild(node.primaryElement);
                    animateVisibility(node.primaryElement, true);
                    function connectSocket(srcSocket, dstPanel) {
                        let set;
                        if(!srcSocket.wiresPerPanel.has(dstPanel)) {
                            set = new Set();
                            srcSocket.wiresPerPanel.set(dstPanel, set);
                        } else {
                            set = srcSocket.wiresPerPanel.get(dstPanel);
                            if(set.has(node))
                                return false;
                        }
                        set.add(node);
                        return true;
                    }
                    if(!connectSocket(node.srcSocket, node.dstSocket.panel) ||
                       !connectSocket(node.dstSocket, node.srcSocket.panel))
                        console.error('Wire was already connected', node);
                    if(node.srcSocket.panel !== node.dstSocket.panel) {
                        let spring = node.srcSocket.panel.springs.get(node.dstSocket.panel);
                        if(spring)
                            ++spring.referenceCount;
                        else {
                            spring = {
                                referenceCount: 1,
                                srcPanel: node.srcSocket.panel,
                                dstPanel: node.dstSocket.panel
                            };
                            node.srcSocket.panel.springs.set(node.dstSocket.panel, spring);
                            node.dstSocket.panel.springs.set(node.srcSocket.panel, spring);
                            this.springs.add(spring);
                        }
                    }
                    break;
                case 'panel':
                    this.panels.add(node);
                    this.panelsGroup.appendChild(node.group);
                    animateVisibility(node.group, true);
                    break;
            }
        }
        const deleteSocket = function(socket) {
            for(const [panel, wires] of socket.wiresPerPanel)
                for(const wire of wires)
                    nodesToRemove.add(wire);
        }.bind(this);
        for(const node of nodesToRemove)
            if(node.type === 'socket') {
                if(nodesToRemove.has(node.panel)) {
                    nodesToRemove.delete(node);
                    node.primaryElement.classList.remove('selected');
                    continue;
                }
                node.index = node.panel.sockets.indexOf(node);
            }
        for(const node of nodesToRemove) {
            this.selection.delete(node);
            switch(node.type) {
                case 'socket':
                    svgElementsToRemove.add(node.group);
                    node.panel.sockets.splice(node.panel.sockets.indexOf(node), 1);
                    panelsToUpdateR.add(node.panel);
                    deleteSocket(node);
                    break;
                case 'wire':
                    svgElementsToRemove.add(node.primaryElement);
                    this.wires.delete(node);
                    function disconnectSocket(srcSocket, dstPanel) {
                        if(!srcSocket.wiresPerPanel.has(dstPanel))
                            return false;
                        const set = srcSocket.wiresPerPanel.get(dstPanel);
                        if(!set.has(node))
                            return false;
                        set.delete(node);
                        if(set.size === 0)
                            srcSocket.wiresPerPanel.delete(dstPanel);
                        return true;
                    }
                    if(!disconnectSocket(node.srcSocket, node.dstSocket.panel) ||
                       !disconnectSocket(node.dstSocket, node.srcSocket.panel))
                        console.error('Wire was already disconnected', node);
                    if(node.srcSocket.panel !== node.dstSocket.panel) {
                        const spring = node.srcSocket.panel.springs.get(node.dstSocket.panel);
                        if(spring.referenceCount > 1)
                            --spring.referenceCount;
                        else {
                            node.srcSocket.panel.springs.delete(node.dstSocket.panel);
                            node.dstSocket.panel.springs.delete(node.srcSocket.panel);
                            this.springs.delete(spring);
                        }
                    }
                    break;
                case 'panel':
                    svgElementsToRemove.add(node.group);
                    this.panels.delete(node);
                    for(const socket of node.sockets) {
                        this.selection.delete(socket);
                        deleteSocket(socket);
                    }
                    break;
            }
        }
        for(const panel of panelsToUpdateA)
            this.updatePanelSockets(panel);
        animateElementRemoval.call(this, svgElementsToRemove, panelsToUpdateR);
        this.stabilizeGraph();
    }
}

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

const allModules = new Map();

async function addModule(module, version = 'latest', depth = 1) {
  version = version.replace(/^\^/, '');

  const t = module['dist-tags'][version];
  const latest = (t && module.versions[t]) || module.versions[version];

  const panel = wiredPanels.createPanel();

  const sockets = [];
  const wires = [];
  panel.x = 100 * depth;
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

loadModule('kronos-cluster-node', 'latest', 1);

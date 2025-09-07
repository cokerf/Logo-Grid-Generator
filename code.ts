/// <reference types="@figma/plugin-typings" />

// This file holds the main code for the plugin. It has access to the Figma API.

// 1. --- SETUP ---
figma.showUI(__html__, { width: 320, height: 680 });

// 2. --- SEND SELECTION TO UI ---
async function sendSelectionToUI() {
  const selection = figma.currentPage.selection;
  const vector = selection.find(node => node.type === 'VECTOR') as VectorNode;

  if (vector) {
    const svgContent = await vector.exportAsync({ format: 'SVG_STRING' });
    figma.ui.postMessage({ type: 'selection', svgContent, nodeId: vector.id });
  } else {
    figma.ui.postMessage({ type: 'deselection' });
  }
}

// Initial check on plugin start
sendSelectionToUI();

// Listen for selection changes in Figma
figma.on('selectionchange', sendSelectionToUI);


// 3. --- RECEIVE MESSAGES FROM UI ---
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'update-path') {
    const { nodeId, newD } = msg;
    const node = await figma.getNodeByIdAsync(nodeId) as VectorNode;
    if (node) {
      // Figma's vector representation is complex. The easiest way to update
      // a path is to create a new node from the updated SVG and replace the old one.
      const parent = node.parent;
      if (parent) {
         const newNode = figma.createNodeFromSvg(`<svg><path d="${newD}" /></svg>`);
         // Position and replace
         const vectorChild = newNode.children[0] as VectorNode;
         vectorChild.x = node.x;
         vectorChild.y = node.y;
         parent.appendChild(vectorChild);
         node.remove();
         figma.currentPage.selection = [vectorChild];
      }
    }
  }

  if (msg.type === 'generate-layers') {
    const { svgData, customization } = msg;
    const selection = figma.currentPage.selection;
    const vector = selection.find(node => node.type === 'VECTOR') as VectorNode;

    if (!vector || !svgData) {
        figma.notify("Please select a vector to generate layers for.", { error: true });
        return;
    }

    const parent = vector.parent;
    if (!parent) return;

    const group = figma.group([], parent);
    group.name = `${vector.name} Grid`;
    group.x = vector.x;
    group.y = vector.y;

    const hexToFigmaColor = (hex: string): RGB => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : { r: 0, g: 0, b: 0 };
    }

    // -- Create Gridlines --
    if (customization.gridlines) {
        const { width, height } = svgData;
        const step = Math.min(width, height) / 20;
        const gridGroup = figma.group([], group);
        gridGroup.name = "Gridlines";

        for (let i = 0; i <= width; i += step) {
            const line = figma.createLine();
            line.x = i;
            line.resize(height, 0);
            line.rotation = 90;
            line.strokes = [{ type: 'SOLID', color: hexToFigmaColor(customization.gridlines.color) }];
            line.strokeWeight = customization.gridlines.width;
            gridGroup.appendChild(line);
        }
        for (let i = 0; i <= height; i += step) {
            const line = figma.createLine();
            line.y = i;
            line.resize(width, 0);
            line.strokes = [{ type: 'SOLID', color: hexToFigmaColor(customization.gridlines.color) }];
            line.strokeWeight = customization.gridlines.width;
            gridGroup.appendChild(line);
        }
    }

    svgData.paths.forEach((path: any) => {
        // -- Create Outlines --
        if (path.boundingBox && customization.outlines) {
            const bbox = path.boundingBox;
            const outline = figma.createRectangle();
            outline.name = "Outline";
            outline.x = bbox.x;
            outline.y = bbox.y;
            outline.resize(bbox.width, bbox.height);
            outline.fills = [];
            outline.strokes = [{ type: 'SOLID', color: hexToFigmaColor(customization.outlines.color) }];
            outline.strokeWeight = customization.outlines.width;
            if (customization.outlines.style === 'dashed') {
                outline.dashPattern = [4, 2];
            }
            group.appendChild(outline);
        }

        // -- Create Anchors --
        if (path.points && customization.anchors) {
            const anchorGroup = figma.group([], group);
            anchorGroup.name = "Anchors";
            path.points.forEach((p: any) => {
                let anchor;
                if (customization.anchors.shape === 'square') {
                    anchor = figma.createRectangle();
                } else {
                    anchor = figma.createEllipse();
                }
                anchor.resize(customization.anchors.size, customization.anchors.size);
                anchor.x = p.x - customization.anchors.size / 2;
                anchor.y = p.y - customization.anchors.size / 2;
                anchor.fills = [{ type: 'SOLID', color: hexToFigmaColor(customization.anchors.color) }];
                anchorGroup.appendChild(anchor);
            });
        }
        
         // -- Create Handles --
        if (path.handles && customization.handles) {
            const handleGroup = figma.group([], group);
            handleGroup.name = "Handles";
            path.handles.forEach((h: any) => {
                const line = figma.createLine();
                // Figma lines are tricky. We set endpoints via move and resize.
                line.x = h.start.x;
                line.y = h.start.y;
                line.resize(Math.sqrt(Math.pow(h.end.x - h.start.x, 2) + Math.pow(h.end.y - h.start.y, 2)), 0);
                line.rotation = Math.atan2(h.end.y - h.start.y, h.end.x - h.start.x) * 180 / Math.PI;
                line.strokes = [{ type: 'SOLID', color: hexToFigmaColor(customization.handles.color) }];
                line.strokeWeight = customization.handles.width;
                handleGroup.appendChild(line);

                const circle = figma.createEllipse();
                const r = customization.anchors.size / 2.5;
                circle.resize(r*2, r*2);
                circle.x = h.end.x - r;
                circle.y = h.end.y - r;
                circle.fills = [{ type: 'SOLID', color: hexToFigmaColor(customization.handles.color)}];
                handleGroup.appendChild(circle);
            });
        }
    });

    figma.notify("✅ Grid layers created successfully!");
  }
};
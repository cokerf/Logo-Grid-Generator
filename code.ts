
// FIX: Add declarations for Figma's global variables and types to resolve TypeScript errors
// when the @figma/plugin-typings are not available in the linting environment.
declare const figma: any;
declare const __html__: any;
type VectorNode = any;
type RGB = { r: number; g: number; b: number };
type SolidPaint = any;


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
};

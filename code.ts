/// <reference types="@figma/plugin-typings" />
// Figma main context. The generator runs in the isolated UI iframe.
figma.showUI(__html__, { width: 960, height: 740, themeColors: true });
let selectionVersion = 0;
async function sendSelection() {
  const version = ++selectionVersion;
  const selected = figma.currentPage.selection;
  if (selected.length !== 1) {
    figma.ui.postMessage({ type: "deselection" });
    return;
  }
  const node = selected[0];
  if (!("exportAsync" in node)) {
    figma.ui.postMessage({
      type: "error",
      message: "Select an exportable vector, group, or frame.",
    });
    return;
  }
  try {
    const svgContent = await node.exportAsync({
      format: "SVG_STRING",
      svgOutlineText: true,
      svgIdAttribute: false,
    });
    if (version === selectionVersion)
      figma.ui.postMessage({
        type: "selection",
        svgContent,
        nodeId: node.id,
        name: node.name,
      });
  } catch (error) {
    figma.ui.postMessage({
      type: "error",
      message: `Could not read selection: ${String(error)}`,
    });
  }
}
figma.on("selectionchange", () => void sendSelection());
figma.ui.onmessage = async (message: unknown) => {
  if (!message || typeof message !== "object" || !("type" in message)) return;
  if (message.type === "ready") {
    await sendSelection();
    return;
  }
  if (message.type === "insert-construction") {
    const msg = message as {
      type: string;
      svg?: string;
      sourceNodeId?: string;
    };
    if (typeof msg.svg !== "string" || msg.svg.length > 15_000_000) {
      figma.ui.postMessage({
        type: "error",
        message: "Construction SVG is missing or too large.",
      });
      return;
    }
    let frame: FrameNode | undefined;
    try {
      const source = msg.sourceNodeId
        ? await figma.getNodeByIdAsync(msg.sourceNodeId)
        : null;
      frame = figma.createNodeFromSvg(msg.svg);
      frame.name = `${source && "name" in source ? source.name : "Logo"} / Construction`;
      const bounds =
        source && "absoluteBoundingBox" in source
          ? source.absoluteBoundingBox
          : null;
      frame.x = bounds
        ? bounds.x + bounds.width + 80
        : figma.viewport.center.x - frame.width / 2;
      frame.y = bounds ? bounds.y : figma.viewport.center.y - frame.height / 2;
      frame.setPluginData("generator", "Logo Grid Generator");
      if (msg.sourceNodeId)
        frame.setPluginData("sourceNodeId", msg.sourceNodeId);
      // Keep the source intact. Construction paths remain editable Figma vectors.
      figma.viewport.scrollAndZoomIntoView([frame]);
      figma.commitUndo();
      figma.notify("Construction added as editable vectors");
      figma.ui.postMessage({ type: "inserted", nodeId: frame.id });
    } catch (error) {
      frame?.remove();
      figma.ui.postMessage({
        type: "error",
        message: `Could not insert construction: ${String(error)}`,
      });
    }
  }
};

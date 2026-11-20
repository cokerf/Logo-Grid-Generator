# Logo Grid Generator for Affinity

Native construction drawing for **desktop Affinity by Canva 3.3.3+** on Windows and macOS. Affinity Designer 2 does not support this scripting workflow.

## Install: use the Script Editor

**The JavaScript source is not an `.afscripts` library file.** The Scripts Library → Import Scripts picker will not select it. Renaming a `.js` file does not convert it into Affinity’s library format. Earlier instructions incorrectly suggested importing JavaScript there.

1. Open `START-HERE.html` from the extracted ZIP, or https://logo-grid-generator.netlify.app/affinity.html, and click **Copy Affinity script**. A selectable source field is available if clipboard access is blocked.
2. In Affinity, open **Window → Scripting → Script Editor** and start an empty script.
3. Paste the complete source. Leave **Run as module** off: the script uses CommonJS and exports `module.exports.main`, matching the current official SDK examples.
4. **Open your logo SVG as a document first.** Switch to Vector and select the logo curves, shapes, live text or group with the Move Tool. Focus the Script Editor and click **Run**, or press **F5 on Windows / ⌘ Return on Mac**. Saving to the library alone does not execute the script. If the workspace says “No document open”, open your SVG before running.
5. Save it to your Scripts Library from the editor to reuse it. To share an importable category, export that category as `.afscripts` from Affinity. No fabricated or renamed native library file is included in this build.

You can also open `Logo-Grid-Generator.js` in a text editor and copy its contents manually.

No-document and empty-selection launches now show visible instructions. Unexpected runtime errors appear in an alert and are logged in Script Editor output.

## Construction controls

- **Edge and curve-peak guides:** actual path endpoints and analytic cubic Bézier extrema, clustered by position and ranked by segment span. Essential, Balanced and Detailed control density.
- **Diagonal edge extensions:** only sufficiently long, straight diagonal segments; repeated lines merge.
- **Radius circles:** local curvature candidates checked against a surrounding arc; nearby duplicate centers/radii merge. Choose circle detail and largest allowed radius. These describe local curvature, not proof that a designer used circles.
- **Outlines, anchor markers and handles:** separate editable parts. Anchor shape and size are configurable; handle tips are filled circles.
- **Modular grid, bounding frame, center marks and dimension brackets:** independent toggles. Dimension brackets are unlabelled geometry; use the web generator for measured labels.
- **Tangent spines:** off by default, extended across the construction frame and rendered at 10% opacity.
- **Appearance:** six palettes, independent outline/guide/circle/marker/background colours, stroke weight, marker size, solid/dashed/dotted guide and circle strokes, optional background and silhouette.
- **Live preview:** controls redraw the construction on the canvas. Cancel clears it. Confirm commits the named container and its parts in one compound command, restoring the original selection. Generated Logo Grid containers are skipped on subsequent runs.

## Supported artwork and limits

The native script reads the SDK’s curve interface for curves, shapes and text without converting or changing the original. It traverses groups and transforms geometry to spread coordinates. Imported clipping masks, raster images, effects and text with unusual layout may not expose the same geometry as their final rendered appearance. Use the **web SVG import** for those cases; do not assume the native script flattens masks. Earlier broad compatibility claims should not be taken as desktop validation.

Preview follows a construction frame around the logo, with adjustable overshoot. The modular grid covers that frame. For an exact canvas, hatching, SVG text rendering, labelled measurements, comparison and MP4, use `generator.html` or https://logo-grid-generator.netlify.app/, then open/place the exported SVG back in Affinity.

Geometry generation is capped at 30,000 elements. Circle output is capped at 64 and guides at 120 per axis. Reduce detail for complex artwork. Nothing uses the network or accesses files in the native script.

## Validation

Uses the official Affinity 3.3.3 JSLib signatures from https://sdk.affinity.studio/latest/. Automated tests exercise the exported entry point, analytic extrema, grouping, selection restoration, colours, dashed strokes, duplicate suppression, preview cancellation and error cleanup. **Affinity Desktop is not installed in the build environment: native dialog behaviour, live text geometry and spread alignment still need a real desktop check.** Affinity scripting remains beta. The ZIP is source plus a setup guide, not a verified native library export.

Designed and developed by Coker Oluwafemi — https://cokeroluwafemi.com/.

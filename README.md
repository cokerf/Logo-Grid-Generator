# Logo Grid Generator

A compact workspace for studying logo geometry and making construction films. Import an SVG, inspect its anchors and Bézier handles, study dimensions and tangents with Paper.js, and export the construction as editable vectors, a still image, or an H.264 MP4.

Designed and developed by [Coker Oluwafemi](https://cokeroluwafemi.com/).

## Generator

- Reference-inspired split workspace: preview on the left, visual construction cards and controls on the right. Persistent light and dark interface modes, responsive layout, and Archivo typography.
- Bézier traces, dimension guides, tangent spines, and local radius circles calculated from the actual paths using Paper.js. Tangent spines are local tangent guides, not an inferred medial-axis skeleton. Radius circles approximate local curvature; they are not a claim about how the logo was originally constructed.
- Draggable paths and control handles, anchors, bounding boxes, grid snapping, alignment guides, ruler guides, undo, and redo.
- Paper, Blueprint, and Ink palettes, customizable colors, stroke widths, anchor sizes, and square, column, or dot grids.
- Construction preview with play/pause, scrubbing, and a clean-logo or construction-hold ending.
- SVG, PNG, and MP4 exports with custom pixel dimensions and common square, portrait, story, landscape, and 4K presets.

## Run locally

Requires Node.js 22 or later. No API keys or external services are needed. Fonts and dependencies are bundled locally; uploaded artwork stays in the browser.

```sh
npm ci
npm run dev
```

```sh
npm run typecheck
npm run test:unit
npm test # Also requires Chromium or CHROME_BIN=/path/to/chrome
npm run build
npm run preview
```

The production website is generated in `dist/`. Deploy that directory to a static host. `base: './'` supports subdirectory hosting. The build also updates the bundled, ready-to-run root `index.html`, which supports this repository's existing branch-based GitHub Pages deployment without a separate Node build on GitHub. The editable HTML entry is `app.html`; do not edit the generated root `index.html` directly. The development server automatically serves `app.html` at `/`. Netlify uses `netlify.toml` to run `npm run build` with Node 22 and publish `dist/`.

## Import artwork

Use an SVG up to 5 MB. Live `<text>`, `<tspan>`, and `<textPath>` lettering is supported alongside paths, rectangles (including rounded corners), circles, ellipses, lines, polygons, and polylines, including nested group transforms, relative coordinates, repeated commands, smooth curves, quadratic curves, and elliptical arcs. Geometry is normalized into absolute line, cubic, and quadratic segments before editing.

Expand SVG instances and flatten clipping masks before import. Images, `<use>` instances, and clipped/masked artwork are rejected with a clear message rather than silently changing the logo. Live text is retained without requiring outlines, including typography declared through inline styles or internal CSS classes and text positioned along an internal path. Native text fades into construction films; anchors, handles, and geometry overlays apply to vector paths. Upload a TTF, OTF, WOFF, or WOFF2 font when the original font is unavailable. Uploaded fonts stay local and are embedded in SVG, PNG, and MP4 rendering; use Reset to restore the source font family. Archivo is bundled for reliable rendering. Original solid fills can be retained with Original logo colours, or overridden by the style controls. Gradients, filters, and original stroke styling are not reproduced. SVG scripts, event handlers, and external resources are never attached to the page.

Drag a path to move it; drag its control points with Control handles enabled. Drag from a ruler to add a guide; drag it outside the canvas to remove it. Ctrl/⌘ Z undoes a geometry edit, Shift Ctrl/⌘ Z or Ctrl Y redoes it. Space plays or pauses construction. Keyboard shortcuts leave focused form inputs alone.

## Export

| Option         | Behavior                                                                         |
| -------------- | -------------------------------------------------------------------------------- |
| SVG            | Editable vector geometry at the supplied dimensions                              |
| PNG            | Raster image at the exact supplied dimensions, with optional transparency        |
| MP4            | H.264 construction animation, encoded one frame at a time                        |
| Dimensions     | Whole pixels, 16–8192 per side, up to 33 megapixels; MP4 dimensions must be even |
| Video duration | 3, 5, 8, 10, 15, 20, or 30 seconds                                               |
| Frame rate     | 24, 30, or 60 fps                                                                |
| Quality        | Standard or High bitrate, scaled to pixel count and frame rate                   |
| Finish         | Hold construction, or fade the construction layers to the logo                   |
| Guides         | Include or omit alignment and selected-path guides                               |

MP4 requires WebCodecs with an H.264 encoder, normally available in current Chrome and Edge over HTTPS or localhost. The app checks the requested encoder configuration before rendering. Codec support and maximum dimensions depend on the device; reduce resolution or frame rate if a configuration is unsupported. Figma's embedded browser may not expose video encoding; use the standalone web app for MP4 in that case.

Export uses fixed frame timestamps, encoder backpressure, regular keyframes, and MP4 fast-start metadata. Rendering speed does not change video timing. This avoids dropped frames from real-time screen recording and allows playback to start before the whole file downloads. It cannot guarantee buffer-free streaming on every connection or device. High-resolution rendering may take longer than the video duration and uses memory proportional to the output; progress and cancellation are provided. Video is opaque and contains no audio. PNG transparency and SVG transparency do not apply to MP4.

The selected visible construction layers are used in preview and export. The logo is fitted without distortion to the requested aspect ratio. Rulers and manually dragged workspace guides are editing aids and are not exported.

## Figma plugin

[Download the Figma development plugin ZIP](https://github.com/cokerf/Logo-Grid-Generator/raw/refs/heads/main/figma/logo-grid-figma-plugin.zip), extract it, and import its `manifest.json` in Figma Desktop. No Node installation is needed for the prebuilt ZIP.

The plugin uses the same bundled interface and geometry engine as the web app. It reads the current selection and can insert the styled construction as editable Figma vectors without replacing the source artwork. Select one vector, group, component, instance, or frame. Text is outlined during selection export. The SVG import limitations above also apply to Figma selections.

```sh
npm run build:plugin
```

This produces:

```text
figma/dist/code.js
figma/dist/ui.html
figma/logo-grid-figma-plugin.zip
```

In Figma Desktop, open **Plugins → Development → Import plugin from manifest…** and select this repository's `manifest.json`. Keep `figma/dist/` next to the manifest at its existing path. The UI bundles its scripts, styles, and fonts and requests no network domains. Use the **Export** tab's **Insert editable construction in Figma** button to add the construction beside the selected artwork.

The repository originally contained a placeholder plugin ID. `manifest.json` retains that development ID; replace it with the ID assigned by Figma when creating your own plugin before Community submission. The build is an installable development plugin, not a Community publication. Test selection and insertion in Figma Desktop before publishing.

## Project structure

- `App.tsx` — workspace state, geometry editing, preview, and Figma UI bridge.
- `components/Canvas.tsx` — interactive SVG canvas, rulers, and guides.
- `components/AnalysisLayers.tsx` — construction overlays.
- `services/svgParser.ts` — sanitized geometry import and path normalization.
- `services/geometry.ts` — Paper.js curvature and tangent analysis.
- `services/exporter.ts` — shared construction timeline, still export, WebCodecs, and MP4 muxing.
- `code.ts` — Figma selection and editable vector insertion.
- `scripts/build-plugin.mjs` — standalone Figma plugin build, development ZIP, and prebuilt Pages entry.
- `app.html` — editable website entry; root `index.html` is generated.

Built with React, TypeScript, Vite, Paper.js, svgpath, WebCodecs, and mp4-muxer. Third-party packages retain their respective licenses.

## Validation

`npm run test:unit` checks SVG command normalization, arc conversion, subpath handling, Paper.js curvature, and export dimensions. `npm run test:browser` needs a Chromium-based browser (`chromium` by default, or set `CHROME_BIN`) and verifies DOM import, UI controls, construction frames, cancellation, and a real 1080 × 1350 H.264 export. GitHub Actions runs both suites and retains the sample MP4, a UI screenshot, browser results, and the packaged Figma development plugin as build artifacts.

The example is a local vector tracing of the Coker Oluwafemi logo supplied by the author. It does not depend on fetching the reference JPG at runtime. Canvas grids cover the full output canvas at every aspect ratio, including stills, construction preview, and video; rulers overlay the workspace only. Interface theme changes do not overwrite artwork colours.

## Affinity add-on

The build includes a native scripting add-on for Affinity by Canva 3.3.1+ and a bundled standalone generator. Download it from the application footer or `downloads/logo-grid-affinity.zip`. Import `Logo-Grid-Generator.js` into Scripting Studio, select curve layers, and run the script to add editable construction layers with a native options dialog. It uses Affinity's supported scripting SDK, adds all layers in one undo step, and leaves the source intact. Native execution still needs an Affinity Desktop installation and alignment check. See `affinity/README.md` for installation and scope.

Light mode is the default. An explicit choice of dark mode is saved for subsequent visits; older automatic dark-mode preferences are reset once when moving to the new theme preference key. The example logo is unchanged.

## Motion presets

The Export tab includes Technical build (8s), Precision close-up (10s), Geometry tour (12s), and Quiet reveal (8s). Choosing a preset sets its construction layers, duration, camera treatment, and ending, then starts the preview. You can change the layers, duration, resolution, frame rate, quality, and ending afterward. Close-ups use smooth pans and a pullback; every preset settles into the original framing for a final hold. Camera and construction timing are shared between preview and the deterministic MP4 exporter. Interface controls and preset names are not included in the video.


## Curated logo library

The web app offers 12 selected WorldVectorLogo brands plus the bundled Coker logo. No random or search endpoints are used. Each selection requests one SVG detail through `/.netlify/functions/worldvectorlogo`; the server accepts only the curated slugs in `services/logoCatalog.ts`. Successful responses are cached in the Netlify CDN (seven days), the warm function instance and the browser (seven days). The initial canvas loads the local Coker logo without any API call.

To connect your account, open the existing Netlify project's **Project configuration → Environment variables** and add `WORLDVECTORLOGO_API_KEY` with your key, enabled for the **Functions** scope and **Production** context. Save it, then redeploy. Do not prefix it with `VITE_`, commit it, or paste it into the generator. The function sends it to WorldVectorLogo using the Authorization Bearer header; the browser never receives it.

Missing credentials, 429s, provider errors, timeouts, and unsupported SVGs restore the local Coker example. There is no automatic retry loop. After a 429 the browser pauses provider requests for five minutes; warm server instances respect the provider's reset/cooldown. Cached logos remain available. The Figma and standalone builds retain their local logo and link to the Netlify app for the connected library.

## Rulers and outline defaults

Logo fill and Original logo colours start off. Enable either in Style as needed. **Export → Include rulers** is checked initially and includes rulers only when **Geometry → Rulers** is on. This applies to SVG, PNG, construction previews and MP4. Rulers remain fixed to the output frame and update their source-coordinate labels during camera zooms. Dimension guide measurements are in SVG user units (`u`), not output pixels. Dimension guides replace the former curvature comb, including editable dimension brackets in the Affinity add-on.

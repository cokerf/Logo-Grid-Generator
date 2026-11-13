# Logo Grid Generator for Affinity

A native scripting add-on for **Affinity by Canva 3.3.1 or newer**, using the supported JavaScript SDK. This is not an Affinity V2 Photoshop filter, a Figma-style webview panel, or a Community marketplace publication.

## Install and use

1. Download and extract `logo-grid-affinity.zip`.
2. In Affinity, open the Scripts panel or Scripting Studio and import/open `Logo-Grid-Generator.js`. Save it to your Scripts Library if you want to reuse it.
3. Select curve layers, or a group containing curve layers. For shapes and text, convert a copy to curves first.
4. Run the script, choose the construction layers in its native dialog, and confirm.

The script creates editable grid, Bézier trace, anchor and handle, dimension brackets, tangent spine, and radius circle layers in the current spread. Source artwork stays intact. The entire addition is one undo step. Cancel does not change the document. Complex selections are bounded to prevent generating excessive geometry.

The native grid surrounds the selected logo with 15% padding. For an exact output canvas, live SVG text, style controls, and construction MP4, open the included `generator.html` in Chrome/Edge, or use https://logo-grid-generator.netlify.app/. Export the artwork as SVG from Affinity, import it into the generator, then open/place the exported construction SVG back in Affinity. MP4 encoding needs a browser with H.264 WebCodecs support; the hosted HTTPS app is the preferred export surface.

## Compatibility and validation

Uses `/document.js`, `/dialog.js`, `/geometry.js`, `/nodes.js`, `/commands.js`, `/fills.js`, `/linestyle.js`, `/colours.js`, and `affinity:common` from the official SDK. No network, external plugin loader, or account connection is required by the native script.

The script is validated against the official 3.3.1 SDK module signatures and automated host mocks. It still needs an installation and geometry-alignment check inside Affinity Desktop before being treated as production-tested. Affinity scripting is currently beta.

Official SDK: https://sdk.affinity.studio/33001/

Designed and developed by Coker Oluwafemi — https://cokeroluwafemi.com/.

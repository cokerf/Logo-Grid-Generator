import regular from "@fontsource/archivo/files/archivo-latin-400-normal.woff2?inline";
import semibold from "@fontsource/archivo/files/archivo-latin-600-normal.woff2?inline";
import bold from "@fontsource/archivo/files/archivo-latin-700-normal.woff2?inline";
export const bundledFontCSS = [regular, semibold, bold]
  .map(
    (url, i) =>
      `@font-face{font-family:Archivo;font-style:normal;font-weight:${[400, 600, 700][i]};src:url("${url}") format("woff2")}`,
  )
  .join("");
export interface UploadedFont {
  family: string;
  name: string;
  css: string;
}
export async function importFont(file: File): Promise<UploadedFont> {
  if (file.size > 10_000_000)
    throw new Error("Choose a font smaller than 10 MB.");
  if (!/\.(woff2?|otf|ttf)$/i.test(file.name))
    throw new Error("Choose a TTF, OTF, WOFF, or WOFF2 font.");
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const family = `LogoFont${crypto.randomUUID().replaceAll("-", "")}`;
  const font = new FontFace(family, `url("${data}")`);
  await font.load();
  document.fonts.add(font);
  return {
    family,
    name: file.name,
    css: `@font-face{font-family:${family};src:url("${data}")}`,
  };
}

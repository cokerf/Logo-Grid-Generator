// Repoint only SVG resource references; colours such as #fff are never treated as IDs.
export function rewriteSVGReference(name:string,value:string,ids:ReadonlyMap<string,string>) {
  if((name==='href'||name==='xlink:href')&&value.startsWith('#'))return ids.has(value.slice(1))?'#'+ids.get(value.slice(1)):value;
  return value.replace(/url\(\s*(['"]?)#([^\s)'";]+)\1\s*\)/g,(whole,quote,id)=>ids.has(id)?`url(#${ids.get(id)})`:whole);
}

// These three EPS-derived catalogue files contain a white, full-canvas backing path.
// Remove only that known rectangle; all actual logo paths, including white details, remain intact.
const backingSizes:Record<string,string>={'adidas':'192.756','honda-11':'192.756','the-north-face-1':'192.744'};
export function prepareLibrarySVG(slug:string,svg:string) {
  const size=backingSizes[slug];if(!size)return svg;
  return svg.replace(/<path\b[^>]*\/>/g,tag=>{
    const fill=tag.match(/\bfill\s*=\s*(["'])(.*?)\1/i)?.[2]?.toLowerCase();
    const d=tag.match(/\bd\s*=\s*(["'])(.*?)\1/i)?.[2]?.replace(/\s+/g,'');
    return ['#fff','#ffffff','white'].includes(fill||'')&&d===`M00h${size}v${size}H0V0z`?'':tag;
  });
}

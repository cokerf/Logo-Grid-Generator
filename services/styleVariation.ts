import type {CustomizationOptions} from '../types.ts';
import type {AnalysisOptions} from '../components/AnalysisLayers.tsx';
import type {Visibility} from '../components/ControlPanel.tsx';
export const studioPalettes=[
  {name:'Paper',background:'#f2f1eb',ink:'#202822',accent:'#597e45'},
  {name:'Blueprint',background:'#122b47',ink:'#b4def5',accent:'#7eb6e1'},
  {name:'Ink',background:'#161c18',ink:'#d8e2d2',accent:'#c6f566'},
  {name:'Porcelain',background:'#faf7f2',ink:'#453258',accent:'#8b56b5'},
  {name:'Clay',background:'#eee5dc',ink:'#4b2b21',accent:'#ad563d'},
  {name:'Midnight',background:'#191b2c',ink:'#eee9fe',accent:'#a799ff'},
  {name:'Cobalt',background:'#2346d8',ink:'#fff5d9',accent:'#ffdc69'},
  {name:'Coral',background:'#ff795f',ink:'#3c1730',accent:'#671f43'},
  {name:'Lagoon',background:'#075552',ink:'#f6e7bd',accent:'#9fe5cf'},
  {name:'Orchid',background:'#e5b6f3',ink:'#41204f',accent:'#673596'},
  {name:'Citron',background:'#d8ef65',ink:'#173d34',accent:'#326b51'},
  {name:'Tomato',background:'#b62e3c',ink:'#fff3da',accent:'#ffd578'},
  {name:'Sunflower',background:'#f2c94c',ink:'#2f2446',accent:'#624273'},
  {name:'Azure',background:'#b9e6f5',ink:'#133d67',accent:'#145b86'},
] as const;
export function shuffledSlug(slugs:readonly string[],current:string,random= Math.random) {
  const choices=slugs.filter(slug=>slug!==current);
  return choices[Math.min(choices.length-1,Math.floor(random()*choices.length))]||current;
}
export function styleVariation(c:CustomizationOptions,a:AnalysisOptions,v:Visibility,scale:number,complexity:number,random=Math.random) {
  const choose=<T,>(items:readonly T[])=>items[Math.min(items.length-1,Math.floor(random()*items.length))];
  const palette=choose(studioPalettes.filter(p=>p.background!==c.canvasBackground));
  const size=Math.max(scale,1), detail=choose(['dimensions','spines','quiet'] as const),dense=complexity>250;
  return {
    name:palette.name,
    customization:{...c,...(c.drafting?{drafting:{...c.drafting,presetId:undefined,hatchColor:palette.ink,guideColor:palette.accent,cornerColor:palette.accent}}:{}),canvasBackground:palette.background,useOriginalColors:false,showFill:false,fillColor:palette.ink+'18',
      path:{stroke:palette.ink,strokeWidth:size*choose([.0008,.001,.0013])},
      anchors:{...c.anchors,color:palette.accent,size:size*.004,shape:choose(['square','circle'] as const)},
      handles:{color:palette.accent,width:size*.0007},
      outlines:{...c.outlines,color:palette.accent+'80',width:size*.0006},
      gridlines:{...c.gridlines,color:palette.ink+'24',width:size*.00045,style:choose(['lines','lines','dots'] as const),type:'square' as const,density:choose([16,20,24,32])},
      rulers:{background:palette.background,text:palette.ink+'99'},
      elementGuides:{...c.elementGuides,color:palette.accent+'66',width:size*.0005},
      alignmentGuides:{...c.alignmentGuides,color:palette.accent+'66',width:size*.0005},
      guides:{color:palette.accent}},
    analysis:{...a,curves:true,dimensions:detail==='dimensions',spines:detail==='spines'&&!dense,circles:false,samples:choose([16,24,32]),gain:choose([.8,1,1.2]),color:palette.accent},
    visibility:{...v,grid:random()>.15,anchors:!dense&&random()>.6,handles:!dense&&detail==='spines',outlines:false,alignment:false,elementGuides:false},
  };
}

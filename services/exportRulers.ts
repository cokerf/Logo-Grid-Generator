const ns='http://www.w3.org/2000/svg';
export function updateExportRulers(outer: SVGSVGElement) {
  const group=outer.querySelector<SVGGElement>('[data-export-rulers]');
  const scene=outer.querySelector<SVGSVGElement>('svg');
  if(!group||!scene)return;
  const [x,y,w,h]=(scene.getAttribute('viewBox')||'').split(/[\s,]+/).map(Number),
    width=Number(outer.getAttribute('width')),height=Number(outer.getAttribute('height'));
  if(![x,y,w,h,width,height].every(Number.isFinite)||Math.min(w,h,width,height)<=0)return;
  const size=Math.max(14,Math.min(width,height)*.025),font=size*.4;
  const create=(tag:string,attributes:Record<string,string|number>,text?:string)=>{
    const node=document.createElementNS(ns,tag);
    Object.entries(attributes).forEach(([k,v])=>node.setAttribute(k,String(v)));
    if(text!==undefined)node.textContent=text;
    return node;
  };
  group.replaceChildren();
  group.setAttribute('pointer-events','none');
  group.append(create('path',{d:`M0 0H${width}V${size}H${size}V${height}H0Z`,fill:group.getAttribute('data-background')||'#151515'}));
  const ink=group.getAttribute('data-ink')||'#9a96aa';
  let ticks='';
  for(const [start,span,pixels,vertical] of [[x,w,width,false],[y,h,height,true]] as const){
    const rough=span/(pixels/size/2),power=10**Math.floor(Math.log10(rough)),
      step=[1,2,5,10].find(n=>n*power>=rough)!*power;
    let count=0;
    for(let value=Math.ceil(start/step)*step;value<=start+span&&count<160;value+=step,count++){
      const pos=(value-start)/span*pixels;
      if(pos<size)continue;
      const major=count%2===0;
      ticks+=vertical?`M${size} ${pos}h${-size*(major?.35:.18)}`:`M${pos} ${size}v${-size*(major?.35:.18)}`;
      if(major){
        const label=String(Number(value.toFixed(2)));
        group.append(create('text',vertical?{transform:`translate(${size*.43} ${pos+font*.3}) rotate(-90)`,fill:ink,'font-size':font,'font-family':'Arial,sans-serif'}:{x:pos+font*.3,y:size*.45,fill:ink,'font-size':font,'font-family':'Arial,sans-serif'},label));
      }
    }
  }
  group.append(create('path',{d:ticks,stroke:ink,'stroke-width':Math.max(.5,size*.025),fill:'none'}));
}

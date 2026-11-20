"use strict";
// Logo Grid Generator — Coker Oluwafemi.
// Paste into Affinity's Script Editor as CommonJS; save to the Scripts Library.
// No network, file access or destructive conversion of source artwork.
function main() {
  const { Document } = require('/document.js');
  const { Dialog, DialogResult } = require('/dialog.js');
  const { Curve, PolyCurve } = require('/geometry.js');
  const { ContainerNodeDefinition, PolyCurveNodeDefinition } = require('/nodes.js');
  const { AddChildNodesCommandBuilder, CompoundCommandBuilder, DocumentCommand } = require('/commands.js');
  const { FillDescriptor } = require('/fills.js');
  const { LineStyleDescriptor, LineType } = require('/linestyle.js');
  const { RGB8 } = require('/colours.js');
  const { UnitType } = require('/units.js');
  const { BlendMode } = require('affinity:common');
  const doc = Document.current;
  if (!doc || !doc.selection.length) throw new Error('Open a document and select your logo curves, shapes, text or group first.');
  const originalSelection = doc.selection, nodes = [], seen = [];
  function collect(node) {
    if (seen.some(other => other.isSameNode(node))) return;
    seen.push(node);
    if (/^Logo Grid\b/.test(node.userDescription || '')) return;
    // Text and live shapes expose the same read-only curve interface as curves.
    if (node.isPolyCurveNode || node.isShapeNode || node.isTextNode) nodes.push(node);
    else for (const child of node.children || []) collect(child);
  }
  for (const node of originalSelection.nodes) collect(node);
  const curves = [];
  for (const node of nodes) {
    const poly = node.polyCurve.clone();
    poly.transform(node.localToSpreadTransform);
    for (const curve of poly) if (!curve.isEmpty) curves.push(curve);
  }
  if (!curves.length) throw new Error('No readable vector geometry. Select curves, shapes or live text. For image-only or masked artwork, export SVG and use the web generator.');
  const all = PolyCurve.create();
  for (const curve of curves) all.addCurve(curve);
  const bounds = all.getExactBoundingBox();
  if (!bounds || !Number.isFinite(bounds.width + bounds.height) || Math.max(bounds.width,bounds.height)<=0) throw new Error('The selection has no usable bounds.');
  const scale = Math.max(bounds.width,bounds.height,1);
  // Named palettes use separate roles for traces, guides, circles and markers.
  const palettes = [
    ['Paper / cobalt',[35,68,173],[91,115,182],[221,81,71],[39,42,54],[249,247,240]],
    ['Midnight / citrus',[242,239,211],[125,153,145],[242,184,71],[199,231,122],[24,42,47]],
    ['Plum / lilac',[242,226,255],[151,129,177],[245,151,126],[217,192,255],[45,32,62]],
    ['Clay / ink',[72,49,42],[165,112,88],[38,120,126],[72,49,42],[245,222,205]],
    ['Ultramarine / coral',[241,240,255],[140,163,240],[255,154,137],[255,221,105],[32,49,145]],
    ['Mint / forest',[24,77,61],[91,148,124],[174,88,83],[24,77,61],[225,241,225]],
  ];
  const dlg = Dialog.create('Logo Grid Generator');
  dlg.initialWidth = 760;
  const left=dlg.addColumn(), right=dlg.addColumn();
  const layersUI=left.addGroup('01  Construction');
  const checks={
    guides:layersUI.addCheckBox('Edge and curve-peak guides',true),
    angled:layersUI.addCheckBox('Diagonal edge extensions',false),
    frame:layersUI.addCheckBox('Bounding frame and center lines',false),
    grid:layersUI.addCheckBox('Modular grid',false),
    trace:layersUI.addCheckBox('Bézier outline',true),
    anchors:layersUI.addCheckBox('Anchor markers',true),
    handles:layersUI.addCheckBox('Control handles',true),
    circles:layersUI.addCheckBox('Fitted radius circles',false),
    centers:layersUI.addCheckBox('Circle center marks',true),
    dimensions:layersUI.addCheckBox('Dimension brackets',false),
    spines:layersUI.addCheckBox('Tangent spines',false),
    silhouette:layersUI.addCheckBox('Silhouette fill',false),
    background:layersUI.addCheckBox('Palette background',false),
  };
  const geometryUI=left.addGroup('02  Detail and extent');
  const sensitivity=geometryUI.addComboBox('Guides',['Essential','Balanced','Detailed'],1);
  const complexity=geometryUI.addComboBox('Circle detail',['Essential · 4','Balanced · 12','Detailed · 32','All · 64'],1);
  const extent=geometryUI.addComboBox('Guide overshoot',['15%','35%','70%','120%'],1);
  const maxRadius=geometryUI.addComboBox('Largest radius',['35% of logo','70% of logo','150% of logo'],1);
  const divisions=geometryUI.addComboBox('Grid divisions',['8','12','20','32'],2);
  const styleUI=right.addGroup('03  Appearance');
  const style=styleUI.addComboBox('Palette',palettes.map(p=>p[0]),0);
  const stroke=styleUI.addUnitValueEditor('Stroke weight',UnitType.Pixel,UnitType.Pixel,scale/900,scale/10000,scale/40);
  const markerSize=styleUI.addComboBox('Marker size',['Small','Medium','Large'],1);
  const markerShape=styleUI.addComboBox('Anchor shape',['Square','Circle','Diamond'],0);
  const guideStyle=styleUI.addComboBox('Guide stroke',['Solid','Dashed','Dotted'],2);
  const radiusStyle=styleUI.addComboBox('Circle stroke',['Solid','Dashed','Dotted'],0);
  const colours=right.addGroup('04  Layer colours');
  const colourControls=['Outline','Guides','Circles','Markers','Background'].map((name,i)=>{const picker=colours.addColourPicker(name,RGB8(...palettes[0][i+1]));picker.allowPickNone=false;return picker;});
  style.onValueChangedHandler=()=>colourControls.forEach((control,i)=>{control.value=RGB8(...palettes[style.selectedIndex][i+1]);});
  const previewUI=right.addGroup('Preview');
  const preview=previewUI.addCheckBox('Preview on canvas',true);
  previewUI.addStaticText('','Source artwork stays editable. Cancel removes the preview. Each construction part has its own editable layer.');
  let inPreview=false;
  function buildCommand() {
    const enabled={};for(const key of Object.keys(checks))enabled[key]=checks[key].value;
    const active=Object.keys(enabled).some(k=>k!=='centers'&&enabled[k]);
    if(!active)return null;
    const pad=scale*[.15,.35,.7,1.2][extent.selectedIndex],
      frame={x:bounds.x-pad,y:bounds.y-pad,width:bounds.width+2*pad,height:bounds.height+2*pad},
      marker=scale*[1/360,1/230,1/150][markerSize.selectedIndex],
      weight=stroke.value, layers={}, totals={count:0};
    const styles={
      'Background':{colour:4,fill:true},'Silhouette':{colour:0,fill:true,alpha:.1},
      'Modular grid':{colour:1,alpha:.25,weight:.45,dash:guideStyle.selectedIndex},
      'Edge guides':{colour:1,alpha:.65,weight:.65,dash:guideStyle.selectedIndex},
      'Diagonal edges':{colour:1,alpha:.45,weight:.65,dash:guideStyle.selectedIndex},
      'Bounding frame':{colour:1,alpha:.65,weight:.65,dash:guideStyle.selectedIndex},
      'Radius circles':{colour:2,alpha:.8,weight:.8,dash:radiusStyle.selectedIndex},
      'Circle centers':{colour:2,alpha:.8,weight:.65},
      'Tangent spines':{colour:1,alpha:.1,weight:.5},
      'Bézier trace':{colour:0},'Control handles':{colour:3,alpha:.65,weight:.6},
      'Handle tips':{colour:3,fill:true},'Anchor markers':{colour:3,fill:true},
      'Dimension brackets':{colour:1,alpha:.8,weight:.75},
    };
    function add(key,curve){if(++totals.count>30000)throw new Error('Too much geometry. Reduce detail or select fewer objects.');(layers[key]||(layers[key]=PolyCurve.create())).addCurve(curve);}
    function line(key,a,b){if(Math.hypot(b.x-a.x,b.y-a.y)>scale*1e-8)add(key,Curve.createLine(a,b));}
    function circle(key,x,y,r){add(key,Curve.createEllipse({x:x-r,y:y-r,width:r*2,height:r*2}));}
    const marked=new Set();
    function anchor(p){const key=Math.round(p.x/(scale*1e-7))+':'+Math.round(p.y/(scale*1e-7));if(marked.has(key))return;marked.add(key);
      if(markerShape.selectedIndex===1)circle('Anchor markers',p.x,p.y,marker/2);
      else if(markerShape.selectedIndex===2){const r=marker*.65;const points=[{x:p.x,y:p.y-r},{x:p.x+r,y:p.y},{x:p.x,y:p.y+r},{x:p.x-r,y:p.y}];for(let i=0;i<4;i++)line('Anchor diamonds',points[i],points[(i+1)%4]);styles['Anchor diamonds']={colour:3};}
      else add('Anchor markers',Curve.createRectangle({x:p.x-marker/2,y:p.y-marker/2,width:marker,height:marker}));
    }
    function extended(key,p,d){const n=Math.hypot(d.x,d.y);if(n<scale*1e-9)return;const tx=d.x/n,ty=d.y/n;let lo=-Infinity,hi=Infinity;
      for(const [q,v,min,max] of [[p.x,tx,frame.x,frame.x+frame.width],[p.y,ty,frame.y,frame.y+frame.height]]){if(Math.abs(v)<1e-10){if(q<min||q>max)return;}else{const a=(min-q)/v,b=(max-q)/v;lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));}}
      if(lo<hi)line(key,{x:p.x+lo*tx,y:p.y+lo*ty},{x:p.x+hi*tx,y:p.y+hi*ty});
    }
    if(enabled.background)add('Background',Curve.createRectangle(frame));
    if(enabled.silhouette)for(const curve of curves)add('Silhouette',curve.clone());
    if(enabled.grid){const step=scale/[8,12,20,32][divisions.selectedIndex];for(let x=frame.x;x<=frame.x+frame.width+step*.001;x+=step)line('Modular grid',{x,y:frame.y},{x,y:frame.y+frame.height});for(let y=frame.y;y<=frame.y+frame.height+step*.001;y+=step)line('Modular grid',{x:frame.x,y},{x:frame.x+frame.width,y});}
    if(enabled.frame){add('Bounding frame',Curve.createRectangle(bounds));extended('Bounding frame',{x:bounds.x+bounds.width/2,y:bounds.y},{x:0,y:1});extended('Bounding frame',{x:bounds.x,y:bounds.y+bounds.height/2},{x:1,y:0});}
    const candidates={x:[],y:[]}, circles=[], spineKeys=new Set(), diagonalKeys=new Set();
    function point(b,t){const q=1-t;return{x:q*q*q*b.start.x+3*q*q*t*b.c1.x+3*q*t*t*b.c2.x+t*t*t*b.end.x,y:q*q*q*b.start.y+3*q*q*t*b.c1.y+3*q*t*t*b.c2.y+t*t*t*b.end.y};}
    function extrema(a,b,c,d){const A=-a+3*b-3*c+d,B=2*(a-2*b+c),C=b-a;if(Math.abs(A)<1e-10)return Math.abs(B)<1e-10?[]:[-C/B].filter(t=>t>0&&t<1);const disc=B*B-4*A*C;if(disc<0)return[];return[(-B+Math.sqrt(disc))/(2*A),(-B-Math.sqrt(disc))/(2*A)].filter(t=>t>0&&t<1);}
    function candidate(axis,value,strength){candidates[axis].push({value,strength});}
    for(const curve of curves){
      if(enabled.trace)add('Bézier trace',curve.clone());
      let index=curve.firstOnCurvePointIndex, visits=0;
      while(index>=0&&visits++<=curve.pointCount){
        const next=curve.getNextOnCurvePointIndex(index,true);if(next<0||next===index)break;
        const b=curve.getCubicBezier(index),p=[b.start,b.c1,b.c2,b.end],len=Math.hypot(p[3].x-p[0].x,p[3].y-p[0].y);
        for(const axis of ['x','y']){candidate(axis,p[0][axis],len);candidate(axis,p[3][axis],len);for(const t of extrema(...p.map(q=>q[axis])))candidate(axis,point(b,t)[axis],scale);}
        if(enabled.anchors){anchor(p[0]);anchor(p[3]);}
        if(enabled.handles)for(const [a,c] of [[p[0],p[1]],[p[3],p[2]]])if(Math.hypot(a.x-c.x,a.y-c.y)>scale*1e-6){line('Control handles',a,c);circle('Handle tips',c.x,c.y,marker*.3);}
        const cross=q=>(q.x-p[0].x)*(p[3].y-p[0].y)-(q.y-p[0].y)*(p[3].x-p[0].x), straight=len>0&&Math.max(Math.abs(cross(p[1])),Math.abs(cross(p[2])))/len<scale*1e-5;
        if(enabled.angled&&straight&&len>scale*.04&&Math.abs(p[3].x-p[0].x)>scale*.002&&Math.abs(p[3].y-p[0].y)>scale*.002){const dx=(p[3].x-p[0].x)/len,dy=(p[3].y-p[0].y)/len,s=dx<0?-1:1,key=[Math.round(dx*s*1000),Math.round(dy*s*1000),Math.round((p[0].x*dy-p[0].y*dx)*s/(scale*.002))].join(':');if(!diagonalKeys.has(key)){diagonalKeys.add(key);extended('Diagonal edges',p[0],{x:dx,y:dy});}}
        if(enabled.spines)for(const [a,c] of [[p[0],p[1]],[p[3],p[2]]]){const n=Math.hypot(c.x-a.x,c.y-a.y);if(n>scale*1e-6){const dx=(c.x-a.x)/n,dy=(c.y-a.y)/n,s=dx<0?-1:1,key=[Math.round(dx*s*1000),Math.round(dy*s*1000),Math.round((a.x*dy-a.y*dx)*s/(scale*.003))].join(':');if(!spineKeys.has(key)){spineKeys.add(key);extended('Tangent spines',a,{x:dx,y:dy});}}}
        if(enabled.circles&&!straight)for(const t of [.25,.5,.75]){const q=1-t,a=point(b,t),dx=3*q*q*(p[1].x-p[0].x)+6*q*t*(p[2].x-p[1].x)+3*t*t*(p[3].x-p[2].x),dy=3*q*q*(p[1].y-p[0].y)+6*q*t*(p[2].y-p[1].y)+3*t*t*(p[3].y-p[2].y),ddx=6*q*(p[2].x-2*p[1].x+p[0].x)+6*t*(p[3].x-2*p[2].x+p[1].x),ddy=6*q*(p[2].y-2*p[1].y+p[0].y)+6*t*(p[3].y-2*p[2].y+p[1].y),speed=Math.hypot(dx,dy),k=(dx*ddy-dy*ddx)/(speed*speed*speed),signed=1/k,r=Math.abs(signed),cx=a.x-dy/speed*signed,cy=a.y+dx/speed*signed;
          if(!Number.isFinite(cx+cy+r)||r<scale*.008||r>scale*[.35,.7,1.5][maxRadius.selectedIndex])continue;
          // Reject circles that do not fit a substantial neighbourhood of the arc.
          const error=Math.max(...[Math.max(0,t-.2),Math.min(1,t+.2)].map(u=>{const v=point(b,u);return Math.abs(Math.hypot(v.x-cx,v.y-cy)-r)/r;}));
          if(error>.025||circles.some(c=>Math.hypot(c.x-cx,c.y-cy)<scale*.008&&Math.abs(c.r-r)<scale*.008))continue;
          circles.push({x:cx,y:cy,r,error});
        }
        if(next===curve.firstOnCurvePointIndex)break;index=next;
      }
    }
    if(enabled.guides)for(const axis of ['x','y']){const gap=scale*[.035,.012,.003][sensitivity.selectedIndex],limit=[12,40,120][sensitivity.selectedIndex],selected=[];
      for(const c of candidates[axis].sort((a,b)=>b.strength-a.strength)){if(selected.length>=limit)break;if(selected.some(v=>Math.abs(v-c.value)<gap))continue;selected.push(c.value);extended('Edge guides',axis==='x'?{x:c.value,y:bounds.y}:{x:bounds.x,y:c.value},axis==='x'?{x:0,y:1}:{x:1,y:0});}
    }
    for(const c of circles.sort((a,b)=>b.r-a.r||a.error-b.error).slice(0,[4,12,32,64][complexity.selectedIndex])){circle('Radius circles',c.x,c.y,c.r);if(enabled.centers){const d=marker*1.5;line('Circle centers',{x:c.x-d,y:c.y},{x:c.x+d,y:c.y});line('Circle centers',{x:c.x,y:c.y-d},{x:c.x,y:c.y+d});}}
    if(enabled.dimensions){const x=bounds.x,y=bounds.y,r=x+bounds.width,b=y+bounds.height,gap=scale*.055,tick=scale*.008,key='Dimension brackets';line(key,{x,y:b},{x,y:b+gap+tick*2});line(key,{x:r,y:b},{x:r,y:b+gap+tick*2});line(key,{x,y:b+gap},{x:r,y:b+gap});line(key,{x:r,y},{x:r+gap+tick*2,y});line(key,{x:r,y:b},{x:r+gap+tick*2,y:b});line(key,{x:r+gap,y},{x:r+gap,y:b});for(const px of[x,r])line(key,{x:px-tick,y:b+gap+tick},{x:px+tick,y:b+gap-tick});for(const py of[y,b])line(key,{x:r+gap-tick,y:py+tick},{x:r+gap+tick,y:py-tick});}
    if(!Object.keys(layers).length)return null;
    const group=AddChildNodesCommandBuilder.create();group.setInsertionTarget(doc.currentSpread);group.addNode(ContainerNodeDefinition.create('Logo Grid / '+palettes[style.selectedIndex][0]));
    const children=AddChildNodesCommandBuilder.create(), noFill=FillDescriptor.createNone();
    // Explicit order keeps backgrounds below measurements and anchor markers on top.
    for(const name of Object.keys(styles)){if(!layers[name])continue;const s=styles[name],colour=colourControls[s.colour].value.clone();colour.alpha=s.alpha===undefined?1:s.alpha;
      const fill=FillDescriptor.createSolid(colour,BlendMode.Normal),lineStyle=LineStyleDescriptor.createDefault(weight*(s.weight||1));
      if(s.dash){lineStyle.lineStyle.type=LineType.Dash;lineStyle.lineStyle.dashPattern=s.dash===1?[5,4]:[1,4];}
      const def=PolyCurveNodeDefinition.create(layers[name],s.fill?fill:noFill,s.fill?noFill:fill,lineStyle,noFill);def.userDescription='Logo Grid / '+name;children.addPolyCurveNode(def);
    }
    return CompoundCommandBuilder.create().addCommand(group.createCommand(true)).addCommand(children.createCommand(false)).addCommand(DocumentCommand.createSetSelection(originalSelection)).createCommand();
  }
  function update(isPreview){if(inPreview)return;inPreview=true;try{const command=buildCommand();if(command)doc.executeCommand(command,isPreview);else doc.clearPreviews();return !!command;}catch(error){doc.clearPreviews();throw error;}finally{inPreview=false;}}
  function syncControls(){complexity.isEnabled=checks.circles.value;maxRadius.isEnabled=checks.circles.value;radiusStyle.isEnabled=checks.circles.value;checks.centers.isEnabled=checks.circles.value;sensitivity.isEnabled=checks.guides.value;divisions.isEnabled=checks.grid.value;markerShape.isEnabled=checks.anchors.value;markerSize.isEnabled=checks.anchors.value||checks.handles.value;}
  syncControls();
  dlg.onControlValueChangedHandler=()=>{syncControls();if(preview.value)update(true);else doc.clearPreviews();};
  try {
    if(preview.value)update(true);
    const result=dlg.runModal(), ok=(result&&result.value!==undefined?result.value:result)===DialogResult.Ok.value;
    if(ok){doc.clearPreviews();update(false);}
  } finally {doc.clearPreviews();}
}
// Affinity calls the exported entry point. Do not execute while loading the module.
module.exports.main = main;

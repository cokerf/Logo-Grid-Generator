import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const script=readFileSync(new URL('../affinity/Logo-Grid-Generator.js',import.meta.url),'utf8');
const arch={start:{x:0,y:100},c1:{x:0,y:0},c2:{x:100,y:0},end:{x:100,y:100}};
function host({cancel=false,selected=true,documentOpen=true,all=false,override={},onDialog,segments=[arch],generated=false,type='isPolyCurveNode',fail=false}={}){
  const records={dialogTitles:[],columns:0,writes:[],definitions:[],controls:{},clears:0,groups:[],transforms:[],alerts:[],errors:[]};
  class Colour{constructor(r,g,b){Object.assign(this,{r,g,b,alpha:1});}clone(){return new Colour(this.r,this.g,this.b);}}
  const curves=segments.map(b=>({isEmpty:false,firstOnCurvePointIndex:0,pointCount:4,getNextOnCurvePointIndex:i=>i===0?1:-1,getCubicBezier:()=>b,clone(){return this;}}));
  class Poly{constructor(parts=[]){this.parts=[...parts];}static create(){return new Poly();}addCurve(c){this.parts.push(c);}clone(){return new Poly(this.parts);}transform(t){records.transforms.push(t);return this;}getExactBoundingBox(){return{x:0,y:0,width:100,height:100};}*[Symbol.iterator](){yield* this.parts;}}
  const node={[type]:true,polyCurve:new Poly(curves),localToSpreadTransform:{translateX:50},userDescription:generated?'Logo Grid / previous':'Artwork',isSameNode(other){return this===other;}};
  const selection={length:selected?1:0,nodes:selected?[node]:[]},doc={selection,currentSpread:{},clearPreviews(){records.clears++;},executeCommand(c,preview){if(fail)throw new Error('host failure');records.writes.push({c,preview});}};
  const control=(label,c)=>{if(label in override){if('selectedIndex'in c)c.selectedIndex=override[label];else c.value=override[label];}records.controls[label]=c;return c;};
  const group={addStaticText(){},addCheckBox:(label,value)=>control(label,{value:all?true:value}),addComboBox:(label,items,selectedIndex)=>control(label,{items,selectedIndex}),addUnitValueEditor:(label,u,d,value)=>control(label,{value}),addColourPicker:(label,value)=>control(label,{value})};
  const dialog={addColumn:()=>{records.columns++;return{addGroup:()=>group};},runModal(){onDialog?.(dialog,records);return{value:cancel?2:1};}};
  const modules={
    '/document.js':{Document:{current:documentOpen?doc:null}},'/dialog.js':{Dialog:{create:title=>{records.dialogTitles.push(title);return dialog;}},DialogResult:{Ok:{value:1}}},
    '/geometry.js':{PolyCurve:Poly,Curve:{createLine:(a,b)=>({a,b}),createRectangle:rect=>({rect}),createEllipse:ellipse=>({ellipse})}},
    '/nodes.js':{ContainerNodeDefinition:{create:name=>{records.groups.push(name);return{name};}},PolyCurveNodeDefinition:{create:(poly,brush,stroke,line)=>{const d={poly,brush,stroke,line};records.definitions.push(d);return d;}}},
    '/commands.js':{
      AddChildNodesCommandBuilder:{create:()=>{const parts=[];return{setInsertionTarget(t){this.target=t;},addNode:d=>parts.push(d),addPolyCurveNode:d=>parts.push(d),createCommand:select=>({parts,select})};}},
      CompoundCommandBuilder:{create:()=>{const commands=[];return{addCommand(c){commands.push(c);return this;},createCommand:()=>({commands})};}},
      DocumentCommand:{createSetSelection:s=>({selection:s})},
    },
    '/fills.js':{FillDescriptor:{createNone:()=>({none:true}),createSolid:colour=>({colour})}},
    '/linestyle.js':{LineStyleDescriptor:{createDefault:weight=>({weight,lineStyle:{}})},LineType:{Dash:2}},
    '/colours.js':{RGB8:(r,g,b)=>new Colour(r,g,b)},'/units.js':{UnitType:{Pixel:5}},'affinity:common':{BlendMode:{Normal:0}},
  };
  const module={exports:{}};
  const context=vm.createContext({module,alert:message=>records.alerts.push(message),console:{error:message=>records.errors.push(message)},require:name=>{assert.ok(modules[name],name);return modules[name];}});
  const run=()=>vm.runInContext(script,context);
  const committed=()=>records.writes.filter(w=>!w.preview);
  const part=(name)=>records.definitions.filter(d=>d.userDescription==='Logo Grid / '+name).at(-1);
  return{records,doc,selection,run,committed,part,module};
}
test('Affinity pasted source runs its entry point without an external loader',()=>{const h=host();h.run();assert.equal(h.committed().length,1);assert.equal(h.records.dialogTitles[0],'Logo Grid Studio 2.1');assert.equal(h.records.columns,3);});
test('Affinity construction is grouped in one compound commit and restores the selection',()=>{const h=host({all:true});h.run();const command=h.committed()[0].c;assert.equal(command.commands.length,3);assert.equal(command.commands[0].parts[0].name,'Logo Grid / Paper / cobalt');assert.equal(command.commands[2].selection,h.selection);assert.equal(h.doc.selection,h.selection);assert.ok(h.part('Bézier trace'));assert.ok(h.part('Anchor markers'));assert.ok(h.part('Control handles'));assert.ok(h.part('Handle tips'));assert.ok(h.part('Dimension brackets'));assert.ok(h.part('Modular grid'));assert.ok(h.records.transforms.length);});
test('Affinity Cancel clears previews without committing',()=>{const h=host({cancel:true});h.run();assert.equal(h.committed().length,0);assert.equal(h.records.writes.filter(w=>w.preview).length,1);assert.ok(h.records.clears>=1);});
test('Affinity guides pass through the true cubic peak, not control points',()=>{const h=host();h.run();const guides=h.part('Edge guides').poly.parts;assert.ok(guides.some(l=>Math.abs(l.a.y-25)<1e-8&&Math.abs(l.b.y-25)<1e-8));assert.ok(!guides.some(l=>l.a.y===0&&l.b.y===0));});
test('Affinity deduplicates shared anchors and duplicate path alignments',()=>{const h=host({segments:[arch,arch]});h.run();assert.equal(h.part('Anchor markers').poly.parts.length,2);assert.equal(h.part('Edge guides').poly.parts.length,4);});
test('Affinity reads live shape and text curve interfaces without converting the document',()=>{for(const type of ['isShapeNode','isTextNode']){const h=host({type});h.run();assert.ok(h.part('Bézier trace'));assert.equal(h.committed().length,1);}});
test('Affinity skips earlier construction containers',()=>{const h=host({generated:true});h.run();assert.match(h.records.alerts[0],/No readable vector geometry/);assert.equal(h.records.writes.length,0);});
test('Affinity tangent spines are opt-in and faint, and span the construction frame',()=>{const standard=host();standard.run();assert.equal(standard.part('Tangent spines'),undefined);const h=host({override:{'Tangent spines':true}});h.run();const spine=h.part('Tangent spines');assert.equal(spine.stroke.colour.alpha,.1);assert.ok(spine.poly.parts.every(l=>Math.hypot(l.a.x-l.b.x,l.a.y-l.b.y)>=170));});
test('Affinity guide and circle strokes use supported dashed line descriptors',()=>{const h=host({override:{'Guide stroke':1}});h.run();assert.equal(h.part('Edge guides').line.lineStyle.type,2);assert.deepEqual(Array.from(h.part('Edge guides').line.lineStyle.dashPattern),[5,4]);});
test('Affinity palette changes preserve overrides and update the preview',()=>{const h=host({onDialog:(dlg,r)=>{const c=r.controls;c.Palette.selectedIndex=2;c.Palette.onValueChangedHandler();dlg.onControlValueChangedHandler();}});h.run();assert.equal(h.part('Bézier trace').stroke.colour.r,242);assert.equal(h.part('Bézier trace').stroke.colour.b,255);assert.equal(h.records.writes.filter(w=>w.preview).length,2);});
test('Affinity can turn preview off before confirming',()=>{const h=host({override:{'Preview on canvas':false}});h.run();assert.equal(h.records.writes.length,1);assert.equal(h.committed().length,1);});
test('Affinity host errors clear previews and do not commit',()=>{const h=host({fail:true});h.run();assert.match(h.records.alerts[0],/host failure/);assert.match(h.records.errors[0],/host failure/);assert.equal(h.committed().length,0);assert.ok(h.records.clears>=1);});
test('Affinity empty selection has an actionable error and no mutation',()=>{const h=host({selected:false});h.run();assert.match(h.records.alerts[0],/select your logo/);assert.equal(h.records.writes.length,0);});
test('Affinity circular arcs merge repeated fitted circles',()=>{const k=.5522847498307936,b={start:{x:100,y:0},c1:{x:100,y:k*100},c2:{x:k*100,y:100},end:{x:0,y:100}};const h=host({segments:[b,b],override:{'Fitted radius circles':true,'Largest radius':2}});h.run();const circles=h.part('Radius circles').poly.parts;assert.ok(circles.length>0&&circles.length<=3);assert.ok(circles.every(c=>Math.abs(c.ellipse.width-200)<5));assert.ok(h.part('Circle centers'));});

test('Affinity no-document launch shows a visible instruction and makes no changes',()=>{const h=host({documentOpen:false});h.run();assert.equal(h.records.alerts.length,1);assert.match(h.records.alerts[0],/no document is open/);assert.equal(h.records.writes.length,0);assert.equal(h.records.definitions.length,0);});

test('Affinity preview is drawn before the dialog opens and changes redraw the canvas',()=>{const h=host({onDialog:(dlg,r)=>{assert.equal(r.writes.filter(w=>w.preview).length,1);r.controls['Guide opacity (%)'].value=30;dlg.onControlValueChangedHandler();assert.equal(r.writes.filter(w=>w.preview).length,2);}});h.run();assert.equal(h.part('Edge guides').stroke.colour.alpha,.3);assert.equal(h.committed().length,1);});
test('Affinity source can run twice in the same Script Editor context',()=>{const h=host();h.run();h.run();assert.equal(h.committed().length,2);});

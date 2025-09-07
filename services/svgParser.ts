import type { Point, Handle, SVGPathData, ParsedSVG, PathSegment } from '../types';

export const segmentsToD = (segments: PathSegment[]): string => {
    return segments.map(seg => seg.command + seg.values.join(' ')).join('');
}

export const parseSVG = (svgContent: string): ParsedSVG => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');
  const svgElement = doc.querySelector('svg');
  
  if (!svgElement) {
    throw new Error('No SVG element found in the provided file.');
  }

  const viewBoxAttr = svgElement.getAttribute('viewBox');
  const widthAttr = svgElement.getAttribute('width');
  const heightAttr = svgElement.getAttribute('height');
  const pathElements = Array.from(svgElement.querySelectorAll('path'));

  let viewBox: number[] = [];
  if (viewBoxAttr) {
    viewBox = viewBoxAttr.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
  }

  let width = parseFloat(widthAttr || '0') || (viewBox[2] || 0);
  let height = parseFloat(heightAttr || '0') || (viewBox[3] || 0);
  let finalViewBox = viewBoxAttr;

  // If dimensions are still zero, and there's content, calculate from bounding box
  if ((width === 0 || height === 0) && pathElements.length > 0) {
    const tempSvg = svgElement.cloneNode(true) as SVGSVGElement;
    tempSvg.removeAttribute('width');
    tempSvg.removeAttribute('height');
    tempSvg.removeAttribute('viewBox');
    tempSvg.style.position = 'absolute';
    tempSvg.style.visibility = 'hidden';
    
    document.body.appendChild(tempSvg);
    try {
      const bbox = tempSvg.getBBox();
      if (bbox.width > 0 && bbox.height > 0) {
        const padding = Math.max(bbox.width, bbox.height) * 0.05; // 5% padding
        const newWidth = bbox.width + padding * 2;
        const newHeight = bbox.height + padding * 2;
        width = newWidth;
        height = newHeight;
        finalViewBox = `${bbox.x - padding} ${bbox.y - padding} ${newWidth} ${newHeight}`;
      }
    } catch (e) {
      console.error("Could not calculate bounding box for SVG:", e);
    } finally {
      document.body.removeChild(tempSvg);
    }
  }
  
  // If still no dimensions (e.g., empty SVG), provide a default size
  if (width === 0 || height === 0) {
      width = 100;
      height = 100;
  }
  
  if (!finalViewBox) {
    finalViewBox = `0 0 ${width} ${height}`;
  }

  const paths: SVGPathData[] = pathElements.map(pathEl => {
    const d = pathEl.getAttribute('d') || '';
    const { points, handles, segments } = parsePathD(d);
    return {
      d,
      points,
      handles,
      segments,
      boundingBox: null, // BBox will be calculated later in a useEffect
    };
  });
  
  return {
    rawSVG: svgContent,
    viewBox: finalViewBox,
    width,
    height,
    paths,
  };
};


export const parsePathD = (d: string): { points: Point[], handles: Handle[], segments: PathSegment[] } => {
  const points: Point[] = [];
  const handles: Handle[] = [];
  const segments: PathSegment[] = [];

  let currentPoint: Point = { x: 0, y: 0 };
  let subpathStart: Point = { x: 0, y: 0 };
  let lastControl: Point | null = null;

  const commands = d.match(/[a-zA-Z][^a-zA-Z]*/g) || [];

  for (const commandStr of commands) {
    const rawCommand = commandStr[0];
    const isRelative = rawCommand === rawCommand.toLowerCase();
    const command = rawCommand.toUpperCase();
    
    const args = commandStr.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    const newSegment: PathSegment = { command: command, values: [] };

    switch (command) {
      case 'M': {
        const [x, y] = [args[0], args[1]];
        currentPoint.x = isRelative ? currentPoint.x + x : x;
        currentPoint.y = isRelative ? currentPoint.y + y : y;
        subpathStart = { ...currentPoint };
        points.push({ ...currentPoint });
        newSegment.values.push(currentPoint.x, currentPoint.y);
        lastControl = null;

        // Handle implicit Lineto commands
        if(args.length > 2) {
            segments.push(newSegment);
            for(let i=2; i<args.length; i+=2) {
                const lSegment: PathSegment = { command: 'L', values: [] };
                currentPoint.x = isRelative ? currentPoint.x + args[i] : args[i];
                currentPoint.y = isRelative ? currentPoint.y + args[i+1] : args[i+1];
                points.push({...currentPoint});
                lSegment.values.push(currentPoint.x, currentPoint.y);
                segments.push(lSegment);
            }
            continue; // Skip pushing segment at the end
        }
        break;
      }
      case 'L': {
        const [x, y] = [args[0], args[1]];
        currentPoint.x = isRelative ? currentPoint.x + x : x;
        currentPoint.y = isRelative ? currentPoint.y + y : y;
        points.push({ ...currentPoint });
        newSegment.values.push(currentPoint.x, currentPoint.y);
        lastControl = null;
        break;
      }
      case 'H': {
        const x = args[0];
        currentPoint.x = isRelative ? currentPoint.x + x : x;
        points.push({ ...currentPoint });
        newSegment.command = 'L'; // Convert H to L for easier processing
        newSegment.values.push(currentPoint.x, currentPoint.y);
        lastControl = null;
        break;
      }
      case 'V': {
        const y = args[0];
        currentPoint.y = isRelative ? currentPoint.y + y : y;
        points.push({ ...currentPoint });
        newSegment.command = 'L'; // Convert V to L for easier processing
        newSegment.values.push(currentPoint.x, currentPoint.y);
        lastControl = null;
        break;
      }
      case 'C': {
        const [x1, y1, x2, y2, x, y] = args;
        const p1 = { x: isRelative ? currentPoint.x + x1 : x1, y: isRelative ? currentPoint.y + y1 : y1 };
        const p2 = { x: isRelative ? currentPoint.x + x2 : x2, y: isRelative ? currentPoint.y + y2 : y2 };
        const pEnd = { x: isRelative ? currentPoint.x + x : x, y: isRelative ? currentPoint.y + y : y };
        
        handles.push({ start: currentPoint, end: p1, segmentIndex: segments.length, valueIndex: 0 });
        handles.push({ start: pEnd, end: p2, segmentIndex: segments.length, valueIndex: 2 });
        
        currentPoint = pEnd;
        points.push({ ...currentPoint });
        newSegment.values.push(p1.x, p1.y, p2.x, p2.y, pEnd.x, pEnd.y);
        lastControl = p2;
        break;
      }
       case 'S': {
        const [x2, y2, x, y] = args;
        const p1 = lastControl ? { x: 2 * currentPoint.x - lastControl.x, y: 2 * currentPoint.y - lastControl.y } : { ...currentPoint };
        const p2 = { x: isRelative ? currentPoint.x + x2 : x2, y: isRelative ? currentPoint.y + y2 : y2 };
        const pEnd = { x: isRelative ? currentPoint.x + x : x, y: isRelative ? currentPoint.y + y : y };

        newSegment.command = 'C'; // Convert S to C
        
        handles.push({ start: currentPoint, end: p1, segmentIndex: segments.length, valueIndex: 0 });
        handles.push({ start: pEnd, end: p2, segmentIndex: segments.length, valueIndex: 2 });

        currentPoint = pEnd;
        points.push({ ...currentPoint });
        newSegment.values.push(p1.x, p1.y, p2.x, p2.y, pEnd.x, pEnd.y);
        lastControl = p2;
        break;
      }
      case 'Q': {
        const [x1, y1, x, y] = args;
        const p1 = { x: isRelative ? currentPoint.x + x1 : x1, y: isRelative ? currentPoint.y + y1 : y1 };
        const pEnd = { x: isRelative ? currentPoint.x + x : x, y: isRelative ? currentPoint.y + y : y };
        
        handles.push({ start: currentPoint, end: p1, segmentIndex: segments.length, valueIndex: 0 });
        // For quadratic, both handles point to the same control point.
        // We link the draggable visual to the first control point.
        // A full conversion to cubic might be better, but this works for visualization and interaction.
        handles.push({ start: pEnd, end: p1, segmentIndex: segments.length, valueIndex: 0 });

        currentPoint = pEnd;
        points.push({ ...currentPoint });
        newSegment.values.push(p1.x, p1.y, pEnd.x, pEnd.y);
        lastControl = p1;
        break;
      }
       case 'T': {
        const [x, y] = args;
        const p1 = lastControl ? { x: 2 * currentPoint.x - lastControl.x, y: 2 * currentPoint.y - lastControl.y } : { ...currentPoint };
        const pEnd = { x: isRelative ? currentPoint.x + x : x, y: isRelative ? currentPoint.y + y : y };

        newSegment.command = 'Q'; // Convert T to Q
        
        handles.push({ start: currentPoint, end: p1, segmentIndex: segments.length, valueIndex: 0 });
        handles.push({ start: pEnd, end: p1, segmentIndex: segments.length, valueIndex: 0 });

        currentPoint = pEnd;
        points.push({ ...currentPoint });
        newSegment.values.push(p1.x, p1.y, pEnd.x, pEnd.y);
        lastControl = p1;
        break;
      }
      case 'Z':
        currentPoint = subpathStart;
        lastControl = null;
        newSegment.values = [];
        break;
      default:
        continue;
    }
    segments.push(newSegment);
  }

  return { points, handles, segments };
};
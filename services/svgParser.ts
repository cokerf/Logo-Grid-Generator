
import type { Point, Handle, SVGPathData, ParsedSVG } from '../types';

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

  let viewBox: number[] = [0, 0, 0, 0];
  if (viewBoxAttr) {
    viewBox = viewBoxAttr.split(/[\s,]+/).map(Number);
  }

  const width = parseFloat(widthAttr || '0') || (viewBox[2] || 0);
  const height = parseFloat(heightAttr || '0') || (viewBox[3] || 0);
  
  if (width === 0 || height === 0) {
      if(viewBox[2] && viewBox[3]) {
        // Fallback to viewbox dimensions
      } else {
        throw new Error('SVG has no dimensions (width/height or viewBox).');
      }
  }

  const finalViewBox = viewBoxAttr || `0 0 ${width} ${height}`;

  const pathElements = Array.from(svgElement.querySelectorAll('path'));

  const paths: SVGPathData[] = pathElements.map(pathEl => {
    const d = pathEl.getAttribute('d') || '';
    const { points, handles } = parsePathD(d);
    return {
      d,
      points,
      handles,
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


const parsePathD = (d: string): { points: Point[], handles: Handle[] } => {
  const points: Point[] = [];
  const handles: Handle[] = [];
  let currentPoint: Point = { x: 0, y: 0 };
  let startPoint: Point = { x: 0, y: 0 };

  const commands = d.match(/[a-zA-Z][^a-zA-Z]*/g) || [];

  for (const commandStr of commands) {
    const command = commandStr[0];
    const args = commandStr.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    
    const isRelative = command === command.toLowerCase();

    const processPoints = (numCoords: number, isMove: boolean = false) => {
        for (let i = 0; i < args.length; i += numCoords) {
            const pointArgs = args.slice(i, i + numCoords);
            if(pointArgs.length < numCoords) continue;

            const targetPoint: Point = {
                x: pointArgs[numCoords-2],
                y: pointArgs[numCoords-1]
            };
            
            if (isRelative) {
                targetPoint.x += currentPoint.x;
                targetPoint.y += currentPoint.y;
            }

            if(isMove) {
                 currentPoint = targetPoint;
                 startPoint = currentPoint;
                 points.push(currentPoint);
                 continue;
            }
            
            switch (command.toUpperCase()) {
                case 'L':
                case 'H':
                case 'V':
                     points.push(targetPoint);
                     break;

                case 'C': {
                    const h1: Point = { x: pointArgs[0], y: pointArgs[1] };
                    const h2: Point = { x: pointArgs[2], y: pointArgs[3] };

                    if(isRelative) {
                        h1.x += currentPoint.x; h1.y += currentPoint.y;
                        h2.x += currentPoint.x; h2.y += currentPoint.y;
                    }

                    points.push(targetPoint);
                    handles.push({ start: currentPoint, end: h1 });
                    handles.push({ start: targetPoint, end: h2 });
                    break;
                }
                case 'S': {
                    const lastCmd = commands[i-1]?.[0].toUpperCase();
                    const prevHandle = (lastCmd === 'C' || lastCmd === 'S') ? handles[handles.length - 1].end : currentPoint;
                    const h1 = { x: 2 * currentPoint.x - prevHandle.x, y: 2 * currentPoint.y - prevHandle.y };
                    const h2 = { x: pointArgs[0], y: pointArgs[1] };

                     if(isRelative) {
                        h2.x += currentPoint.x; h2.y += currentPoint.y;
                    }

                    points.push(targetPoint);
                    handles.push({ start: currentPoint, end: h1 });
                    handles.push({ start: targetPoint, end: h2 });
                    break;
                }
                 case 'Q': {
                    const h1: Point = { x: pointArgs[0], y: pointArgs[1] };
                    if(isRelative) {
                        h1.x += currentPoint.x; h1.y += currentPoint.y;
                    }
                    points.push(targetPoint);
                    handles.push({ start: currentPoint, end: h1 });
                    handles.push({ start: targetPoint, end: h1 }); // Quadratic handles are the same point
                    break;
                }
            }
            currentPoint = targetPoint;
        }
    }
    
    switch (command.toUpperCase()) {
      case 'M':
        processPoints(2, true);
        break;
      case 'L':
      case 'T':
        processPoints(2);
        break;
      case 'H': {
          let lastX = currentPoint.x;
          for (const arg of args) {
              const target = {x: isRelative ? lastX + arg : arg, y: currentPoint.y};
              points.push(target);
              lastX = target.x;
          }
          currentPoint.x = lastX;
        break;
      }
      case 'V':{
          let lastY = currentPoint.y;
          for (const arg of args) {
              const target = {x: currentPoint.x, y: isRelative ? lastY + arg : arg};
              points.push(target);
              lastY = target.y;
          }
          currentPoint.y = lastY;
        break;
      }
      case 'C':
        processPoints(6);
        break;
      case 'S':
      case 'Q':
        processPoints(4);
        break;
      case 'Z':
        currentPoint = startPoint;
        break;
    }
  }

  return { points, handles };
};

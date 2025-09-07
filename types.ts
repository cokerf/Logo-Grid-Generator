export interface Point {
  x: number;
  y: number;
}

export interface PathSegment {
    command: string;
    values: number[];
}

export interface Handle {
  start: Point;
  end: Point;
  segmentIndex: number;
  valueIndex: number; // index of the x-coordinate of the handle point in the segment's values array
}

export interface SVGPathData {
  d: string;
  points: Point[];
  handles: Handle[];
  segments: PathSegment[];
  boundingBox: SVGRect | null;
}

export interface ParsedSVG {
  rawSVG: string;
  viewBox: string;
  width: number;
  height: number;
  paths: SVGPathData[];
}

export interface CustomizationOptions {
  showFill: boolean;
  path: {
    stroke: string;
    strokeWidth: number;
  };
  anchors: {
    color: string;
    size: number;
  };
  handles: {
    color: string;
    width: number;
  };
  outlines: {
    color: string;
    width: number;
    style: 'solid' | 'dashed';
  };
  gridlines: {
    color: string;
    width: number;
  };
  canvasBackground: string;
}
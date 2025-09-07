
export interface Point {
  x: number;
  y: number;
}

export interface Handle {
  start: Point;
  end: Point;
}

export interface SVGPathData {
  d: string;
  points: Point[];
  handles: Handle[];
  boundingBox: SVGRect | null;
}

export interface ParsedSVG {
  rawSVG: string;
  viewBox: string;
  width: number;
  height: number;
  paths: SVGPathData[];
}

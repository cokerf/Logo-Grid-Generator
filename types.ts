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

export type Theme = 'light' | 'dark';

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
}

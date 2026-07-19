export type EditorTool = 'select' | 'text' | 'label' | 'rect' | 'arrow' | 'blur' | 'crop';

/** All coordinates/sizes are in source-image pixel space (scaled for display, drawn 1:1 at export). */
export interface TextAnnotation {
  id: string;
  kind: 'text';
  /** Top-left corner of the text box. */
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
}

export interface LabelAnnotation {
  id: string;
  kind: 'label';
  /** Center of the numbered badge. */
  x: number;
  y: number;
  value: number;
  radius: number;
  color: string;
}

export interface RectAnnotation {
  id: string;
  kind: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  strokeWidth: number;
}

export interface ArrowAnnotation {
  id: string;
  kind: 'arrow';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  strokeWidth: number;
}

export interface BlurAnnotation {
  id: string;
  kind: 'blur';
  x: number;
  y: number;
  width: number;
  height: number;
}

export type CaptureAnnotation =
  TextAnnotation | LabelAnnotation | RectAnnotation | ArrowAnnotation | BlurAnnotation;

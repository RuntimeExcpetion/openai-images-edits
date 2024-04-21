export interface DrawCommand {
  type:  'line' | 'circle' | 'rect';
  params: any;
}

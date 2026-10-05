/**
 * Hand-written ambient types for `qrcode-generator`.
 *
 * The package ships no TypeScript definitions and we would rather not add a
 * second dependency (`@types/qrcode-generator`) for ~40 lines of typing.
 */
declare module 'qrcode-generator' {
  export type TypeNumber =
    | 0
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8
    | 9
    | 10
    | 11
    | 12
    | 13
    | 14
    | 15
    | 16
    | 17
    | 18
    | 19
    | 20
    | 21
    | 22
    | 23
    | 24
    | 25
    | 26
    | 27
    | 28
    | 29
    | 30
    | 31
    | 32
    | 33
    | 34
    | 35
    | 36
    | 37
    | 38
    | 39
    | 40;

  export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

  export interface QRCodeModel {
    addData(data: string, mode?: string): void;
    make(): void;
    getModuleCount(): number;
    isDark(row: number, col: number): boolean;
    createImgTag(cellSize?: number, margin?: number, alt?: string): string;
    createSvgTag(cellSize?: number, margin?: number): string;
    createDataURL(cellSize?: number, margin?: number): string;
    createASCII(cellSize?: number, margin?: number): string;
    renderTo2dContext(context: CanvasRenderingContext2D, cellSize?: number): void;
  }

  function qrcode(typeNumber: TypeNumber, errorCorrectionLevel: ErrorCorrectionLevel): QRCodeModel;

  export default qrcode;
}

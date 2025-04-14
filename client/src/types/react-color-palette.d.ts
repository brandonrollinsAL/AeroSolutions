declare module 'react-color-palette' {
  export interface IColor {
    hex: string;
    rgb: { r: number; g: number; b: number };
    hsv: { h: number; s: number; v: number };
  }

  export interface IColorPickerProps {
    width?: number;
    height?: number;
    color: IColor;
    onChange: (color: IColor) => void;
    hideHSV?: boolean;
    hideRGB?: boolean;
    dark?: boolean;
  }

  export function ColorPicker(props: IColorPickerProps): JSX.Element;
  export function useColor(mode: 'hex' | 'rgb' | 'hsv', initialValue: string | { r: number; g: number; b: number } | { h: number; s: number; v: number }): [IColor, (color: IColor) => void];
}
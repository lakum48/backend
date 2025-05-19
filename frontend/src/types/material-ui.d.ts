import { Theme } from '@mui/material/styles';
import { SxProps } from '@mui/system';

declare module '@mui/material/Grid' {
  interface GridProps {
    item?: boolean;
    container?: boolean;
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    spacing?: number;
    sx?: SxProps<Theme>;
  }
}

declare module '@mui/material/styles' {
  interface Theme {
    status: {
      danger: string;
    };
  }
  interface ThemeOptions {
    status?: {
      danger?: string;
    };
  }
} 
/** 24×24 stroke paths for the workday knob and its pockets. */
export const ICONS = {
  arrow: 'M8 3l9 9-9 9',
  play: 'M8.5 4.5v15l12-7.5z',
  lunch:
    'M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 11h1.5a2.5 2.5 0 0 1 0 5H17M8 3.5V6M12.5 3.5V6',
  office: 'M5 21V4h10v17M15 10h4v11M3 21h18M8.5 8h3M8.5 12h3M8.5 16h3',
} as const;

export type Icon = keyof typeof ICONS;

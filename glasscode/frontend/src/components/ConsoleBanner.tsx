"use client";
import { useEffect } from 'react';

export default function ConsoleBanner() {
  useEffect(() => {
    try {
      const title = 'Erik Veland';
      const art = [
        '     ______     ______     __     __  __                         ',
        '    /\\  ___\\   /\\  == \\   /\\ \\   /\\ \\/ /                         ',
        '    \\ \\  __\\   \\ \\  __<   \\ \\ \\  \\ \\  _"-.                       ',
        '     \\ \\_____\\  \\ \\_\\ \\_\\  \\ \\_\\  \\ \\_\\ \\_\\                      ',
        '      \\/_____/   \\/_/ /_/   \\/_/   \\/_/\\/_/                      ',
        '                                                                 ',
        '  __   __   ______     __         ______     __   __     _____   ',
        ' /\\ \\ / /  /\\  ___\\   /\\ \\       /\\  __ \\   /\\ "-.\\ \\   /\\  __-. ',
        ' \\ \\ \'/   \\ \\  __\\   \\ \\ \\____  \\ \\  __ \\  \\ \\ \\-.  \\  \\ \\ \\/\\ \\ ',
        '  \\ \\__|    \\ \\_____\\  \\ \\_____\\  \\ \\_\\ \\_\\  \\ \\_\\\"\\_\\  \\ \\____- ',
        '   \\/_/      \\/_____/   \\/_____/   \\/_/\\/_/   \\/_/ \\/_/   \\/____/ '
      ].join('\n');
      const headStyle = 'color:#4F46E5; font-weight:800; font-size:16px;';
      const artStyle = 'color:#22C55E; font-family:monospace; font-size:12px; line-height:12px;';
      const badgeStyle = 'color:#fff; background:#0EA5E9; font-weight:700; padding:2px 6px; border-radius:6px;';
      console.groupCollapsed('%c Author', headStyle);
      console.log('%c' + art, artStyle);
      console.log('%c ' + title + ' ', badgeStyle);
      console.groupEnd();
    } catch {}
  }, []);
  return null;
}
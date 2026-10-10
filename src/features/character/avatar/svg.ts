import { AVATAR_HEIGHT, AVATAR_WIDTH, type Direction } from './pose';

type Attrs = Record<string, string | number>;

const toAttrs = (attrs: Attrs): string =>
  Object.entries(attrs)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');

export const el = (tag: string, attrs: Attrs): string => `<${tag} ${toAttrs(attrs)}/>`;

export const group = (attrs: Attrs, children: readonly string[]): string =>
  `<g ${toAttrs(attrs)}>${children.join('')}</g>`;

/** Side poses are drawn facing left; facing right is the same drawing mirrored. */
export function orient(direction: Direction, markup: string): string {
  return direction === 'right' ? group({ transform: `matrix(-1 0 0 1 ${AVATAR_WIDTH} 0)` }, [markup]) : markup;
}

export function svgDocument(inner: string, viewBox = `0 0 ${AVATAR_WIDTH} ${AVATAR_HEIGHT}`): string {
  const [, , width, height] = viewBox.split(' ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">${inner}</svg>`;
}

export function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * The room's hand-drawn look at character scale: every line gets a gentle wobble from a
 * fixed noise field. Body and hat layers share the field, so they wobble identically and
 * stay aligned, and the seed never changes, so lines don't "boil" between frames.
 */
export function handDrawn(inner: string): string {
  return (
    '<defs><filter id="hand-drawn" x="-10%" y="-10%" width="120%" height="120%">' +
    '<feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="4" result="noise"/>' +
    '<feDisplacementMap in="SourceGraphic" in2="noise" scale="2.6" xChannelSelector="R" yChannelSelector="G"/>' +
    '</filter></defs>' +
    group({ filter: 'url(#hand-drawn)' }, [inner])
  );
}

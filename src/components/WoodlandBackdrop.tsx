/** Decorative sunny forest behind the menus, drawn in the same inked style as The Dam. */

const INK = '#2a1d17';
const FAR_PINES = [40, 140, 230, 330, 450, 560, 650, 760, 880, 990, 1090, 1190, 1290, 1390];
const NEAR_PINES = [-20, 120, 300, 470, 1010, 1180, 1340, 1460];
const CLOUDS = [
  { top: '9%', scale: 1, duration: '70s', delay: '-10s' },
  { top: '20%', scale: 0.7, duration: '95s', delay: '-50s' },
  { top: '4%', scale: 0.55, duration: '120s', delay: '-80s' },
];

function pine(x: number, base: number, height: number): string {
  const w = height * 0.36;
  return `M${x} ${base - height} L${x + w * 0.55} ${base - height * 0.62} L${x + w * 0.3} ${base - height * 0.62} L${x + w} ${base - height * 0.22} L${x + w * 0.2} ${base - height * 0.22} L${x + w * 0.2} ${base} L${x - w * 0.2} ${base} L${x - w * 0.2} ${base - height * 0.22} L${x - w} ${base - height * 0.22} L${x - w * 0.3} ${base - height * 0.62} L${x - w * 0.55} ${base - height * 0.62} Z`;
}

export function WoodlandBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="menu-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1d5fae" />
            <stop offset="0.55" stopColor="#4aa3e0" />
            <stop offset="1" stopColor="#a6dbf3" />
          </linearGradient>
          <filter id="menu-hand-drawn" x="-1%" y="-1%" width="102%" height="102%">
            <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="2" seed="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <linearGradient id="menu-river" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5cc4ea" />
            <stop offset="1" stopColor="#2f97cc" />
          </linearGradient>
        </defs>
        <rect width="1440" height="900" fill="url(#menu-sky)" />
        <g stroke={INK} strokeWidth="4" strokeLinejoin="round" filter="url(#menu-hand-drawn)">
          <circle cx="1180" cy="260" r="62" fill="#fff6c4" />
          <path d="M-10 560 Q240 470 480 540 T960 520 T1450 530 V900 H-10 Z" fill="#8fd468" />
          <g fill="#3fa45f">
            {FAR_PINES.map((x, i) => (
              <path key={x} d={pine(x, 640, 170 + ((i * 37) % 60))} />
            ))}
          </g>
          <rect x="-10" y="630" width="1460" height="280" fill="#6cc256" />
          <rect x="-10" y="760" width="1460" height="150" fill="url(#menu-river)" />
          <g fill="#2f8a4c">
            {NEAR_PINES.map((x, i) => (
              <path key={x} d={pine(x, 780, 330 + ((i * 53) % 90))} />
            ))}
          </g>
        </g>
        <g stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.75" fill="none">
          <path
            className="animate-[river_6s_ease-in-out_infinite_alternate]"
            d="M-200 810 h70 M200 840 h90 M620 805 h60 M1000 850 h80 M1300 815 h70"
          />
        </g>
      </svg>
      {CLOUDS.map((cloud) => (
        <svg
          key={cloud.top}
          viewBox="0 0 220 90"
          className="absolute -left-60 w-56 animate-[drift_linear_infinite]"
          style={{ top: cloud.top, scale: cloud.scale, animationDuration: cloud.duration, animationDelay: cloud.delay }}
        >
          <path
            d="M40 84 Q12 84 14 64 Q16 46 40 48 Q46 18 80 20 Q100 2 128 16 Q160 8 168 40 Q196 38 200 60 Q204 84 176 84 Z"
            fill="#fff"
            stroke={INK}
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  );
}

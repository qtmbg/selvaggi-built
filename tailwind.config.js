module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      colors: {
        // rgb(<channels> / <alpha-value>) rather than var(--ebony): Tailwind can
        // substitute <alpha-value> here, so slash-opacity utilities like
        // text-ebony/80 and border-copper/40 actually generate a rule. Pointing
        // these at a hex var() emitted nothing at all for ~130 usages.
        // Plain rgb() keeps support universal; color-mix() would not.
        ebony: 'rgb(var(--ebony-rgb) / <alpha-value>)',
        slate: 'rgb(var(--slate-rgb) / <alpha-value>)',
        stone: 'rgb(var(--stone-rgb) / <alpha-value>)',
        copper: 'rgb(var(--copper-rgb) / <alpha-value>)',
        ivory: 'rgb(var(--ivory-rgb) / <alpha-value>)',
        white: 'rgb(var(--white-rgb) / <alpha-value>)',
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      letterSpacing: {
        tighter: '-0.015em',
        subhead: '0.08em',
        caption: '0.1em',
        logo: '0.02em',
      }
    }
  }
}

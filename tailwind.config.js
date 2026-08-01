module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      colors: {
        ebony: 'var(--ebony)',
        slate: 'var(--slate)',
        stone: 'var(--stone)',
        copper: 'var(--copper)',
        ivory: 'var(--ivory)',
        white: 'var(--white)',
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

module.exports = {
  content: ['./index.html', './js/**/*.js'],
  theme: { extend: {
    colors: { ink: '#102b32', forest: '#0b6e4f', forestDark: '#07543c', mint: '#e8f6ed', cream: '#f7faf7', line: '#d8e8df', muted: '#526c70' },
    fontFamily: { sans: ['Inter', 'Arial', 'sans-serif'], display: ['Manrope', 'Inter', 'sans-serif'] },
    boxShadow: { card: '0 14px 40px rgba(16,43,50,.08)', lift: '0 22px 52px rgba(16,43,50,.15)' }
  }},
};

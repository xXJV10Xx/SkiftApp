/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './frontend/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Skiftlag färger
        'shift-red': '#FF6B6B',
        'shift-teal': '#4ECDC4',
        'shift-blue': '#45B7D1',
        'shift-green': '#96CEB4',
        'shift-yellow': '#FFEAA7',
        'shift-purple': '#DDA0DD',
        'shift-orange': '#FFB347',
        'shift-lightblue': '#87CEEB',
        
        // Skifttyp färger
        'day-shift': '#4CAF50',
        'evening-shift': '#FF9800',
        'night-shift': '#3F51B5',
        'weekend-shift': '#9C27B0',
        
        // Status färger
        'standby': '#F44336',
        'overtime': '#795548',
        'vacation': '#E0E0E0',
        'sick': '#FFCDD2',
        'free': '#F5F5F5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      minHeight: {
        '24': '6rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
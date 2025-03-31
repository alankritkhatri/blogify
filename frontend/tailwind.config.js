/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0766FF',
        'primary-dark': '#0550CC',
        'primary-orange': '#FF9E00',
        'secondary-orange': '#FF8B00',
        background: {
          light: '#F8F8F8',
          DEFAULT: '#FFFFFF',
        },
        text: {
          primary: '#333333',
          secondary: '#555555',
          light: '#777777',
        }
      },
      boxShadow: {
        'navbar': '0 2px 4px rgba(0,0,0,0.04)',
        'card': '0 4px 8px rgba(0,0,0,0.05)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 }
        }
      }
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
    },
  },
  plugins: [],
}; 
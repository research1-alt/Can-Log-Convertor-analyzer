/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#00529B',
        'brand-secondary': '#00A4E4',
        'brand-light': '#F0F8FF',
        'warning-bg': '#FFFBEB',
        'warning-text': '#B45309',
        'warning-border': '#FDE68A',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.4s ease-out forwards',
        'typing-dot': 'typing 1.4s infinite ease-in-out both',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        typing: {
          '0%, 80%, 100%': { transform: 'scale(0)', opacity: '0' },
          '40%': { transform: 'scale(1.0)', opacity: '1' },
        }
      }
    }
  },
  plugins: [],
}

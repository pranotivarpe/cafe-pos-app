module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        pos: {
          red: {
            50: '#fef2f2',
            500: '#f87171',  // Soft table red
            600: '#ef4444',
            700: '#dc2626'
          },
          white: '#ffffff',
          gray: {
            50: '#f9fafb',
            100: '#f3f4f6',
            400: '#9ca3af',
            600: '#4b5563',
            900: '#111827'
          }
        }
      },
      fontFamily: {
        sans: ['"Inter"', '"Segoe UI"', 'sans-serif']
      }
    }
  },
  plugins: [],
}

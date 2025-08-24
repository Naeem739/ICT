/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'body': ['Roboto', 'Open Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        'heading': ['Montserrat', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        'mono': ['Fira Code', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
        'sans': ['Roboto', 'Open Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.25' }],      // 12px
        'sm': ['0.875rem', { lineHeight: '1.5' }],      // 14px
        'base': ['1rem', { lineHeight: '1.75' }],       // 16px
        'lg': ['1.125rem', { lineHeight: '1.75' }],     // 18px
        'xl': ['1.25rem', { lineHeight: '1.25' }],      // 20px
        '2xl': ['1.5rem', { lineHeight: '1.25' }],      // 24px
        '3xl': ['1.875rem', { lineHeight: '1.25' }],    // 30px
        '4xl': ['2.25rem', { lineHeight: '1.25' }],     // 36px
        '5xl': ['3rem', { lineHeight: '1.25' }],        // 48px
      },
      fontWeight: {
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'extrabold': '800',
      },
    },
  },
  plugins: [],
}

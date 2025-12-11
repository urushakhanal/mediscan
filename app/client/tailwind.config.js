/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
            colors: {
                primary: '#0ea5e9',
                'primary-light': '#67e8f9',
                'primary-dark': '#0284c7',
                secondary: '#22c55e',
                'secondary-dark': '#16a34a',
            },
        },
    },
    plugins: [],
};

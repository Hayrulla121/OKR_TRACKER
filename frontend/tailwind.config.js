/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'below': '#d9534f',
                'meets': '#f0ad4e',
                'good': '#5cb85c',
                'very-good': '#28a745',
                'exceptional': '#1e7b34',
            }
        },
    },
    plugins: [],
}
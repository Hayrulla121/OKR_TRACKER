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
                'primary': '#5A9CB5',
                'secondary': '#FAAC68',
                'accent-yellow': '#FACE68',
                'accent-red': '#FA6868',
            }
        },
    },
    plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  important: true,
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Be Vietnam Pro"', "sans-serif"],
      },
      colors: {
        shell: "#f3f5f9",
        ink: "#001529",
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(0, 21, 41, 0.25)",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  purge: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: false, // or 'media' or 'class'
  darkMode: "class",
  theme: {
    fontFamily: {
      display: ["Open Sans", "sans-serif"],
      body: ["Open Sans", "sans-serif"],
    },
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle at 24% 34%, rgba(39, 143, 43, 1) 21%, rgba(136, 255, 230, 1) 100%)',
        'gradient-radial-off': 'radial-gradient(circle at 27% 28%, rgba(128, 121, 217, 1) 0%, rgba(7, 58, 187, 1) 100%)',
      },
      backgroundColor: {
        "main-bg": "#FAFBFB",
        "main-dark-bg": "#20232A",
        "secondary-dark-bg": "#33373E",
      },
      borderWidth: {
        "0.1" : "0.1px",
      }
    },
  },
  plugins: [],
};

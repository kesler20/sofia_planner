const base = require("../tailwind.config.js");
const path = require("node:path");
module.exports = { ...base, content: [path.resolve(__dirname, "../src/**/*.{js,ts,jsx,tsx}"), path.resolve(__dirname, "./**/*.{html,ts,tsx}")] };

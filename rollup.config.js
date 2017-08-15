import eslint from "rollup-plugin-eslint";

export default {
    entry: "app/index.js",
    format: "iife",
    dest: "dist/bundle.js",
    plugins: [
        eslint()
    ]
};
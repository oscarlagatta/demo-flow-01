/** @type {import("prettier").Config} */
const config = {
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  printWidth: 80,
  endOfLine: 'lf',
  htmlWhitespaceSensitivity: 'css',
  tabWidth: 2,
  plugins: ['prettier-plugin-tailwindcss'],
};

export default config;

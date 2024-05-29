const fs = require('fs');
const path = require('path');

const colorVariables = path.resolve(__dirname + '/' + '../config/styles/variables/_colors.scss')

function extractRootVariables(file) {
  const scssFile = fs.readFileSync(file, 'utf-8'); // Read the CSS file

  // Regular expression to match CSS variables
  const regex = /--(.*?):\s*(.*?);/g;
  let match;
  const variables = {};

  // Extract variables
  while ((match = regex.exec(scssFile)) !== null) {
    variables[`--${match[1].trim()}`] = match[2].trim();
  }

  return variables;
}

function getThemeReplacementsValues() {
  const colorValues = extractRootVariables(colorVariables);

  const colorHexes = {...colorValues}; // Clone the first object
  return Object.keys(colorHexes)
    .reduce((map, key) => {
      return {
        ...map,
        [`var(${key})`]: colorHexes[key]
      }
    }, {})
}

module.exports = {
  extractRootVariables,
  getThemeReplacementsValues,
};

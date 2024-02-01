const fs = require('fs');
const path = require('path');

const colorUtilities = path.resolve(__dirname + '/' + '../config/styles/utilities/_colors.scss')
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
  const colorMappings = extractRootVariables(colorUtilities);

  const colorHexes = {...colorValues}; // Clone the first object
  for (const key in colorMappings) {
    if (colorMappings.hasOwnProperty(key)) {
      const varName = colorMappings[key].match(/\(([^)]+)\)/)[1]; // Extract the variable name
      if (varName && colorHexes[varName]) {
        colorHexes[key] = colorHexes[varName]; // Replace var(--variable) with actual value
      }
    }
  }
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

/* eslint-env node */
/* eslint-disable no-console */
const fs = require('fs');

const imagePath = 'app/icons';

const args = process.argv.slice(2);
if (args.length !== 2) {
  const prefix = 'node generate-svg-data.js';
  console.log(`Generates SVG data with given fill color from given file in ${imagePath}`);
  console.log('');
  console.log(`Usage:   ${prefix} <SVG FILENAME> <FILL COLOR>`);
  console.log(`Example: ${prefix} play.svg '#000000'`);
  process.exit(1);
}

const fileName = args[0];
const fillColor = args[1];
const placeholder = /\${fillColor}/gm;

const originalData = fs.readFileSync(`${imagePath}/${fileName}`, 'utf-8');
const transformedData = originalData.replace(placeholder, fillColor);

console.log('Transformed SVG:');
console.log(transformedData);

const uriEncodedData = encodeURIComponent(transformedData);
console.log('Put this in your CSS:');
console.log('');
console.log(`background-image: url('data:image/svg+xml,${uriEncodedData}');`);

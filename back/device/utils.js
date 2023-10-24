/**
 * Extracts a JSON object from a corrupted string that contains JSON within.
 *
 * @param {string} corruptedStr - The corrupted string with JSON data.
 * @returns {Object|null} The parsed JSON object if found, or null if not found or parsing fails.
 * @throws {SyntaxError} If the JSON within the string is not valid.
 *
 * @example
 * const corruptedString = 'Some text { "name": "John", "age": 30 } more text { "city": "New York" }';
 * const extractedJSON = extractCorruptedJSON(corruptedString);
 * if (extractedJSON !== null) {
 *   console.log('Extracted JSON:', extractedJSON);
 * } else {
 *   console.log('No valid JSON found.');
 * }
 */
function extractCorruptedJSON(corruptedStr){
  const corruptedString = corruptedStr;
  let jsonStart = -1;
  let openBrackets = 0;

  for (let i = 0; i < corruptedString.length; i++) {
    if (corruptedString[i] === '{') {
      if (openBrackets === 0) {
        jsonStart = i;
      }
      openBrackets++;
    } else if (corruptedString[i] === '}') {
      openBrackets--;
      if (openBrackets === 0 && jsonStart !== -1) {
        const jsonString = corruptedString.substring(jsonStart, i + 1);
        try {
          return JSON.parse(jsonString);
        } catch (error) {
          console.error('Error parsing JSON:', error);
          throw error;
        }
      }
    }
  }

  // If no valid JSON is found, return null
  return null;
}

/**
 * Extracts a JSON object from a corrupted string that contains JSON within.
 *
 * @param {string} corruptedStr - The corrupted string with JSON data.
 * @returns {Object[]|null} The parsed JSON object if found, or null if not found or parsing fails.
 * @throws {SyntaxError} If the JSON within the string is not valid.
 * @example
 * const corruptedString = 'Some text { "tuple": [ 5, 30 ] } more text';
 * const extractedJSON = extractCorruptedTuple(corruptedString);
 * if (extractedJSON !== null) {
 *  console.log('Extracted JSON:', extractedJSON);
 * } else {
 *  console.log('No valid JSON found.');
 * }
 * // Output:
 * // Extracted JSON: [ 5,  30 ]
 */
function  extractCorruptedTuple(corruptedStr){
  const corruptedString = corruptedStr;
  let jsonStart = -1;
  let openBrackets = 0;

  for (let i = 0; i < corruptedString.length; i++) {
    if (corruptedString[i] === '[') {
      if (openBrackets === 0) {
        jsonStart = i;
      }
      openBrackets++;
    } else if (corruptedString[i] === ']') {
      openBrackets--;
      if (openBrackets === 0 && jsonStart !== -1) {
        const jsonString = corruptedString.substring(jsonStart, i + 1);
        try {
          return JSON.parse(jsonString);
        } catch (error) {
          console.error('Error parsing JSON:', error);
          throw error;
        }
      }
    }
  }

  // If no valid JSON is found, return null
  return null;
}

module.exports = { extractCorruptedJSON, extractCorruptedTuple };
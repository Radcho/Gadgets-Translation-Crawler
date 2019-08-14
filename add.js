const fs = require('fs').promises;
const sortObject = require('./sort');

// Run the script.
main();

/**
 * Adds translations from a *translations.csv* file to all locales.
 */
async function main() {
    // Read the translation file and separate it into rows
    const translations = await fs.readFile('translations.csv',  { encoding: 'utf8' });
    const translationRows = translations.split(/\r?\n/).map((row) => {
        return separateRow(row);
    });

    // Shift the row containing language codes and asynchronously parse and write the translations.
    const languageRow = translationRows.shift().slice(1);
    await Promise.all(languageRow.map((language, columnIndex) => parseAndWriteTranslation(translationRows, language, columnIndex + 1)))
}

/**
 * Parses the translation file and writes the translations.
 *
 * @param {Array<Array<string>>} translationRows *translation.csv* file separated into rows.
 * @param {string} language Currently translated language.
 * @param {number} columnIndex Column index of the translated language in the *translation.csv* file.
 */
async function parseAndWriteTranslation(translationRows, language, columnIndex) {
    // Read the translation file and parse it into JSON.
    const fileName = `locales/${language}/translation.json`;
    const locale = await fs.readFile(fileName, { encoding: 'utf8' });
    const translation = JSON.parse(locale.trim());

    // Ignoring the first row, add the translated text into the translation file.
    translationRows.forEach((row, index) => {
        setValue(row[0], row[columnIndex], translation);
    });

    const sortedTranslation = sortObject(translation);
    // Overwrite the translation file and sort it alphabetically.
    await fs.writeFile(fileName, JSON.stringify(sortedTranslation, null, '\t'));
}

/**
 * Separates a csv row into columns based on commas. If a column is enclosed in quotes, the entire content is copied.
 *
 * @param {string} row Row of the csv table.
 * @returns {Array<string>} Properly separated array of columns.
 */
function separateRow(row) {
    const separated = [];
    let sticky = false;
    for (let section of row.split(',')) {
        if (sticky) {
            if (section.endsWith('"')) {
                sticky = false;
                section = section.substring(0, section.length - 1);
            }
            separated[separated.length - 1] += `,${section}`;
        } else {
            if (section.startsWith('"')) {
                section = section.substring(1);
                if (section.endsWith('"')) {
                    section = section.substring(0, section.length - 1);
                } else {
                    sticky = true;
                }
            }
            separated.push(section);
        }
    }

    return separated;
}

/**
 * Set the translated value into the JSON translation object.
 *
 * @param {string} key Name of the translation key. If the keys contains a `.`, the function recursively finds the key in the nested object.
 * @param {string} value Translated string.
 * @param {any} translation Translation JSON object.
 * @param {string | null} wholeKey The entire translation key. Only used for displaying missing keys.
 */
function setValue(key, value, translation, wholeKey = null) {
    if (wholeKey === null) {
        wholeKey = key;
    }
    if (key.indexOf('.') !== -1) {
        const splitKey = key.split('.');
        const subKey = splitKey.shift();
        const restOfKey = splitKey.join('.');
        if (translation[subKey] === undefined) {
            console.error(`Could not find the specified translation key: ${wholeKey}`);
            return;
        }
        setValue(restOfKey, value, translation[subKey], key);
    } else {
        translation[key] = value;
    }
}
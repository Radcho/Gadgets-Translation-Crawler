const fs = require('fs').promises;
const util = require('util');
const glob = util.promisify(require('glob'));
const sortObject = require('./sort');

const DEFAULT_LANGUAGE = 'en_us';
const LOCALES_FOLDER = 'locales';
const DEFAULT_TRANSLATION_FILE = `${LOCALES_FOLDER}/${DEFAULT_LANGUAGE}/translation.json`

main();

/**
 * Finds all translations from the default locale that are missing in all other locales. Generates a new file with the found translations.
 */
async function main() {
    const missingTranslations = new Set();

    const defaultTranslation = JSON.parse((await fs.readFile(DEFAULT_TRANSLATION_FILE, { encoding: 'utf8' })).trim());
    const files = await glob(`${LOCALES_FOLDER}/**/*.json`);

    const translationPromises = files
        .filter((file) => file.indexOf(DEFAULT_LANGUAGE) === -1)
        .map((file) => findTranslation(defaultTranslation, file, missingTranslations));

    await Promise.all([formatDefaultTranslation(defaultTranslation), ...translationPromises]);

    if (missingTranslations.size) {
        console.log('Missing translations:');
        let table = '';
        missingTranslations.forEach((key) => {
            console.log(`    ${key}`);
            table += `${key};"${getValue(key, defaultTranslation)}"\r\n`;
        });

        await fs.writeFile('missing.csv', table);
    }
}

/**
 * Process a specific locale and find the missing keys.
 *
 * @param {any} defaultTranslation The default locale.
 * @param {string} file The path to the locale to go through.
 * @param {Set<string>} missingTranslations Set containing all missing translations.
 */
async function findTranslation(defaultTranslation, file, missingTranslations) {
    const translation = JSON.parse((await fs.readFile(file, { encoding: 'utf8' })).trim());
    const sortedTranslation = sortObject(processTranslation(defaultTranslation, translation, missingTranslations));

    await fs.writeFile(file, JSON.stringify(sortedTranslation, null, '\t'));
}

/**
 * Sorts the default translation file.
 *
 * @param {any} defaultTranslation Default translation object.
 */
async function formatDefaultTranslation(defaultTranslation) {
    const sortedTranslation = sortObject(defaultTranslation);
    await fs.writeFile(DEFAULT_TRANSLATION_FILE, JSON.stringify(sortedTranslation, null, '\t'));
}

/**
 * Gets the default value of the compounded key.
 *
 * @param {string} key Key to find in the default translation.
 * @param {any} defaultTranslation Default translation object.
 * @returns {string} Default value of the key.
 */
function getValue(key, defaultTranslation) {
    let result = defaultTranslation;
    for (const sub of key.split('.')) {
        result = result[sub];
    }

    return result;
}

/**
 * Adds all keys from the source object into the missing translations set.
 *
 * @param {any} source Current source object with missing keys.
 * @param {string} path Path of keys from the root until the source object.
 * @param {Set<string>} missingTranslations Set containing all missing translations.
 */
function addMissingKeys(source, path, missingTranslations) {
    for (const key in source) {
        if (typeof source[key] === 'object') {
            addMissingKeys(source[key], `${path}${key}.`, missingTranslations);
        } else {
            missingTranslations.add(`${path}${key}`);
        }
    }
}

/**
 * Process a locale file, delete all target keys that are missing in the source file and find all missing keys that are not in the target file.
 *
 * @param {any} source Base locale for comparison. Usually the default locale.
 * @param {any} target Target locale for finding missing translations.
 * @param {Set<string>} missingTranslations Set containing all missing translations.
 * @param {string} [path=''] Path to the current key. Used for recursion.
 *
 * @returns {any} Processed translation file.
 */
function processTranslation(source, target, missingTranslations, path = '') {
    const sourceKeys = Object.keys(source);
    const targetKeys = Object.keys(target);
    targetKeys.filter((key) => sourceKeys.indexOf(key) === -1).forEach((key) => delete target[key]);

    const copy = Object.assign({}, target);

    sourceKeys.forEach((key) => {
        if (typeof source[key] === 'string' && typeof copy[key] !== 'string') {
            copy[key] = source[key];
            missingTranslations.add(path + key);
        } else if (typeof source[key] === 'object') {
            if (typeof copy[key] !== 'object') {
                copy[key] = source[key]
                addMissingKeys(source[key], path + key + '.', missingTranslations);
            } else {
                copy[key] = processTranslation(source[key], target[key], missingTranslations, path + key + '.');
            }
        }
    });

    return copy;
}

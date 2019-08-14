const util = require('util');
const rimraf = util.promisify(require('rimraf'));

// Run the script.
main();

/**
 * Cleans the `missing.csv`, `translations.csv` and `locales` files.
 */
async function main() {
    try {
        Promise.all([rimraf('missing.csv'), rimraf('translations.csv'), rimraf('locales')]);
    } catch (err) {
        console.error(`Failed to clean all files. ${err.toString()}`);
    }
}
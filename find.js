const fs = require('fs');
const glob = require('glob');
const sortJson = require('sort-json');

const missingTranslations = new Set();
let en = {};

fs.readFile('locales/en_us/translation.json', { encoding: 'utf8' }, (err, data) => {
    if (err) throw err;
    en = JSON.parse(data.trim());

    glob('locales/**/*.json', (err, files) => {
        if (err) throw err;
        files.forEach((file) => {
            if (file.indexOf('en_us') === -1) {
                fs.readFile(file, { encoding: 'utf8' }, (err, data) => {
                    if (err) throw err;
                    const locale = JSON.parse(data.trim());
                    processTranslation(en, locale);
                    fs.writeFile(file, JSON.stringify(locale, null, '\t'), (err) => {
                        if (err) throw err;
                        sortJson.overwrite(file, { ignoreCase: true });
                    });
                });
            }
        });
    });

    fs.writeFile('locales/en_us/translation.json', JSON.stringify(en, null, '\t'), (err) => {
        if (err) throw err;
        sortJson.overwrite('locales/en_us/translation.json', { ignoreCase: true });
    })
});

process.on('exit', () => {
    if (missingTranslations.size) {
        console.log('Missing translations:');
        let table = '';
        missingTranslations.forEach((key) => {
            console.log('    ' + key);
            table += key + ',\"' + getValue(key) + '\"\r\n';
        });

        fs.writeFileSync('missing.csv', table);
    }
});

function getValue(key) {
    let result = en;
    for (const sub of key.split('.')) {
        result = result[sub];
    }

    return result;
}

function addMissingKeys(source, path) {
    Object.keys(source).forEach((key) => {
        if (typeof source[key] === 'object') {
            addMissingKeys(source[key], path + key + '.');
        } else {
            missingTranslations.add(path + key);
        }
    })
}

function processTranslation(source, target, path = '') {
    const sourceKeys = Object.keys(source);
    const targetKeys = Object.keys(target);
    targetKeys.filter((key) => sourceKeys.find((sourceKey) => sourceKey === key) == null).forEach((key) => delete target[key]);

    sourceKeys.forEach((key) => {
        if (typeof source[key] === 'string' && typeof target[key] !== 'string') {
            target[key] = source[key];
            missingTranslations.add(path + key);
        } else if (typeof source[key] === 'object') {
            if (typeof target[key] !== 'object') {
                target[key] = source[key]
                addMissingKeys(source[key], path + key + '.');
            } else {
                processTranslation(source[key], target[key], key + '.');
            }
        }
    });
}
const fs = require('fs');
const sortJson = require('sort-json');

fs.readFile('translations.csv', { encoding: 'utf8' }, (err, data) => {
    let rows = data.split(/\r?\n/).map((row) => {
        return separateRow(row);
    });
    for (let i = 1; i < rows[0].length; i++) {
        let fileName = 'locales/' + rows[0][i] + '/translation.json';
        fs.readFile(fileName, { encoding: 'utf8' }, (err, data) => {
            if (err) {
                console.error(err.name + ' : ' + err.message);
                return;
            }
            let translation = JSON.parse(data.trim());
            rows.forEach((row, index) => {
                if (index !== 0) {
                    setValue(row[0], row[i], translation);
                }
            });
            fs.writeFile(fileName, JSON.stringify(translation, null, '\t'), (err) => {
                if (err) throw err;
                sortJson.overwrite(fileName, { ignoreCase: true });
            });
        });
    }
});

function separateRow(row) {
    let separated = [];
    let sticky = false;
    for (let section of row.split(',')) {
        if (sticky) {
            if (section.endsWith('\"')) {
                sticky = false;
                section = section.substring(0, section.length - 1);
            }
            separated[separated.length - 1] += ',' + section;
        } else if (section.startsWith('\"')) {
            sticky = true;
            section = section.substring(1);
            separated.push(section);
        } else {
            separated.push(section);
        }
    }

    return separated;
}

function setValue(key, value, translation) {
    if (key.indexOf('.') !== -1) {
        let splitKey = key.split('.');
        let subKey = splitKey[0];
        let restOfKey = splitKey.slice(1).join('.');
        if (translation[subKey] === undefined) {
            debugger;
        }
        setValue(restOfKey, value, translation[subKey]);
    } else {
        translation[key] = value;
    }
}
const fs = require('fs');

if (fs.existsSync('missing.csv')) {
    fs.unlink('missing.csv', (err) => {
        if (err) throw err;
    });
}

deleteFolderRecursive('locales');

function deleteFolderRecursive(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function(file, index){
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};
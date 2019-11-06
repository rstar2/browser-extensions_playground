const path = require('path');
const fs = require('fs-extra');
const {zip} = require('zip-a-folder');

const DIST = path.resolve(__dirname, '../dist');
const SRC = path.resolve(__dirname, '../src');
const PUBLIC = path.resolve(__dirname, '../public');

(async () => {
    try {
        // empty the dist folder and ensure it it created
        fs.removeSync(DIST);
        fs.ensureDirSync(DIST);

        // copy the pulic assets
        fs.copySync(PUBLIC, DIST);

        // zip the source
        await zip(SRC, path.join(DIST, 'ffs-extension.zip'));
        console.log('Successful build');
    } catch (err) {
        console.error('Failed to build', err);
    }
})();
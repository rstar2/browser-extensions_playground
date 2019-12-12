const path = require('path');
const fs = require('fs-extra');
const {zip} = require('zip-a-folder');

const DIST = path.resolve(__dirname, '../dist');
const PUBLIC = path.resolve(__dirname, '../public');
const SRC = path.resolve(__dirname, '../src');
const SRC_DIST = path.resolve(__dirname, '../src-dist');

(async () => {
    try {
        // empty the dist folder and ensure it it created
        fs.removeSync(DIST);
        fs.ensureDirSync(DIST);

        // create a temp source-dist folder that will be finally zipped
        fs.removeSync(SRC_DIST);
        fs.ensureDirSync(SRC_DIST);

        // copy the source into the source-dist BUT skipping the 'options' folder inside
        fs.copySync(SRC, SRC_DIST, {filter: (src) => !src.endsWith('options')});
        fs.copySync(path.resolve(SRC, 'options/dist'), path.resolve(SRC_DIST, 'options'));

        // zip the source-dist
        await zip(SRC_DIST, path.join(DIST, 'ffs-extension.zip'));

        // remove it - not needed
        fs.removeSync(SRC_DIST);

        // copy the public assets
        fs.copySync(PUBLIC, DIST);

        console.log('Successful build');
    } catch (err) {
        console.error('Failed to build', err);
    }
})();
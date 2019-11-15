const path = require('path');
const fs = require('fs-extra');

const SRC = path.resolve(__dirname, '../src');

try {
    const manifest = fs.readJsonSync(path.join(SRC, 'manifest.json'));
    const version = manifest.version.split('.'); // => 3.0.0

    let upgradeVersionType = 0;
    if (process.argv.length >= 3) {
        const versionType = process.argv[2];
        if (versionType === '--minor') {
            upgradeVersionType = 1;
        } else if (versionType === '--patch') {
            upgradeVersionType = 2;
        }
    }

    // increment the version (it will auto convert to number)
    version[upgradeVersionType] = ++(version[upgradeVersionType]);

    manifest.version = version.join('.');

    fs.writeJsonSync(path.join(SRC, 'manifest.json'), manifest, { spaces: 4 });
    console.log('Upgraded to version', manifest.version);
} catch(err) {
    console.error('Failed to upgrade', err);
}



const fs = require('fs-extra')



const packageObj = fs.readJsonSync('./package.json');
console.log(packageObj.version) // => 2.0.0

console.log('Not implemented yet');
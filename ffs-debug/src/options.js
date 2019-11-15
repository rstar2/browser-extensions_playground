const log = (msg) => {
    console.log('%c %s %s %s', 'color: brown; font-weight: bold; text-decoration : underline;', '--FFS DEBUG--', msg, '--');
};

const secretInput = document.getElementById('secret');
const logLevelsInput = document.getElementById('logLevels');
const skinInput = document.getElementById('skin');
const setButton = document.getElementById('setButton');

// show the currently stored  secret code
chrome.storage.sync.get(['secret', 'logLevels', 'skin'], ({secret, logLevels, skin}) => {
    secretInput.value = secret || '';
    skinInput.value = skin || '';

    /**
     * Value will be of the format "logger:level, ...logger:level, ... ",
     * for instance "Controller:3, Comm:3"
     * @param {Object} [levels] should be of the format { "logger": level, "logger": level, ... }
     * @param {String[]} outArr where to put parsed log-level
     * @param {Boolean} [isFullMatch] whether or not this is 'fullMatch' or 'startsWith'
     */
    const setLogLevels = (levels, outArr, isFullMatch = true) => {
        if (levels)
            Object.keys(levels).forEach(key => outArr.push(`${key}${isFullMatch ? '' : '*'}:${levels[key]}`));
    };
    const loggers = [];
    if (logLevels) {
        setLogLevels(logLevels.listLevel, loggers);
        setLogLevels(logLevels.listLevelStartWith, loggers, false);
    }
    logLevelsInput.value = loggers.join(', ');
});

// store the new secret code
setButton.addEventListener('click', () => {
    const secret = secretInput.value;
    const skin = skinInput.value;

    if (!secret) {
        alert('No secret');
        return;
    }

    // const logLevels = {
    //     listLevel: {
    //         "Controller": 3,
    //         "Comm": 3
    //     },
    //     listLevelStartWith: {"Loc_P_0_dummy": 1}
    // };

    // Value must be of the format "logger:level, ..., logger*:level, ... "
    const logLevels = logLevelsInput.value.split(',')
        .map(val => val.trim())
        .map(val => val.split(':').map(val => val.trim()))
        .filter(val => val.length === 2)
        .filter(val => val[1] >= 1 && val[1] <= 5)
        .map(val => ({logger: val[0], level: val[1]}))
        .reduce((res, val) => {
            //check whether this is 'full match' or 'starts with' logger
            let logLevelsType = 'listLevel';
            let logger = val.logger;
            if (logger.endsWith('*')) {
                logLevelsType = 'listLevelStartWith';
                logger = logger.slice(0, -1); // remove this last '*'
            }

            if (!res[logLevelsType]) {
                res[logLevelsType] = {};
            }
            res[logLevelsType][logger] = val.level;
            return res;
        }, {});
    chrome.storage.sync.set({secret, logLevels, skin}, () => log('Options updated'));
});
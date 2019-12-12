import {log, LogLevels} from './utils';

// useful to be set to 'false' when developing locally and ignoring the Chrome extension environment
const useLocalStorage = false;

/**
 * @param {String} secret
 * @param {String} skin
 * @param {String} logLevels
 */
export function store({secret = '', skin = '', logLevels = ''}) {
    if (useLocalStorage) {
        localStorage.setItem('secret', secret);
        localStorage.setItem('skin', skin);
        localStorage.setItem('logLevels', logLevels);

        log('Options updated')
    } else {
        chrome.storage.sync.set({secret, logLevels: LogLevels.fromStr(logLevels), skin}, () => log('Options updated'));
    }
}

/**
 * @return Promise<{{secret: String?, skin: String?, logLevels: String?}}>
 */
export function load() {
    return new Promise((resolve) => {
        if (useLocalStorage) {
            resolve({
                secret: localStorage.getItem('secret'),
                skin: localStorage.getItem('skin'),
                logLevels: localStorage.getItem('logLevels')
            });
        } else {
            chrome.storage.sync.get(['secret', 'logLevels', 'skin'], ({secret, logLevels, skin}) => {
                const logLevelsStr = LogLevels.toStr(logLevels);

                resolve({
                    secret,
                    skin,
                    logLevels: logLevelsStr
                });
            });
        }
    }).then(data => {
        log('Options loaded');
        return data;
    });

}
const log = (msg) => {
    console.log('%c %s %s %s', 'color: brown; font-weight: bold; text-decoration : underline;', '--FFS DEBUG--', msg, '--');
};

// this will make 'notify' the app that the FFS Debug extension is installed
const version = chrome.runtime.getManifest().version;

let isVerified = false;

const logLevels = new Promise((resolve, reject) => {
    // reject it if no response from the storage for so long
    const rejectTimer = setTimeout(reject, 1000);
    chrome.storage.sync.get('logLevels', ({logLevels}) => {
        clearTimeout(rejectTimer);
        resolve(logLevels);
    });
});

window.addEventListener('message', event => {
    // We only accept messages from ourselves
    if (event.source !== window)
        return;

    if (event.data.type === 'FFS_DEBUG_CONNECT') {
        // request for "connect"/use received from the main app
        // check the 'secret' code and if valid send "connected" - so send message to the background script to check an respond
        chrome.runtime.sendMessage({type: 'FFS_DEBUG_VERIFY'}, response => {
            const verified = true === response.success;
            log(`Verification ${verified ? 'succeeded' : 'failed'}`);

            logLevels
                .then(logLevels => window.postMessage({type: 'FFS_DEBUG_LOG_LEVELS', logLevels}, '*'))
                .catch()
                .then(() => {
                    // so send back a "response" for this request with whether or not the extension is "verified"
                    // note do this as last message - after log levels are sent
                    window.postMessage({type: 'FFS_DEBUG_CONNECTED', verified}, '*');
                });
        });
    } else if (event.data.type === 'FFS_DEBUG_INIT') {
        isVerified = true;
        // confirmation received from the main app
        log('Verified communication established');
        // notify the background script also
        chrome.runtime.sendMessage({type: 'FFS_DEBUG_INIT', verified: isVerified});
    }
}, false);

// this code is for the extension to notify itself in the the app, e.g. the app to can easily detect its existence
function injectScript() {
    log('Content script injected a "detectable" script');

    const injectScript = document.createElement('script');
    injectScript.type = 'text/javascript';
    injectScript.innerHTML = `
  (function() {
    // just for logging
    const msg = 'Content script executed the "detectable" script';
    console.log('%c %s %s %s', 'color: brown; font-weight: bold; text-decoration : underline;', '--FFS DEBUG--', msg, '--');
    
    // make our extension detectable
    document.FFS_DEBUG = true;
  })();
  `;
    document.head.prepend(injectScript);
}
function checkForDOM() {
    if (document.head) {
        injectScript();
    } else {
        requestIdleCallback(checkForDOM);
    }
}
checkForDOM();

// listen fot when the page/tab become visible (e.g. active again)
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        chrome.runtime.sendMessage({type: 'FFS_DEBUG_ACTIVATED', verified: isVerified});
    }
});

log('Content script injected');




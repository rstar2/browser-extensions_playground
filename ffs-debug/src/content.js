const log = (msg) => {
    console.log('%c %s %s %s', 'color: brown; font-weight: bold; text-decoration : underline;', '--FFS DEBUG--', msg, '--');
};

window.addEventListener('message', function(event) {
    // We only accept messages from ourselves
    if (event.source !== window)
        return;

    if (event.data.type === 'FFS_DEBUG_CONNECT') {
        // const port = chrome.runtime.connect();
        // port.postMessage({type: 'FFS_DEBUG_CONNECTED'});
        window.postMessage({ type: 'FFS_DEBUG_CONNECTED' }, '*');
    } else if (event.data.type === 'FFS_DEBUG_INIT') {
        log('Communication established');
    }

}, false);

log('Content script injected');




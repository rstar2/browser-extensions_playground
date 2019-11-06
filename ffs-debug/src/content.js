const log = (msg) => {
    console.log('%c %s %s %s', 'color: brown; font-weight: bold; text-decoration : underline;', '--FFS DEBUG--', msg, '--');
};


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

            if (verified) {
                // so all is good allow to "connect" (whatever that may mean - this case the main app will expose the controller)
                window.postMessage({type: 'FFS_DEBUG_CONNECTED'}, '*');
            }
        });
    } else if (event.data.type === 'FFS_DEBUG_INIT') {
        // confirmation received from the main app
        log('Communication established');
    }
}, false);

log('Content script injected');




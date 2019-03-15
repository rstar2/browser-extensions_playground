let windows = new Map();

function isDefined(obj) {
    return null !== obj && undefined !== obj;
}

function mapToJson(map) {
    return JSON.stringify([...map]);
}
function jsonToMap(jsonStr) {
    return new Map(JSON.parse(jsonStr));
}

function tabSwitch() {
    chrome.tabs.query({ currentWindow: true }, tabs => {
        if (tabs.length === 0 || tabs.length === 1) {
            // nothing to switch
            return;
        }

        let lastActiveTabId;
        let errorCause;

        // if just 2 tabs - switch them
        if (tabs.length === 2) {
            const notActiveTab = tabs.find(tab => !tab.active);
            if (notActiveTab) {
                lastActiveTabId = notActiveTab.id;
            }
        } else {
            const windowId = tabs[0].windowId;
            const windowData = windows.get(windowId);

            // validate 'windowData' again as all events are async and such window acn already have been closed
            if (windowData) {
                lastActiveTabId = windowData.lastActiveTabId;
            } else {
                errorCause = 'Window\'s data is already cleared';
            }

            // check if there's still such tab
            if (isDefined(lastActiveTabId) &&
                -1 === tabs.findIndex(tab => tab.id === lastActiveTabId)) {
                errorCause = 'Window\'s data is obsolete';
            }
        }

        // Note id 0 is valid ID, so check is for 'null'
        if (isDefined(lastActiveTabId) && !errorCause) {
            chrome.tabs.update(lastActiveTabId, { active: true, highlighted: true });
        } else {
            errorCause = errorCause || 'No tab to switch to';
            console.log(errorCause);
        }
    });
}

chrome.commands.onCommand.addListener(function (command) {
    console.log('Command:', command);

    // in this case it's only one registered command ( 'tab-switch' ), so no need to check it

    tabSwitch();
});

function listenOnWindows() {
    // listen for window removal (no need for created - this will be in the tabs)
    chrome.windows.onRemoved.addListener(windowId => {
        windows.delete(windowId);
    });
}

function listenOnTabs() {
    // listen for tab 'activated'
    chrome.tabs.onActivated.addListener(({ tabId, windowId }, props) => {
        const windowData = windows.get(windowId);
        if (!windowData) {
            windows.set(windowId, {
                activeTabId: tabId
            });
        } else if (windowData.activeTabId !== tabId) {
            windowData.lastActiveTabId = windowData.activeTabId;
            windowData.activeTabId = tabId;
        }

        chrome.storage.local.set({'windows': mapToJson(windows)});
    });
}

listenOnWindows();
listenOnTabs();
console.log('Started');
chrome.storage.local.get(['windows'], data => {
    const jsonWindows = data['windows'];
    if (jsonWindows) {
        console.log('Restored windows data', jsonWindows);
        try {
            windows = jsonToMap(jsonWindows);
        } catch (error) {
            windows = new Map();
        }
    }
});


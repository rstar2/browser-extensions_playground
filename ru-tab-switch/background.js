chrome.commands.onCommand.addListener(function (command) {
    console.log('Command:', command);

    // in this case it's only one registered command ( 'tab-switch' ), so no need to check it

    tabSwitch();
});


function listenOnTabs() {
    // Note: Currently active tab can be updated with a new URL
    let checkTabId = -1;

    // listen for when active tab is 'ready'
    chrome.tabs.onActivated.addListener(({ tabId, windowId }, props) => {
        checkTabId = tabId;
        checkContextMenu(checkTabId);
    });

    // check initially the current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        checkTabId = tabs[0].id;
        checkContextMenu(checkTabId);
    });
}

listenOnTabs();

let latestTab;
function tabSwitch() {
    if (latestTab) {
        chrome.tabs.query({ currentWindow: true }, function (tabs) {
            // Sort tabs according to their index in the window.
            tabs.sort((a, b) => { return a.index < b.index; });
            let activeIndex = tabs.findIndex((tab) => { return tab.active; });
            let lastTab = tabs.length - 1;
            let newIndex = -1;
            if (command === 'flip-tabs-forward')
                newIndex = activeIndex === 0 ? lastTab : activeIndex - 1;
            else  // 'flip-tabs-backwards'
                newIndex = activeIndex === lastTab ? 0 : activeIndex + 1;
            chrome.tabs.update(tabs[newIndex].id, { active: true, highlighted: true });
        });
    }
}
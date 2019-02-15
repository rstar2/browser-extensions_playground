'use strict';

chrome.browserAction.onClicked.addListener(tab => {
    console.log('Extension clicked');


    chrome.tabs.create({
        // Global URL if there's proper schema
        // url: 'html://tab.html'

        // local URL inside the extension (both are the same)
        // url: 'tab.html',
        url: chrome.extension.getURL('tab.html')

    });
});

chrome.runtime.onInstalled.addListener(function () {
    console.log('Extension installed');

    chrome.contextMenus.create({
        'id': 'sampleContextMenu3',
        'title': 'Sample Context Menu',
        'contexts': ['selection']
    });
    chrome.contextMenus.create({
        'id': 'sampleContextMenu2',
        'title': 'Sample Context Menu',
        'contexts': ['selection']
    });

    chrome.contextMenus.onClicked.addListener(function (menuItem) {
        // called when any of the created contextMenu items was clicked
        // can check which one if needed 
        console.log('Extension ContextMenuItem clicked' + menuItem);
        
        
    });
});
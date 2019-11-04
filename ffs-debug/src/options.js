const secretInput = document.getElementById('secret');
const authButton = document.getElementById('authButton');

// show the currently stored  secret code
chrome.storage.sync.get('secret', ({secret}) => secretInput.value = secret || '');

// store the new secret code
authButton.addEventListener('click', () => {
    const secret = secretInput.value;

    if (!secret) {
        alert('No secret');
        return;
    }

    chrome.storage.sync.set({secret}, () => {
    });
});
const authButton = document.getElementById('authButton');

const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');


authButton.addEventListener('click', () => {
    const email = authEmail.value;
    const password = authPassword.value;

    if (!email && !password) {
        console.log('No Credentials');
        return;
    }

    // check with the secret
    chrome.storage.sync.get(['email', 'password'], data => {
        // store in extension's storage the auth state
        const isAuthorized = email === data.email && password === data.password;
        chrome.storage.sync.set({ auth: isAuthorized }, () => { });
    });

});
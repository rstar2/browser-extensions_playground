/* globals CryptoJS */

const authButton = document.getElementById('authButton');

const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');

const encrypted = 'U2FsdGVkX19+B4k7nAJ6lMF/DC2w6QMfDxKFfDZ+wHE=';

authButton.addEventListener('click', () => {
    const email = authEmail.value;
    const password = authPassword.value;

    if (!email && !password) {
        console.log('No Credentials');
        return;
    }

    // check the credentials - should could some server,
    // that's why it's designed to be async using Promises
    new Promise((resolve, reject) => {
        // this is not secure enough of course but still will opt-out the majority to hack it
        const decrypted = CryptoJS.AES.decrypt(encrypted, password).toString(CryptoJS.enc.Utf8);
        resolve(decrypted === email);
    }).then(isAuthorized => {
        chrome.storage.sync.set({ auth: isAuthorized }, () => { });
    });
});

// encrypt:
// const encrypted = CryptoJS.AES.encrypt(email, password);
// console.log(encrypted.toString());


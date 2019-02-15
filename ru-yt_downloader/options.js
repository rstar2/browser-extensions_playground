/* globals CryptoJS */

const authButton = document.getElementById('authButton');

const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');

const encrypted = 'U2FsdGVkX18Zvhv4Y4pZfLZA5s3wI3KatssSa5PfIcw=';

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
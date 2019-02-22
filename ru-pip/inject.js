(async () => {
    const videos = Array.from(document.querySelectorAll('video'))
        .filter(video => video.readyState != 0)
        .filter(video => video.disablePictureInPicture == false)
        .sort((v1, v2) => {
            const v1Rect = v1.getClientRects()[0];
            const v2Rect = v2.getClientRects()[0];
            return ((v2Rect.width * v2Rect.height) - (v1Rect.width * v1Rect.height));
        });

    if (videos.length === 0)
        return;

    const video = videos[0];

    // If there is no element in Picture-in-Picture yet, let's request Picture In Picture for the video,
    // otherwise leave/exit it.
    if (document.pictureInPictureElement) {   // if (document.pictureInPictureElement) { video.hasAttribute('__pip__')
        await document.exitPictureInPicture();
    } else {
        await video.requestPictureInPicture();
        // video.setAttribute('__pip__', true);
        // video.addEventListener('leavepictureinpicture', event => {
        //     video.removeAttribute('__pip__');
        // }, { once: true });

        // if needed to send message back to the background script
        chrome.runtime.sendMessage({ message: 'enter' });
    }
})();

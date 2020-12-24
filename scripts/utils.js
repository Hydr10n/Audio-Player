async function sleep(milliseconds) { await new Promise(resolve => setTimeout(resolve, milliseconds)); }

function formatTime(seconds) {
    if (isNaN(seconds))
        seconds = 0;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return [h > 0 ? (h < 10 ? '0' + h : h) : 0, m < 10 ? '0' + m : m, s < 10 ? '0' + s : s].filter(Boolean).join(':');
}

function getFileNameWithoutExtension(fileName) {
    const index = fileName.lastIndexOf('.');
    return index == -1 ? fileName : fileName.substring(0, index);
}
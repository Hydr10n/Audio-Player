/*
 * Source File: audio-control.js
 * Last Update: 2020/12/24
 *
 * Copyright (C) Hydr10n@GitHub. All Rights Reserved.
 */

const DEFAULT_AUDIO_LIST_ITEM = {
    file: null,
    audioTags: {
        title: 'Unknown title',
        artists: 'Unknown artists',
        album: 'Unknown album'
    }
};

let isPlaying;
let isPlayNextPending;
let isCurrentTimeChanging;
let playlistSelectedIndex;
let audioList;

const textAudioTitle = document.getElementById('text-audio-title');
const textAudioArtists = document.getElementById('text-audio-artists');
const textAudioAlbum = document.getElementById('text-audio-album');
const textCurrentTime = document.getElementById('text-current-time');
const textDuration = document.getElementById('text-duration');

const imgAudioCover = document.getElementsByClassName('img-audio-cover')[0];
imgAudioCover.onload = () => URL.revokeObjectURL(imgAudioCover.src);

const audio = document.createElement('audio');
audio.onloadeddata = () => snackbarAudioPlayError.close();
audio.onplay = () => iconButtonTogglePlayPause.on = true;
audio.onpause = () => {
    if (!audio.ended && audio.error == null)
        iconButtonTogglePlayPause.on = false;
};
audio.ondurationchange = () => {
    const duration = audio.duration;
    textDuration.textContent = formatTime(duration);
    sliderCurrentTime.setValue(audio.currentTime / duration * 100);
};
audio.ontimeupdate = () => {
    if (audio.paused || isCurrentTimeChanging)
        return;
    iconButtonTogglePlayPause.on = true;
    const currentTime = audio.currentTime;
    textCurrentTime.textContent = formatTime(currentTime);
    sliderCurrentTime.setValue(currentTime / audio.duration * 100);
};
audio.onended = async () => {
    textCurrentTime.textContent = formatTime(audio.duration);
    isPlaying = playlistSelectedIndex != audioList.length - 1;
    await playNext(1000);
    iconButtonTogglePlayPause.on = isPlaying;
    isCurrentTimeChanging = false;
};
audio.onerror = () => {
    textDuration.textContent = formatTime(audio.duration);
    snackbarAudioPlayError.open();
    if (isPlaying)
        audio.onended();
};

playlist.listen('MDCList:action', e => {
    const index = e.detail.index;
    if (playlistSelectedIndex == index)
        return;
    playlistSelectedIndex = index;
    play();
});
iconButtonToggleMuteUnmute.listen('MDCIconButtonToggle:change', e => {
    audio.muted = e.detail.isOn;
    sliderVolume.setValue(audio.muted ? 0 : audio.volume * 100);
});
iconButtonTogglePlayPause.listen('MDCIconButtonToggle:change', e => {
    if (isPlayNextPending) {
        iconButtonTogglePlayPause.on = false;
        return;
    }
    isPlaying = e.detail.isOn;
    if (isPlaying) {
        audio.play();
        if (audio.readyState < audio.HAVE_CURRENT_DATA)
            audio.onerror();
    }
    else
        audio.pause();
});
sliderVolume.listen('MDCSlider:change', e => {
    audio.volume = e.detail.value / 100;
    iconButtonToggleMuteUnmute.on = audio.volume == 0;
});
sliderCurrentTime.listen('MDCSlider:input', e => {
    isCurrentTimeChanging = true;
    textCurrentTime.textContent = formatTime(e.detail.value / 100 * audio.duration);
});
sliderCurrentTime.listen('MDCSlider:change', async e => {
    audio.currentTime = e.detail.value / 100 * audio.duration;
    await sleep(300 / audio.playbackRate);
    if (!audio.paused && audio.readyState < audio.HAVE_CURRENT_DATA)
        audio.onerror();
    isCurrentTimeChanging = false;
});

function updateAudioTagsTexts(audioTags) {
    textAudioTitle.textContent = audioTags.title;
    textAudioArtists.textContent = audioTags.artists;
    textAudioAlbum.textContent = audioTags.album;
}

function updateAudioTagsCover(file) {
    const DEFAULT_AUDIO_COVER_SRC = 'assets/images/music-icon.svg';
    jsmediatags.read(file, {
        onSuccess: tag => {
            if (tag.tags.picture) {
                const { data, type } = tag.tags.picture;
                imgAudioCover.src = URL.createObjectURL(new Blob([new Uint8Array(data)], { type }));
            }
            else
                imgAudioCover.src = DEFAULT_AUDIO_COVER_SRC;
        },
        onError: () => imgAudioCover.src = DEFAULT_AUDIO_COVER_SRC
    });
}

function updateAudioTags(audioListItem) {
    updateAudioTagsTexts(audioListItem.audioTags)
    updateAudioTagsCover(audioListItem.file);
}

function resetCurrentTime() {
    textCurrentTime.textContent = formatTime(0);
    sliderCurrentTime.setValue(0);
}

function setPlaylistSelectedIndex(index) { playlistSelectedIndex = playlist.selectedIndex = index; }

function loadAudio() {
    const audioListItem = audioList[playlistSelectedIndex];
    updateAudioTags(audioListItem);
    resetCurrentTime();
    URL.revokeObjectURL(audio.src);
    audio.src = URL.createObjectURL(audioListItem.file);
    audio.load();
}

function play() {
    isPlayNextPending = false;
    loadAudio();
    if (isPlaying)
        audio.play();
}

function playPrevious() {
    if (audio.currentTime >= 6) {
        isPlayNextPending = false;
        audio.currentTime = 0;
        return;
    }
    setPlaylistSelectedIndex((playlist.selectedIndex + audioList.length - 1) % audioList.length);
    play();
}

async function playNext(delayedMilliseconds = 0) {
    if (audioList.length < 2 && audio.currentTime != audio.duration)
        return;
    if (delayedMilliseconds > 0) {
        isPlayNextPending = true;
        await sleep(delayedMilliseconds);
    }
    if (delayedMilliseconds == 0 || isPlayNextPending) {
        setPlaylistSelectedIndex((playlist.selectedIndex + 1) % audioList.length);
        play();
    }
}

function createAudioList(audioFileList, onAudioTagsRead) {
    audioList = [];
    for (const audioFile of audioFileList) {
        const audioListItem = { ...DEFAULT_AUDIO_LIST_ITEM };
        audioListItem.audioTags = { ...DEFAULT_AUDIO_LIST_ITEM.audioTags };
        audioListItem.file = audioFile;
        jsmediatags.read(audioFile, {
            onSuccess: tag => onAudioTagsRead(audioListItem, tag.tags),
            onError: () => onAudioTagsRead(audioListItem, {})
        });
        audioList.push(audioListItem);
    }
}

function enableAudioControl(enable) {
    sliderCurrentTime.setDisabled(!enable);
    [].map.call(document.querySelectorAll('.button-play-previous, .button-toggle-play-pause, .button-play-next'), e => {
        const disabled = 'disabled';
        if (enable)
            e.removeAttribute(disabled);
        else
            e.setAttribute(disabled, undefined);
    });
}

function updatePlaylist(audioFileList) {
    if (audioFileList.length < 1)
        return;
    const ELEMENTS_ID_PREFIXES = {
        textAudioTitle: 'text-audio-title',
        textAudioArtists: 'text-audio-artists',
        textAudioAlbum: 'text-audio-album'
    }
    enableAudioControl(false);
    isPlaying = isCurrentTimeChanging = false;
    setPlaylistSelectedIndex(-1);
    audio.pause();
    playlist.root.innerHTML = '';
    let audioFileListIndex;
    for (audioFileListIndex = 0; audioFileListIndex < audioFileList.length; audioFileListIndex++)
        playlist.root.innerHTML += `
            <li class="mdc-list-item" tabindex="${audioFileListIndex == 0 ? 0 : -1}">
                <span class="mdc-list-item__ripple"></span>
                <span class="mdc-list-item__text">
                    <span id=${ELEMENTS_ID_PREFIXES.textAudioTitle + audioFileListIndex} class="mdc-list-item__primary-text">${DEFAULT_AUDIO_LIST_ITEM.audioTags.title}</span>
                    <span style="display: flex;">
                        <span id=${ELEMENTS_ID_PREFIXES.textAudioArtists + audioFileListIndex} class="mdc-list-item__secondary-text">${DEFAULT_AUDIO_LIST_ITEM.audioTags.artists}</span>
                        <span class="mdc-list-item__secondary-text" style="font-weight: bold;">&nbsp·&nbsp</span>
                        <span id=${ELEMENTS_ID_PREFIXES.textAudioAlbum + audioFileListIndex} class="mdc-list-item__secondary-text">${DEFAULT_AUDIO_LIST_ITEM.audioTags.album}</span>
                    </span>
                </span>
            </li>
        `;
    createAudioList(audioFileList, (audioListItem, tags) => {
        const audioTags = audioListItem.audioTags;
        audioTags.title = tags.title ? tags.title : getFileNameWithoutExtension(audioListItem.file.name);
        audioTags.artists = tags.artist ? tags.artist : audioTags.artists;
        audioTags.album = tags.album ? tags.album : audioTags.album;
        const audioListIndex = audioList.indexOf(audioListItem);
        document.getElementById(ELEMENTS_ID_PREFIXES.textAudioTitle + audioListIndex).textContent = audioTags.title;
        document.getElementById(ELEMENTS_ID_PREFIXES.textAudioArtists + audioListIndex).textContent = audioTags.artists;
        document.getElementById(ELEMENTS_ID_PREFIXES.textAudioAlbum + audioListIndex).textContent = audioTags.album;
        if (playlistSelectedIndex == -1) {
            setPlaylistSelectedIndex(0);
            loadAudio();
            enableAudioControl(true);
        }
        else if (audioListItem == audioList[playlistSelectedIndex])
            updateAudioTagsTexts(audioTags);
    });
}
const MDCDialog = mdc.dialog.MDCDialog;
const MDCDrawer = mdc.drawer.MDCDrawer;
const MDCIconButtonToggle = mdc.iconButton.MDCIconButtonToggle;
const MDCList = mdc.list.MDCList;
const MDCMenu = mdc.menu.MDCMenu;
const MDCRipple = mdc.ripple.MDCRipple;
const MDCSlider = mdc.slider.MDCSlider;
const MDCSnackbar = mdc.snackbar.MDCSnackbar;
const MDCTooltip = mdc.tooltip.MDCTooltip;
const MDCTopAppBar = mdc.topAppBar.MDCTopAppBar;

const drawer = new MDCDrawer(document.getElementsByClassName('mdc-drawer')[0]);
window.onresize = () => drawer.root.style.width = Math.min(500, window.innerWidth) + 'px';
window.onresize();

const playlist = drawer.list;
playlist.singleSelection = true;
playlist.wrapFocus = true;

const topAppBar = new MDCTopAppBar(document.getElementsByClassName('mdc-top-app-bar')[0]);
topAppBar.setScrollTarget(document.getElementById('main-content'));
topAppBar.listen('MDCTopAppBar:nav', () => drawer.open = !drawer.open);
document.getElementsByClassName('mdc-drawer__close')[0].onclick = () => drawer.open = false;

const snackbarAudioPlayError = new MDCSnackbar(document.getElementById('snackbar-audio-play-error'));

const dialogAbout = new MDCDialog(document.getElementById('dialog-about'));

const menuOptions = new MDCMenu(document.getElementById('menu-options'));

const sliderVolume = new MDCSlider(document.getElementById('slider-volume'));
const sliderCurrentTime = new MDCSlider(document.getElementById('slider-current-time'));

const iconButtonToggleMuteUnmute = new MDCIconButtonToggle(document.getElementsByClassName('button-toggle-mute-unmute')[0]);
const iconButtonTogglePlayPause = new MDCIconButtonToggle(document.getElementsByClassName('button-toggle-play-pause')[0]);

[].map.call(document.getElementsByClassName('mdc-tooltip'), e => new MDCTooltip(e));

[].map.call(document.querySelectorAll('.mdc-button'), e => new MDCRipple(e));

[].map.call(document.querySelectorAll('.mdc-icon-button'), e => new MDCRipple(e).unbounded = true);
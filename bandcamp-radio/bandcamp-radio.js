'use strict';

// Unify FF and Chrome
// =======================================================
let runtime = typeof browser === 'undefined' ? chrome.runtime : browser;
// =======================================================

function setItem(key, value, cb) {
	chrome.storage.local.set({[key]: value}, cb);
}

function getItem(key, cb) {
	chrome.storage.local.get(key, cb);
}

function removeItem(key, cb) {
	chrome.storage.local.remove(key, cb);
}

let radio = {};


function navigateToRandomAlbum() {
	let albumLinks = Object.keys(radio.albums);

	// If currently on an available album, remove it from the list
	if(albumLinks.includes(window.location.href))
		albumLinks.splice(albumLinks.indexOf(window.location.href), 1);

	radio.playing = albumLinks[Math.floor(Math.random() * albumLinks.length)];
	setItem('radio', radio, () => {
		window.location.href = radio.playing;
	});
}

function waitForTrackEnd(audioEl) {
	// Need manual checking to avoid ended event getting triggered
	// (Which would trigger bandcamp's own handler)
	if(audioEl.duration - audioEl.currentTime < 1) {
		audioEl.pause();
		navigateToRandomAlbum();
	}
	else {
		setTimeout(waitForTrackEnd.bind(null, audioEl), 100);
	}
}

function addPlay() {
	let controls = document.createElement('div');
	controls.style.cssText = `
		width:40px;
		height:40px;
		position:fixed;
		top: 0px;
		right: 0px;
		z-index: 1000;
		cursor: pointer;
		background-color:green`;

	controls.innerHTML = "Play";

	controls.addEventListener('click', () => {
		radio.origin = window.location.href;
		radio.albums = {};

		let links = document.getElementsByTagName('a');
		for(let link of links) {
			if(link.href.indexOf('/album/') > 0) {
				radio.albums[link.href] = null;
			}
		}

		navigateToRandomAlbum();
	});

	document.body.appendChild(controls);
}

function addSkip() {
	let controls = document.createElement('div');
	controls.style.cssText = `
		width:40px;
		height:40px;
		position:fixed;
		top: 0px;
		right: 40px;
		z-index: 1000;
		cursor: pointer;
		background-color:blue`;

	controls.innerHTML = "Skip";

	controls.addEventListener('click', () => {
		document.getElementsByTagName('audio')[0].pause();
		navigateToRandomAlbum();
	});

	document.body.appendChild(controls);
}

function addResume() {
	let controls = document.createElement('div');
	controls.style.cssText = `
		width:100%;
		height:100%;
		position:fixed;
		top: 0px;
		left: 0px;
		z-index: 1000;
		cursor: pointer;
		background-color:white`;

	controls.innerHTML = "Resume Playback";

	controls.addEventListener('click', () => {
		controls.remove();
		initPlayback();
	});

	document.body.appendChild(controls);
}

function addStop() {
	let controls = document.createElement('div');
	controls.style.cssText = `
		width:40px;
		height:40px;
		position:fixed;
		top: 0px;
		right: 0px;
		z-index: 1000;
		cursor: pointer;
		background-color:red`;

	controls.innerHTML = "Stop";

	controls.addEventListener('click', () => {
		removeItem('radio', () => window.location.href = radio.origin);
	});

	document.body.appendChild(controls);
}

function initPlayback() {
	addStop();
	addSkip();

	let currentAlbum = radio.albums[window.location.href];
	let availableTracks = document.querySelectorAll('.play_status:not(.disabled)');
	let filteredTracks = availableTracks;

	if(currentAlbum !== null) {
		// Filter already played tracks
		if(currentAlbum.played.length > 0) {
			filteredTracks = Array.from(availableTracks).filter(
				(track, idx) => (!currentAlbum.played.includes(idx))
			);
		}
	}
	else {
		currentAlbum = radio.albums[window.location.href] = {
			played: [],
		};
	}

	// Delay playing, otherwise errors because of overlapping pause/play events
	setTimeout(() => {
		// PLAY
		let randomTrack = filteredTracks[Math.floor(Math.random() * filteredTracks.length)];
		randomTrack.click();

		// Navigate to random album once this track is done
		waitForTrackEnd(document.getElementsByTagName('audio')[0]);

		// Figure out idx of track that is being played and store it
		availableTracks.forEach((track, idx) => {
			if(track === randomTrack)
				currentAlbum.played.push(idx);
		});

		// All tracks will have been played when this one is done
		if(currentAlbum.played.length >= availableTracks.length) {
			delete radio.albums[window.location.href];
		}

		setItem('radio', radio);
	}, 500);
}

(() => {
	getItem('radio', (values) => {
		if(chrome.runtime.lastError || Object.keys(values).length === 0) {
			// At least two album links were found
			if(document.body.innerHTML.indexOf("/album/") < document.body.innerHTML.lastIndexOf("/album/")) {
				addPlay();
			}
		}
		else {
			radio = values.radio;

			if(window.location.href === radio.playing) {
				if(document.referrer === "") {
					addResume();
				}
				else {
					initPlayback();
				}
			}
		}
	});
})();

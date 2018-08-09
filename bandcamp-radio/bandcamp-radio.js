// Unify FF and Chrome
// =======================================================
let runtime = typeof browser === 'undefined' ? chrome.runtime : browser;
// =======================================================

function setItem(key, value) {
	localStorage.setItem(key, JSON.stringify(value));
	//chrome.storage.local.set({key: value});
}

function getItem(key) {
	return JSON.parse(localStorage.getItem(key));
	// chrome.storage.local.get([key], (value) => {
	// 	return chrome.runtime.lastError ? undefined : value;
	// })
}

function navigateToRandomAlbum() {
	let albumLinks = Object.keys(radio.albums);

	// If currently on an available album, remove it from the list
	if(albumLinks.includes(window.location.href))
		albumLinks.splice(albumLinks.indexOf(window.location.href), 1);

	radio.playing = albumLinks[Math.floor(Math.random() * albumLinks.length)];
	setItem('radio', radio);
	window.location.href = radio.playing;
}

let radio = getItem('radio') || {};
let onEndedListener = null;

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

	controls.addEventListener('click', () => {
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

	controls.addEventListener('click', () => {
		document.getElementsByTagName('audio')[0].removeEventListener('ended', onEndedListener);
		radio = {};
		setItem('radio', radio);
	});

	document.body.appendChild(controls);
}


(() => {
	'use strict';

	if(window.location.href === radio.playing) {
		addStop();

		let currentAlbum = radio.albums[window.location.href];
		let availableTracks = document.querySelectorAll('.play_status:not(.disabled)');
		let filteredTracks = availableTracks;

		if(currentAlbum !== null) {
			// Filter already played tracks
			if(currentAlbum.played.length > 0) {
				filteredTracks = availableTracks.filter(
					(track, idx) => (currentAlbum.player.includes(idx))
				);
			}
		}
		else {
			currentAlbum = {
				played: []
			}
		}

		// PLAY
		let randomTrack = filteredTracks[Math.floor(Math.random() * filteredTracks.length)];
		randomTrack.click();

		// Navigate to random album once this track is done
		let audioEl = document.getElementsByTagName('audio')[0];
		audioEl.addEventListener('ended', () => {
			navigateToRandomAlbum();
		});

		// Figure out idx of track that is being played and store it
		availableTracks.forEach((track, idx) => {
			if(track === randomTrack)
				currentAlbum.played.push(idx);
		});

		// All tracks will have been played when this one is done
		if(currentAlbum.played.length >= availableTracks.length) {
			delete radio.albums[window.location.href];
		}
	}
	else {
		// At least two album links were found
		if(document.body.innerHTML.indexOf("/album/") < document.body.innerHTML.lastIndexOf("/album/")) {
			addPlay();
		}
	}
})();

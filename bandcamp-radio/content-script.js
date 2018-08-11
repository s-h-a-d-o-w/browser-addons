'use strict';

browser.runtime.onMessage.addListener(
	function(message) {
		switch(message.cmd) {
			case 'GET_ALBUMS_LIST':
				return new Promise((resolve, reject) => {
					if(document.body.innerHTML.indexOf("/album/") < document.body.innerHTML.lastIndexOf("/album/")) {
						resolve(getAlbumList());
					}
					else {
						reject('No albums on this page.');
					}
				});
			case 'PLAY':
				radio.tabid = message.tabid;
				play();
				break;
			case 'SKIP':
				skip();
				break;
			case 'STOP':
				stop();
				break;
			case 'BLOCK':
				block();
				break;
		}
	}
);


// Unify FF and Chrome
// =======================================================
let runtime = typeof browser === 'undefined' ? browser.runtime : browser;
// =======================================================

function setItem(key, value) {
	let item = {};
	item[key] = value;
	return browser.storage.local.set(item);
	//return browser.storage.local.set({[key]: value});
}

function getItem(key) {
	return browser.storage.local.get(key);
}

function removeItem(key) {
	return browser.storage.local.remove(key);
}

let radio = {};


function getAlbumList() {
	return getItem('blocked')
	.then((values) => {
		let blocked = values.blocked || [];
		let albums = {};
		for(let link of document.getElementsByTagName('a')) {
			if(link.href.indexOf('/album/') > 0 &&
				link.href.indexOf('bandcamp.com') > 0 &&
				!blocked.includes(link.href)) {
				albums[link.href] = null;
			}
		}
		return albums;
	})
	.catch(console.error);
}

function navigateToRandomAlbum() {
	let albumLinks = Object.keys(radio.albums);

	// If currently on an available album, remove it from the list
	if(albumLinks.includes(window.location.href))
		albumLinks.splice(albumLinks.indexOf(window.location.href), 1);

	radio.playing = albumLinks[Math.floor(Math.random() * albumLinks.length)];
	setItem('radio', radio)
	.then(() => {
		window.location.href = radio.playing;
	})
	.catch(console.error);
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

function block() {
	getItem('blocked')
	.then((values) => {
		let blocked = values.blocked || [];
		blocked.push(window.location.href);
		setItem('blocked', blocked)
		.then(() => {
			delete radio.albums[window.location.href];
			skip();
		})
		.catch(console.error);
	})
	.catch(console.error);
}

function play() {
	radio.origin = window.location.href;
	getAlbumList().then((albums) => {
		radio.albums = albums;
		navigateToRandomAlbum();
	});
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

	controls.addEventListener('click', play);

	document.body.appendChild(controls);
}

function skip() {
	document.getElementsByTagName('audio')[0].pause();
	navigateToRandomAlbum();
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

	controls.addEventListener('click', skip);

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

function stop() {
	removeItem('radio')
	.then(() => window.location.href = radio.origin)
	.catch(console.error);
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

	controls.addEventListener('click', stop);

	document.body.appendChild(controls);
}

function initPlayback() {
	addStop();
	addSkip();

	let currentAlbum = radio.albums[window.location.href];
	let playableTracks = document.querySelectorAll('.play_status:not(.disabled)');
	let filteredTracks = playableTracks;

	if(currentAlbum !== null) {
		// Filter already played tracks
		if(currentAlbum.played.length > 0) {
			filteredTracks = Array.from(playableTracks).filter(
				(track, idx) => (!currentAlbum.played.includes(idx))
			);
		}
	}
	else {
		// First time that this album is played

		// No playable tracks
		if(playableTracks.length === 0) {
			delete radio.albums[window.location.href];
			navigateToRandomAlbum();
		}
		else {
			currentAlbum = radio.albums[window.location.href] = {
				played: [],
				playableTracks: playableTracks.length,
			};
		}
	}

	// Delay playing, otherwise errors because of overlapping pause/play events
	setTimeout(() => {
		// PLAY
		let randomTrack = filteredTracks[Math.floor(Math.random() * filteredTracks.length)];
		randomTrack.click();

		setTimeout(() => browser.runtime.sendMessage({
			cmd: 'SET_ACTION_TITLE',
			// TODO: Better way of getting Artist/Title that's not dependent on DOM structure?
			title: 'Playing: ' +
				document.querySelectorAll('[itemprop="byArtist"]')[0].childNodes[1].innerHTML +
				' / '+
				document.getElementsByClassName('title_link')[0].childNodes[0].innerHTML,
		}), 500);

		// Navigate to random album once this track is done
		waitForTrackEnd(document.getElementsByTagName('audio')[0]);

		// Figure out idx of track that is being played and store it
		playableTracks.forEach((track, idx) => {
			if(track === randomTrack)
				currentAlbum.played.push(idx);
		});

		// All tracks will have been played when this one is done
		if(currentAlbum.played.length >= playableTracks.length) {
			delete radio.albums[window.location.href];
		}

		setItem('radio', radio).catch(console.error);
	}, 500);
}

(() => {
	getItem('radio')
	.then((values) => {
		if(browser.runtime.lastError || Object.keys(values).length === 0) {
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
	})
	.catch(console.error);
})();

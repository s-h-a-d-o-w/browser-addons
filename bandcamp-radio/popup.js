let cmdPlay = document.getElementById('cmdPlay');
let cmdSkip = document.getElementById('cmdSkip');
let cmdStop = document.getElementById('cmdStop');
let cmdBlock = document.getElementById('cmdBlock');

window.onload = () => {
	//document.getElementById("tabid").innerHTML = new Date();
	chrome.storage.local.get('blocked', (values) => {
		let blocked = values.blocked || [];
		document.getElementById('blocked').innerHTML = '<strong>Blocked</strong><br>' + blocked.join('<br>');
	});

	chrome.storage.local.get('radio', (values) => {
		let radio = values.radio;
		if(radio && radio.hasOwnProperty('playing')) {
			cmdPlay.disabled = true;
			cmdSkip.disabled = false;
			cmdStop.disabled = false;

			// Compile list of albums in key with number of tracks played and current one highlighted
			document.getElementById("albums").innerHTML = Object.keys(radio.albums).reduce((acc, album) => (
				acc
				+
				(album === radio.playing ?
					`<strong>${album}</strong>` :
					album)
				+
				(radio.albums[album] !== null ?
					' ' + radio.albums[album].played.length + '/' + radio.albums[album].playableTracks :
					'')
				+
				'<br>'
			), '<strong>Albums</strong><br>');

			cmdSkip.addEventListener('click', () => {
				chrome.tabs.sendMessage(radio.tabid, {
					cmd: 'SKIP'
				});
				window.close();
			});

			cmdStop.addEventListener('click', () => {
				chrome.tabs.sendMessage(radio.tabid, {
					cmd: 'STOP'
				});
				window.close();
			});

			cmdBlock.addEventListener('click', () => {
				chrome.tabs.sendMessage(radio.tabid, {
					cmd: 'BLOCK'
				});
				window.close();
			});
		}
		else {
			chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
				let tab = tabs[0];

				cmdPlay.disabled = false;
				cmdSkip.disabled = true;
				cmdStop.disabled = true;

				// Retrieve album list
				chrome.tabs.sendMessage(tab.id, {
					cmd: 'GET_ALBUMS_LIST'
				}, (response) => {
					document.getElementById("albums").innerHTML = '<strong>Detected</strong><br>' +
						Object.keys(response).join('<br>');
				});

				cmdPlay.addEventListener('click', () => {
					chrome.tabs.sendMessage(tab.id, {
						cmd: 'PLAY',
						tabid: tab.id
					});
					window.close();
				});
			});
		}
	});
};

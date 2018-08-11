let cmdPlay = document.getElementById('cmdPlay');
let cmdSkip = document.getElementById('cmdSkip');
let cmdStop = document.getElementById('cmdStop');
let cmdBlock = document.getElementById('cmdBlock');

function errorHandler(error) {
	body.innerHTML = error;
}

window.onload = () => {
	//document.getElementById("tabid").innerHTML = new Date();
	browser.storage.local.get('blocked')
	.then((values) => {
		let blocked = values.blocked || [];
		document.getElementById('blocked').innerHTML = '<strong>Blocked</strong><br>' + blocked.join('<br>');
	})
	.catch(errorHandler);

	browser.storage.local.get('radio')
	.then((values) => {
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
				browser.tabs.sendMessage(radio.tabid, {
					cmd: 'SKIP'
				});
				window.close();
			});

			cmdStop.addEventListener('click', () => {
				browser.tabs.sendMessage(radio.tabid, {
					cmd: 'STOP'
				});
				window.close();
			});

			cmdBlock.addEventListener('click', () => {
				browser.tabs.sendMessage(radio.tabid, {
					cmd: 'BLOCK'
				});
				window.close();
			});
		}
		else {
			browser.tabs.query({active: true, currentWindow: true})
			.then((tabs) => {
				let tab = tabs[0];

				cmdPlay.disabled = false;
				cmdSkip.disabled = true;
				cmdStop.disabled = true;

				// Retrieve album list
				browser.tabs.sendMessage(tab.id, {
					cmd: 'GET_ALBUMS_LIST'
				})
				.then((response) => {
					document.getElementById("albums").innerHTML = '<strong>Detected</strong><br>' +
						Object.keys(response).join('<br>');
				})
				.catch(errorHandler);

				cmdPlay.addEventListener('click', () => {
					browser.tabs.sendMessage(tab.id, {
						cmd: 'PLAY',
						tabid: tab.id
					});
					window.close();
				});
			})
			.catch(errorHandler);
		}
	})
	.catch(errorHandler);
};

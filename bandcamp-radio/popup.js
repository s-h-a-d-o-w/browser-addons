let cmdPlay = document.getElementById('cmdPlay');
let cmdSkip = document.getElementById('cmdSkip');
let cmdStop = document.getElementById('cmdStop');
let cmdBlock = document.getElementById('cmdBlock');

function errorHandler(error) {
	document.body.innerHTML = error;
	console.error(error);
}

window.onload = () => {
	browser.storage.local.get('blocked')
	.then((values) => {
		// Render block list
		let blocked = values.blocked || [];
		let blockedEl = document.getElementById('blocked');
		blockedEl.innerHTML = '<strong>Blocked</strong><br>' + blocked.join('<br>') + '<br>';

		// Saving of block list
		let saveList = document.createElement('a');
		saveList.innerHTML = 'Save ';
		if(blocked.length > 0) {
			let blob = new Blob([blocked.join('\n')], {type: 'text/plain'});
			saveList.href = URL.createObjectURL(blob);
			saveList.download = 'bandcamp-radio-blocklist.txt';
			blockedEl.appendChild(saveList);
		}

		// Loading of block list
		let input = document.createElement('input');
		input.type = 'file';
		input.accept = 'text/plain';
		input.style.opacity = 0;
		input.addEventListener('change', () => {
			let reader = new FileReader();
			reader.addEventListener("loadend", function() {
				browser.storage.local.set({blocked: reader.result.split('\n')})
				.then(() => console.log('Successfully loaded'))
				.catch(console.error);
			});
			reader.readAsText(input.files[0]);
		});
		let loadList = document.createElement('a');
		loadList.innerHTML = 'Load';
		loadList.href = '#';
		loadList.addEventListener('click', () => input.click());
		blockedEl.appendChild(loadList);
		blockedEl.appendChild(input);
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

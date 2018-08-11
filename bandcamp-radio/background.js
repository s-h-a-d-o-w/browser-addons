function isPlaying() {
	return new Promise((resolve, reject) => {
		browser.storage.local.get('radio')
		.then((values) => {
			let radio = values.radio;
			resolve(radio && radio.playing !== '');
		})
		.catch(reject);
	});
}

browser.runtime.onInstalled.addListener(function() {
	browser.browserAction.disable();
	browser.tabs.onActivated.addListener(function(activeInfo) {
		// console.log('activeInfo', activeInfo);
		isPlaying()
		.then((playing) => {
			if(playing) {
				browser.browserAction.enable(activeInfo.tabId);
			}
			else {
				browser.tabs.get(activeInfo.tabId)
				.then((tab) => {
					if(tab.url.match(/bandcamp.com/))
						browser.browserAction.enable(tab.id);
					else
						browser.browserAction.disable(tab.id);
				})
				.catch(console.error);
			}
		})
		.catch(console.error);
	});
	browser.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
		// console.log('changeInfo', changeInfo);
		// console.log('tab', tab);
		isPlaying()
		.then((playing) => {
			if(playing) {
				browser.browserAction.enable(tabId);
			}
			else {
				if(changeInfo.status === 'complete') {
					if(tab.url && tab.url.match(/bandcamp.com/))
						browser.browserAction.enable(tabId);
					else
						browser.browserAction.disable(tabId);
				}
			}
		});
	});
});

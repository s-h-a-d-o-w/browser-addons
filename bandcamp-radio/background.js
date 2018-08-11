chrome.runtime.onInstalled.addListener(function() {
	chrome.browserAction.disable();
	chrome.tabs.onActivated.addListener(function(activeInfo) {
		// console.log('activeInfo', activeInfo);
		chrome.tabs.get(activeInfo.tabId, (tab) => {
			if(tab.url.match(/bandcamp.com/))
				chrome.browserAction.enable(tab.id);
			else
				chrome.browserAction.disable(tab.id);
		})
	});
	chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
		// console.log('changeInfo', changeInfo);
		// console.log('tab', tab);
		if(changeInfo.status==='complete' && tab.url && tab.url.match(/bandcamp.com/))
			chrome.browserAction.enable(tabId);
		else
			chrome.browserAction.disable(tabId);
	});
});

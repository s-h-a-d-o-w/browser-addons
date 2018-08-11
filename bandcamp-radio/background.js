// When the extension is installed or upgraded ...
chrome.runtime.onInstalled.addListener(function() {
	// Replace all rules ...
	chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
		// With a new rule ...
		chrome.declarativeContent.onPageChanged.addRules([{
			// That fires when a page's URL contains a 'g' ...
			conditions: [
			  new chrome.declarativeContent.PageStateMatcher({
				pageUrl: { urlContains: 'bandcamp.com' },
			  })
			],
			// And shows the extension's page action.
			actions: [ new chrome.declarativeContent.ShowPageAction() ]
		}]);
  });
});

// browser.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
// 	if (changeInfo.url && changeInfo.status==='complete' && tab.url.match(/something/)) {
// 		browser.pageAction.show(tabId);
// 	} else {
// 		browser.pageAction.hide(tabId);
// 	}
// });

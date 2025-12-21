console.log('PseudoFill content script loaded')

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'fillForm') {
    // Form filling logic will go here
    console.log('Fill form with:', request.data)
    sendResponse({ success: true })
  }
})

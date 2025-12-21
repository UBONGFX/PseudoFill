console.log('PseudoFill background service worker started')

chrome.runtime.onInstalled.addListener(() => {
  console.log('PseudoFill extension installed')
})

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'generatePseudonym') {
    // Pseudonym generation logic will go here
    sendResponse({ pseudonym: 'generated_pseudonym' })
  }
})

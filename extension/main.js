// mectio content script

// Define browser API for Firefox/Chrome compatibility
var browser = browser || chrome;

// Call on background.js to switch extension icon
browser.runtime.sendMessage({
    action: "switchIcon",
    value: 1
});

console.log("mectio er i ALPHA. Der kan være fejl og mangler")
console.log("mectio: " + catchPhrases.get("loading"))

// Set tab icon
document.documentElement.innerHTML = ""

link = document.createElement('link');
link.rel = 'shortcut icon';
document.getElementsByTagName('head')[0].appendChild(link);

link.href = browser.runtime.getURL('/') + 'icons/icon-48.ico';

// Construct DOM then pass to windowManager
document.addEventListener("DOMContentLoaded", function() {
    // Log it
    console.log("mectio: starter init")
    document.documentElement.innerHTML = ""
    windowManager.init()

    test = new wmWindow();
})

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

window.stop();

console.log("mectio: vindue stoppet, starter init")

document.documentElement.innerHTML = ""
windowManager.init()

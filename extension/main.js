// mectio main script
// (ncs) 2020 kaynay
var browser = browser || chrome;

browser.runtime.sendMessage({
    action: "switchIcon",
    value: 1
});

console.log("mectio: Logging")


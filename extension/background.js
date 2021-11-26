var browser = browser || chrome;

function switchIcon(type) {
    // Skifter ikon.
    // 0 = inaktiv, 1 = aktiv

    switch (type) {
        case 0:
            path = "icons/icon-48-inactive.png"
        case 1:
            path = "icons/icon-48.png";
            break;
    }

    browser.browserAction.setIcon({
        "path": path
    })
}

function handleMessage(request) {
    switch (request.action) {
        case "switchIcon":
            switchIcon(request.value);
            break;
    }
}

function setInactive(request) {
    switchIcon(0);
}
  
browser.runtime.onMessage.addListener(handleMessage);
browser.tabs.onActivated.addListener(setInactive);

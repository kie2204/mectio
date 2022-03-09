var browser = browser || chrome;

// Load api
try {
    importScripts('/lectio-api/parse5.bundle.js', '/lectio-api/api.js');
} catch (e) {
    console.error(e);
}

function switchIcon(type) {
    // Skifter ikon.
    // 0 = inaktiv, 1 = aktiv
    var path;

    switch (type) {
        case 0:
            path = "icons/icon-48-inactive.png";
            break;
        case 1:
            path = "icons/icon-48.png";
            break;
    }

    browser.action.setIcon({
        "path": path
    })
}

function pageFetch(page) {
    fetch(page).then(response => response.text())
    .then(data => pageInner = data);

    return pageInner;
}

function handleMessage(request, sender, sendResponse) {
    switch (request.action) {
        case "switchIcon":
            switchIcon(request.value);
            break;
        case "fetch":
            pageInner = pageFetch(request.page);
            sendResponse({data: pageInner});
            break;
    }
    return true;
}

function setInactive(request) {
    switchIcon(0);
}
  
browser.runtime.onMessage.addListener(handleMessage);
browser.tabs.onActivated.addListener(setInactive);

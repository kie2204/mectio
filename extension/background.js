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

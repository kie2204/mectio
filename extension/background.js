const browser = browser || chrome;

// Load api
try {
    importScripts('/scripts/lectio-api/xmldom.bundle.js', '/scripts/lectio-api/api.js');
} catch (e) {
    console.error("FEJL: Kan ikke indlæse lectio api scripts")
    console.error(e);
}

function switchIcon(type) {
    // Skifter ikon.
    // 0 = inaktiv, 1 = aktiv
    let path;

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
        case "api":
            doApiRequest(request.call, request.args).then(r => sendResponse(r));
            break;
        case "api.data":
            console.log(request.call)
            console.log(request.args)
            doApiDataRequest(request.call, request.args).then(r => sendResponse(r));
            break;
        case "kill":
            startKill(sender.tab);
            break;
    }
    return true;
}

async function doApiRequest(call, args) {
    data = await lectioAPI[call](args[0], args[1], args[2])
    return data;

    /*switch (call) {
        case "getLoginStatus":
            data = await lectioAPI.getLoginStatus(args[0])
            return data;
        case "login":
            data = await lectioAPI.login(args[0], args[1], args[2])
            return data;
        case "getUserData":
            data = await lectioAPI.getUserData(args[0], args[1], args[2])
            return data;
        case "getNavLinks":
            data = await lectioAPI.getNavLinks(args[0])
            return data;
        case "getInstData":
            data = await lectioAPI.getInstData(args[0])
            return data;
    }*/
}

async function doApiDataRequest(call, args) {
    data = await lectioAPI.data[call](args[0], args[1], args[2])
    console.log(data)
    return data;
}

function setInactive(request) {
    switchIcon(0);
}

function startKill(tab) {
    browser.scripting.executeScript({
        target: {tabId: tab.id},
        files: ['scripts/lectioKILLER.js'],
        world: 'MAIN'
        // function: () => {}, // files or function, both do not work.
    })
}
  
browser.runtime.onMessage.addListener(handleMessage);
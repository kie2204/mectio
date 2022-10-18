// mectio MAIN content script

// Define browser API for Firefox/Chrome compatibility
var browser = browser || chrome;

var _LECTIO_BASE_URL = "https://www.lectio.dk"

var lecRequest = new LecRequest();
var auth = new Auth();
var loginScreen = new LoginScreen();
var windowManager2 = new WindowManager2();
var lecCompat = new LecCompat();

var mNavigator = new Navigator(); // variable navn "navigator" er reserveret

var currentUrlData = lecRequest.parseLink(window.location.href);

var init = async function() {
    console.log("mectio er i ALPHA. Der kan være fejl og mangler")

    await windowManager2.init()
    await lecCompat.init()

    await mNavigator.init({
        navElement: document.querySelector("nav")
    })
}

browser.storage.local.get(['config'], async function(config) {
    console.log(currentUrlData)

    var c = config.config;

    // Check if config valid
    if (typeof(c) != "object") {
        logs.info("Config invalid, resetting to default")
        var fetched = await fetch(browser.runtime.getURL('/config.mectio'))
        var defaultConfig = await fetched.json()

        await browser.storage.local.set({config: defaultConfig});
        c = (await browser.storage.local.get(['config'])).config;
    }

    // check if enabled
    if (c.enabled == 1) {
        if (document instanceof HTMLDocument) {
            // Her afbrydes lectio
            document.open(); 
            document.close();

            browser.runtime.sendMessage({
                action: "kill"
            });

            init();
        } else {
            console.log("mectio: Ikke et html-dokument, indlæser ikke")
        }
    }
});

// Config funktioner, skal flyttes

var loadConfig = async function(){
    var config = await browser.storage.local.get(['config']);

    if (typeof(config.config) != "object") {
        console.log("Config invalid, resetting to default")
        await setDefaultConfig();
        config = await browser.storage.local.get(['config']);
    }

    return config.config;
}

var saveConfig = function(config){
    browser.storage.local.set({config: config}, function() {
        console.log('Value is set to ' + config);
    });
}
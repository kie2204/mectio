// mectio MAIN content script

// Define browser API for Firefox/Chrome compatibility
var browser = browser || chrome;

const _LECTIO_BASE_URL = "https://www.lectio.dk";

const windowManager2 = new WindowManager2();
const lecCompat = new LecCompat();
const mNavigator = new MNavigator(); // variable navn "navigator" er reserveret

const currentUrlData = LecRequest.parseLink(window.location.href);

const init = async function () {
    console.log("mectio er i ALPHA. Der kan være fejl og mangler");

    await windowManager2.init();
    await lecCompat.init();

    mNavigator.addCallback(
        new NavCallback(lecCompat.load, {
            regex: [/./],
            includes: [],
            equal: [],
        })
    );

    await mNavigator.init(currentUrlData);
};

browser.storage.local.get(["config"], async function (config) {
    let configObject = config.config;

    // Check if config valid
    if (!(configObject instanceof Object)) {
        logs.info("Config invalid, resetting to default");
        var fetched = await fetch(browser.runtime.getURL("/config.mectio"));
        configObject = await fetched.json();

        await browser.storage.local.set({ config: configObject });
    }

    // check if enabled
    if (configObject.enabled != 1) return

    // run the real
    if (
        document.documentElement instanceof HTMLHtmlElement &&
        document.contentType == "text/html"
    ) {
        // Her afbrydes lectio
        document.open();
        document.close();

        browser.runtime.sendMessage({
            action: "kill",
        });

        init();
    } else {
        console.log("mectio: Ikke et html-dokument, indlæser ikke");
    }
});

// Config funktioner, skal flyttes

const loadConfig = async function () {
    let config = await browser.storage.local.get(["config"]);

    if (typeof config.config != "object") {
        console.log("Config invalid, resetting to default");
        await setDefaultConfig();
        config = await browser.storage.local.get(["config"]);
    }

    return config.config;
};

const saveConfig = function (config) {
    browser.storage.local.set({ config: config }, function () {
        console.log("Value is set to " + config);
    });
};

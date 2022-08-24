// mectio MAIN content script

// Define browser API for Firefox/Chrome compatibility
var browser = browser || chrome;

var _LECTIO_BASE_URL = "https://www.lectio.dk"

var lecRequest = new LecRequest();
var auth = new Auth();
var loginScreen = new LoginScreen();
var windowManager2 = new WindowManager2();
var lecCompat = new LecCompat();

var currentUrlData = lecRequest.parseLink(window.location.href);

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
        // Her afbrydes lectio
        document.open(); 
        document.close();

        browser.runtime.sendMessage({
            action: "kill"
        });

        init();
    }
});

var init = async function() {
    console.log("mectio er i ALPHA. Der kan være fejl og mangler")

    await windowManager2.init()
    await lecCompat.init()
    windowManager2.headerState = 0;

    var navigator = new Navigator({
        navElement: document.querySelector("nav"),
        wmInstance: windowManager2
    });

    navigator.init();
}

/*
var loadNavLinks = async function(url) {
    navLinks = await browser.runtime.sendMessage({
        action: "api",
        call: "getNavLinks",
        args: [url]
    });

    var nLContainer = document.getElementsByClassName("mectio-nav-link-container")[0];

    nLContainer.innerHTML = "";
    
    if (Array.isArray(navLinks.links) == false || navLinks.links.length == 0) {
        windowManager2.headerState = 1;
        return;
    } else {
        windowManager2.headerState = 2;
    }

    for (var x of navLinks.links) {
        var navLink = document.createElement("a")
        navLink.appendChild(document.createTextNode(x.name))
        navLink.setAttribute("href", x.href)
        if (x.active) {
            navLink.classList.add("active")
        }

        nLContainer.appendChild(navLink);

        navLink.addEventListener("click", function(e){
            e.preventDefault();

            loadPage({link: document.activeElement.href}, 1);
        })
    }
}
*/
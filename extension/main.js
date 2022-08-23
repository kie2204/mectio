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
console.log(currentUrlData)


// extension local config
var getConfig = async function(attr) {
    var conf = await browser.storage.local.get(['config'])
    return conf.config[attr]
}

// Læs config, hvis aktiv afbryd Lectio og indlæs mectio
getConfig("enabled").then((value) => {
    if (value == false)
        return;
        
    // Her afbrydes lectio
    document.open(); 
    document.close();

    browser.runtime.sendMessage({
        action: "kill"
    });
})

var startInit = async function() {
    logs.info("mectio er i ALPHA. Der kan være fejl og mangler")

    await windowManager2.init()
    await lecCompat.init()
    windowManager2.headerState = 0;

    var navigator = new Navigator({
        navElement: document.querySelector("nav"),
        wmInstance: windowManager2
    });

    navigator.init();
}

var doUserInit = async function(inst) {
    defaultInst = inst;
    windowManager2.headerState = 1;

    loginStatus = await browser.runtime.sendMessage({
        action: "api",
        call: "getLoginStatus",
        args: [inst]
    });

    instName = await browser.runtime.sendMessage({
        action: "api",
        call: "getInstData",
        args: [inst]
    });

    windowManager2.instName = instName.name;

    currentUserData = await browser.runtime.sendMessage({
        action: "api",
        call: "getUserData",
        args: [loginStatus.inst, loginStatus.userId, loginStatus.userType]
    });

    document.getElementById("mectio-profile").href = `https://www.lectio.dk/lectio/${loginStatus.inst}/logout.aspx`
    document.getElementById("mectio-profile-picture").style.backgroundImage = `url(${currentUserData.userPfpUrl})`
}

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

browser.storage.local.get(['config'], async function(config) {
    var x = config.config;

    // Check if config valid
    if (typeof(x) != "object") {
        logs.info("Config invalid, resetting to default")
        var fetched = await fetch(`${browser.runtime.getURL('/')}config.mectio`)
        var defaultConfig = await fetched.json()

        await browser.storage.local.set({config: defaultConfig});
        x = (await browser.storage.local.get(['config'])).config;
    }

    // check if enabled
    if (x.enabled == 1) {
        startInit();
    }
});
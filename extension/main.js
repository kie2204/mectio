// mectio MAIN content script

// Define browser API for Firefox/Chrome compatibility
var browser = browser || chrome;

var defaultInst = 0;
var loginStatus;
var currentUserData;

var _LECTIO_BASE_URL = "https://www.lectio.dk"

var lecRequest = new LecRequest();
var auth = new Auth();

var loginScreen = new LoginScreen();

var windowManager2 = new WindowManager2();

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
    windowManager2.headerState = 0;

    var navigator = new Navigator({
        navElement: document.querySelector("nav"),
        wmInstance: windowManager2
    });

    var loginScreen = new LoginScreen({
        defaultInst: 0,
        submitCallback: auth.login
    });

    loginStatus = await Promise.resolve(auth.loginStatus);
    
    if (loginStatus.loginStatus == 1) {
        await doUserInit(loginStatus.inst);
        loadPage({link: window.location.href});
    } else {
        loginScreen.openWindow();
    }

    document.getElementById("mectio-profile").addEventListener("click", async function(e){
        e.preventDefault();
        auth.logout();
    })
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

var loadPage = async function(data, push) {
    window.scrollTo({
        top: 0, 
        behavior: "smooth"
    })

    var page = lecRequest.parseLink(data.link);

    if (push == 1) {
        window.history.pushState({}, "", page.url)
    }

    // Tjek om vindue er åbent
    var matchingWindows = windowManager2.searchWindowData({url:page.url})

    if (Object.keys(matchingWindows).length >= 1) {
        console.log("Matchende vindue allerede åbent, viser...")
        var match = Object.keys(matchingWindows)[0];
        windowManager2.showWindow(match)
        windowManager2.activeWindow = match;

        return true;
    }

    var src = "";

    if (typeof(page.page) == "string") {
        switch (page.page) {
            case "forside":
                if (await getConfig("dummyFrontPage") == 1) {
                    await pageLoaders.forside(page.link);
                    return;
                } else {
                    loadCompatibilityPage(page.link)
                }
            default:
                return;
        }
    } else {
        src = page.url;
        loadCompatibilityPage(src)
    }
}

var loadCompatibilityPage = async function(src) {
    console.log("Source, ", src)
    var data = lecRequest.parseLink(src)

    var unhide = 0;
    if (await getConfig("compatHideUntilLoad") == 1) {
        unhide = 1;
    }

    var frame = document.createElement("iframe")
    loadNavLinks(src)

    frame.setAttribute("src", src)
    frame.setAttribute("scrolling", "no")

    // Decorate iframe
    frame.style.transition = "filter 0.2s";
    frame.style.width = "100%";
    frame.style.border = "none";
    frame.style.backgroundColor = "#ccc";

    var wm2 = windowManager2.createWindow({
        hidden: unhide,
        data
    })

    // Append frame to window
    wm2.windowElement.appendChild(frame);
    frame.contentWindow.addEventListener("load", function () {
        reloadFrameScript(frame, wm2);
        windowManager2.activeWindow = wm2.id;
    });
}

var reloadFrameScript = function(frame, wm) {
    frame.contentWindow.addEventListener("unload", function(){
        windowManager2.hideWindow(wm.id);

        setTimeout(function(){
            frame.contentWindow.addEventListener("load", function() {
                window.history.replaceState({}, "", frame.contentWindow.location.href)
                wm.data = lecRequest.parseLink(frame.contentWindow.location.href)
                reloadFrameScript(frame, wm)
            })
        }, 100)
    })

    loadCompatibilityScripts(frame)
    windowManager2.showWindow(wm.id);
}

var loadCompatibilityScripts = function(frame){
    var doc = frame.contentWindow.document;
    
    // Inject CSS with link
    var injCSS = doc.createElement("link");
    var injCSSHref = browser.runtime.getURL('pages/styles/lectioCompatibilityInject.css')
    injCSS.setAttribute("rel", "stylesheet")
    injCSS.setAttribute("href", injCSSHref)
    doc.head.appendChild(injCSS)

    // Inject CSS with link
    var injScript = doc.createElement("script");
    var injScriptSrc = browser.runtime.getURL('scripts/lectioKILLER-frame.js')
    injScript.setAttribute("src", injScriptSrc)
    doc.head.appendChild(injScript)

    try {
        doc.getElementsByTagName("header")[0].style.display = "none";
        doc.getElementById("s_m_HeaderContent_subnav_div").style.display = "none";

        var row2 = doc.getElementById("s_m_HeaderContent_subnavigator_genericSecondRow_tr")
        if (row2 != null) {
            doc.getElementById("s_m_outerContentFrameDiv").prepend(row2)
        }
    } catch (e) {
        logs.info("Error: " + e)
    }

    for (var x of frame.contentWindow.document.getElementsByTagName("a")) {
        var onclick = x.getAttribute("onclick");
        var lecCommand = x.getAttribute("lec-command");
        var dataCommand = x.getAttribute("data-command");

        if (typeof(onclick) != "string" && typeof(lecCommand) != "string" && typeof(dataCommand) != "string" && x.href.includes("https://www.lectio.dk/")) {
            x.addEventListener("click", function(e){
                e.preventDefault();
                loadPage({link: frame.contentWindow.document.activeElement.href}, 1)
            })
        }
    }

    setTimeout(function() { 
        var body = frame.contentDocument.body;
        var html = frame.contentDocument.documentElement;

        console.log(frame.contentDocument.body, body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);

        var height = Math.max( body.scrollHeight, body.offsetHeight, 
            html.clientHeight, html.scrollHeight, html.offsetHeight );

        console.log(frame, "Height: ", height)
        
        frame.style.height = `${height*2}px`;
        frame.style.filter = "";
    }, 1)
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
        setListeners();
    }
});

var setListeners = function() {
    startInit();

    window.addEventListener("popstate", function(){
        logs.info("State pop")
        loadPage({link: window.location.href})
    })
}
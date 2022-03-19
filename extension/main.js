// mectio content script

// Define browser API for Firefox/Chrome compatibility
var browser = browser || chrome;

var defaultInst = 0;
var loginStatus;

var getLocalPage = async function(page) {
    return new Promise(resolve => {
        fetch(browser.runtime.getURL(page)).then(r => r.text()).then(html => {
            var parser = new DOMParser();
            parsedText = parser.parseFromString(html, "text/html");

            links = parsedText.querySelectorAll("*"); // Probably bad for performance
            for (var x of links) {
                var href = x.getAttribute("href");
                var src = x.getAttribute('src');

                if (typeof(href) == "string" && href.substr(0,4) != "http") {
                    x.href = browser.runtime.getURL('/') + href;
                }
                if (typeof(src) == "string" && src.substr(0,4) != "http") {
                    x.src = browser.runtime.getURL('/') + src;
                }
            }

            result = parsedText.getRootNode().body.innerHTML;
            resolve(result);
        });
    });
}

var startInit = async function() {
    // Call on background.js to switch extension icon
    browser.runtime.sendMessage({
        action: "switchIcon",
        value: 1
    });

    logs.info("mectio er i ALPHA. Der kan være fejl og mangler")
    logs.info(catchPhrases.get("loading"))

    // Interrupt loading
    document.open();
    document.close();

    // Set tab icon
    link = document.createElement('link');
    link.rel = 'shortcut icon';
    document.getElementsByTagName('head')[0].appendChild(link);

    link.href = browser.runtime.getURL('/') + 'icons/icon-48.ico';

    // Log it
    logs.info("starter init")
    document.documentElement.innerHTML = ""
    await windowManager.init();

    loginStatus = await browser.runtime.sendMessage({
        action: "api",
        call: "getLoginStatus",
        args: [getInstFromLink(window.location.href)]
    });

    if (loginStatus.loginStatus == 1) {
        await doUserInit(loginStatus.inst);
        loadPage(getPageFromLink(window.location.href));
    } else {
        showLoginPage();
    }

    document.getElementById("mectio-profile").addEventListener("click", async function(e){
        e.preventDefault();

        for (var prop of windowManager.registeredWindows) {
            windowManager.close(prop.id)
        }

        await browser.runtime.sendMessage({
            action: "api",
            call: "logout",
            args: []
        });

        showLoginPage();
    })
}

var doUserInit = async function(inst) {
    defaultInst = inst;
    windowManager.setHeaderState(1)

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
    windowManager.toggleInstName(1, instName.name)

    userPfpLink = await browser.runtime.sendMessage({
        action: "api",
        call: "getUserData",
        args: [loginStatus.inst, loginStatus.userId, loginStatus.userType]
    });

    document.getElementById("mectio-profile").href = `https://www.lectio.dk/lectio/${loginStatus.inst}/logout.aspx`
    document.getElementById("mectio-profile-picture").style.backgroundImage = `url(${userPfpLink.userPfpUrl})`
}

var showLoginPage = async function() {
    var loginPage = new wmWindow("mectio-login");
    loginPage.element.innerHTML = await getLocalPage("/pages/login.html");
    windowManager.setHeaderState(0)

    // Tilføj institutioner til dropdown
    var selectMenu = document.getElementById("mf-inst")
    var instList = await browser.runtime.sendMessage({
        action: "api",
        call: "getInstList",
        args: []
    });

    logs.info(instList)

    for (var x of instList.instList) {
        var el = document.createElement("option");
        var text = document.createTextNode(x.name);
        el.setAttribute("value", x.id)
        el.appendChild(text)
        selectMenu.appendChild(el);
    }

    selectMenu.value = getInstFromLink(window.location.href);

    document.getElementById("mectio-login-form").addEventListener("submit", submitLoginForm);
}

var submitLoginForm = async function(e) {
    e.preventDefault();
    var theForm = document.getElementById("mectio-login-form")

    var inst = document.getElementById("mf-inst").value
    var uname = document.getElementById("mf-uname").value
    var pword = document.getElementById("mf-pword").value

    logs.info(`Logger ind på inst. id ${inst} med brugernavn ${uname}`)

    loginStatus = await browser.runtime.sendMessage({
        action: "api",
        call: "login",
        args: [inst, uname, pword]
    });

    if (loginStatus.loginStatus == 1) {
        windowManager.close("mectio-login");

        await doUserInit(inst);
        loadPage({page: "forside"}, 1);
    } else {
        alert("Bruh")
    }
}

var loadPage = async function(page, push) {
    var src = "";
    
    if (typeof(page.page) == "string") {
        switch (page.page) {
            case "forside":
                if (await getConfig("dummyFrontPage") == 1) {
                    await pageLoaders.forside();
                    return;
                } else {
                    loadCompatibilityPage(page.link, push)
                }
            default:
                return;
        }
    } else {
        src = page.link;
        loadCompatibilityPage(src, push)
    }
}

var pageLoaders = {
    forside: async function(link) {
        if (typeof link == "undefined") {
            link = `${window.location.origin}/lectio/${defaultInst}/forside.aspx`
        }
        window.history.pushState({}, "", link);

        var prevWindow = windowManager.activeWindow;
        var wmwindow = new wmWindow(0, 1);
        var page = await getLocalPage("/pages/mectio/forside/forside.html")

        await loadNavLinks(link);
        wmwindow.element.innerHTML = page;
        windowManager.close(prevWindow)

        userData = await browser.runtime.sendMessage({
            action: "api",
            call: "getUserData",
            args: [loginStatus.inst, loginStatus.userId, loginStatus.userType]
        });

        var fName = userData.userFullName.substr(0, userData.userFullName.indexOf(" "))

        wmwindow.element.querySelector("#main-title-left").querySelector("h1").innerText = fName + "!"
        wmwindow.appear();
    },
    skema: async function() {
        var src = `/lectio/${defaultInst}/SkemaNy.aspx`
        loadNavLinks(window.location.origin + src)

        var wmwindow = new wmWindow();
        var page = await getLocalPage("/pages/mectio/forside.html")
        wmwindow.element.innerHTML = page;

        windowManager.close(prevWindow)
        window.history.pushState({}, "", src)
    }
}

var loadCompatibilityPage = async function(src, push) {
    var unhide = 0;
    if (getConfig("compatHideUntilLoad") == 1) {
        unhide = 1;
    }

    var frame = document.createElement("iframe")
    loadNavLinks(src)

    if (push == 1) {
        window.history.pushState({}, "", src)
    }
    
    var prevWindow = windowManager.activeWindow;
    windowManager.close(prevWindow)

    frame.setAttribute("src", src)
    frame.setAttribute("scrolling", "no")

    // Decorate iframe
    frame.style.transition = "filter 0.2s";
    frame.style.width = "100%";
    frame.style.border = "none";
    frame.style.backgroundColor = "#ccc";

    var wmwindow = new wmWindow(0, unhide);

    // Append frame to window
    wmwindow.element.appendChild(frame)
    frame.contentWindow.addEventListener("load", function() {
        reloadFrameScript(frame, wmwindow)
    })
}

var reloadFrameScript = function(frame, wmwindow) {
    frame.contentWindow.addEventListener("unload", function(){
        wmwindow.hide();

        setTimeout(function(){
            frame.contentWindow.addEventListener("load", function() {
                window.history.replaceState({}, "", frame.contentWindow.location.href)
                reloadFrameScript(frame, wmwindow)
            })
        }, 100)
    })

    loadCompatibilityScripts(frame)
    wmwindow.appear();
}

var loadCompatibilityScripts = function(frame){
    var doc = frame.contentWindow.document;
    
    // Inject CSS with link
    var injCSS = doc.createElement("link");
    var injCSSHref = `${browser.runtime.getURL('/')}pages/styles/lectioCompatibilityInject.css`
    injCSS.setAttribute("rel", "stylesheet")
    injCSS.setAttribute("href", injCSSHref)
    doc.head.appendChild(injCSS)

    try {
        doc.getElementsByTagName("header")[0].style.display = "none";
        doc.getElementById("s_m_HeaderContent_subnav_div").style.display = "none";
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
                loadPage(getPageFromLink(frame.contentWindow.document.activeElement.href), 1)
            })
        }
    }

    var body = frame.contentWindow.document.body;
    var html = frame.contentWindow.document.documentElement;

    var height = Math.max( body.scrollHeight, body.offsetHeight, 
        html.clientHeight, html.scrollHeight, html.offsetHeight );
    
    frame.style.height = `${height*2}px`;
    frame.style.filter = "";
}

var loadNavLinks = async function(url) {
    navLinks = await browser.runtime.sendMessage({
        action: "api",
        call: "getNavLinks",
        args: [url]
    });

    document.getElementById("mectio-nav-links").innerHTML = "";
    
    if (Array.isArray(navLinks.links) == false || navLinks.links.length == 0) {
        windowManager.setHeaderState(1)
        return;
    } else {
        windowManager.setHeaderState(2)
    }

    for (var x of navLinks.links) {
        var navLink = document.createElement("a")
        navLink.appendChild(document.createTextNode(x.name))
        navLink.setAttribute("href", x.href)
        if (x.active) {
            navLink.classList.add("active")
        }

        document.getElementById("mectio-nav-links").appendChild(navLink);

        navLink.addEventListener("click", function(e){
            e.preventDefault();

            loadPage(getPageFromLink(document.activeElement.href), 1);
        })
    }
}

var getInstFromLink = function(link) {
    return parseInt(link.substr(link.indexOf("/lectio/")+8).substr(0,link.substr(link.indexOf("/lectio/")+8).indexOf("/")))
}

var getPageFromLink = function(link) {
    var instId = getInstFromLink(link)
    var page;

    if (link.includes(`https://www.lectio.dk/lectio/${instId}/forside.aspx`)) {
        page = "forside"   
    }

    logs.info({
        link: link,
        page: page
    })

    return {
        link: link,
        page: page
    };
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

    currentConfig = config;

    // check if enabled
    if (x.enabled == 1) {
        setListeners();
    }
});

var setListeners = function() {
    startInit();

    window.addEventListener("popstate", function(){
        logs.info("State pop")
        loadPage( // Very clunky but it works
            getPageFromLink(window.location.href)
        )
    })
}

var getConfig = async function(attr) {
    var conf = await browser.storage.local.get(['config'])

    return conf.config[attr]
}
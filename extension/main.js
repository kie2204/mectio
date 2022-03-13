// mectio content script

// Define browser API for Firefox/Chrome compatibility
var browser = browser || chrome;

// Call on background.js to switch extension icon
browser.runtime.sendMessage({
    action: "switchIcon",
    value: 1
});


console.log("mectio er i ALPHA. Der kan være fejl og mangler")
console.log("mectio: " + catchPhrases.get("loading"))

// Set tab icon
document.documentElement.innerHTML = ""

link = document.createElement('link');
link.rel = 'shortcut icon';
document.getElementsByTagName('head')[0].appendChild(link);

link.href = browser.runtime.getURL('/') + 'icons/icon-48.ico';

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

// Construct DOM then pass to windowManager
document.addEventListener("DOMContentLoaded", async function() {
    // Log it
    console.log("mectio: starter init")
    document.documentElement.innerHTML = ""
    await windowManager.init();

    loginStatus = await browser.runtime.sendMessage({
        action: "api",
        call: "getLoginStatus",
        args: [680]
    });

    if (loginStatus.loginStatus == 1) {
        userPfpLink = await browser.runtime.sendMessage({
            action: "api",
            call: "getUserData",
            args: [loginStatus.inst, loginStatus.userId, loginStatus.userType]
        });
        document.getElementById("mectio-profile-picture").style.backgroundImage = `url(${userPfpLink.userPfpUrl})`
        loadSitePage();
    } else {
        showLoginPage();
    }
})

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

    console.log(instList)

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

    loginStatus = await browser.runtime.sendMessage({
        action: "api",
        call: "login",
        args: [inst, uname, pword]
    });

    if (loginStatus.loginStatus == 1) {
        windowManager.close("mectio-login");
        loadSitePage(inst, "forside", 1);

        userPfpLink = await browser.runtime.sendMessage({
            action: "api",
            call: "getUserData",
            args: [loginStatus.inst, loginStatus.userId, loginStatus.userType]
        });
        document.getElementById("mectio-profile-picture").style.backgroundImage = `url(${userPfpLink.userPfpUrl})`
    } else {
        alert("Bruh")
    }
}

var loadSitePage = async function(instId, page, push) {
    windowManager.close(windowManager.activeWindow)
    windowManager.setHeaderState(2)

    var wmwindow = new wmWindow();
    var frame = document.createElement("iframe")
    var src = "";
    
    if (typeof(page) == "string") {
        switch (page) {
            case "forside":
                src = "https://www.lectio.dk/lectio/" + instId + "/forside.aspx"
                break;
            default:
                src = page;
        }
    } else {
        src = window.location.href;
    }

    loadNavLinks(src)

    instName = await browser.runtime.sendMessage({
        action: "api",
        call: "getInstData",
        args: [getInstFromLink(src)]
    });
    windowManager.toggleInstName(1, instName.name)

    if (push == 1) {
        window.history.pushState({}, "", src)
    }

    frame.setAttribute("src", src)
    frame.setAttribute("scrolling", "no")

    // Decorate iframe
    frame.style.transition = "filter 0.2s";
    frame.style.width = "100vw";
    frame.style.height = "100vw";
    frame.style.border = "none";
    frame.style.backgroundColor = "#ccc";
    frame.style.filter = "invert(0.5)";

    // Append frame to window
    wmwindow.element.appendChild(frame)
    frame.contentWindow.addEventListener("load", function(){
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
            console.log("Error: " + e)
        }
        
        frame.style.height = `${frame.contentWindow.document.documentElement.scrollHeight}px`;
        frame.style.filter = "";

        for (var x of frame.contentWindow.document.getElementsByTagName("a")) {
            x.addEventListener("click", function(e){
                e.preventDefault();
                loadSitePage("", frame.contentWindow.document.activeElement.href, 1)
            })
        }
    })
}

var loadNavLinks = async function(url) {
    windowManager.setHeaderState(1)

    navLinks = await browser.runtime.sendMessage({
        action: "api",
        call: "getNavLinks",
        args: [url]
    });

    document.getElementById("mectio-nav-links").innerHTML = "";

    for (var x of navLinks.links) {
        var navLink = document.createElement("a")
        navLink.appendChild(document.createTextNode(x.name))
        navLink.setAttribute("href", x.href)

        document.getElementById("mectio-nav-links").appendChild(navLink);

        navLink.addEventListener("click", function(e){
            e.preventDefault();

            loadSitePage("", document.activeElement.href, 1);
        })
    }

    if (navLinks.links.length == 0) {
        windowManager.setHeaderState(1)
    } else {
        windowManager.setHeaderState(2)
    }
}

window.addEventListener("popstate", function(){
    console.log("State pop")
    loadSitePage(
        getInstFromLink(window.location.href), // Very clunky but it works
        window.location.href
    )
})

window.addEventListener("load", function(){
    console.log("Event fire")
    removeLectioScripts();
})

var removeLectioScripts = function() {
    console.log("Sending")
    browser.runtime.sendMessage({
        action: "startKill",
    });
}

var getInstFromLink = function(link) {
    return parseInt(link.substr(link.indexOf("/lectio/")+8).substr(0,link.substr(link.indexOf("/lectio/")+8).indexOf("/")))
}
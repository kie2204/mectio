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
            for (i = 0, le = links.length; i < le; i++) {
                links[i].href = browser.runtime.getURL('/') + links[i].getAttribute('href');
                links[i].src = browser.runtime.getURL('/') + links[i].getAttribute('src');
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
        loadSitePage();
    } else {
        showLoginPage();
    }
})

var showLoginPage = async function() {
    var loginPage = new wmWindow("mectio-login");
    loginPage.element.innerHTML = await getLocalPage("/pages/login.html");
    windowManager.setHeaderState(0)

    document.getElementById("mf-submit").addEventListener("click", submitLoginForm);
}

var submitLoginForm = async function() {
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
        loadSitePage(inst, "forside");
    } else {
        alert("Bruh")
    }
}

var loadSitePage = async function(instId, page) {
    windowManager.setHeaderState(2)

    var test = new wmWindow();
    var frame = document.createElement("iframe")
    var src = "";
    
    switch (page) {
        case "forside":
            src = "https://www.lectio.dk/lectio/" + instId + "/forside.aspx"
            break;
        default:
            src = window.location.href;
    }

    frame.setAttribute("src", src)
    frame.setAttribute("scrolling", "no")
    window.history.pushState({}, "", src)
    
    frame.style.transition = "filter 0.2s";
    frame.style.width = "100vw";
    frame.style.height = "100vw";
    frame.style.border = "none";
    frame.style.backgroundColor = "#aaa";
    frame.style.filter = "invert(0.5)";

    test.element.appendChild(frame)
    frame.contentWindow.addEventListener("load", function(){
        var doc = frame.contentWindow.document;

        doc.getElementsByTagName("header")[0].style.display = "none";
        doc.getElementById("s_m_HeaderContent_subnav_div").style.display = "none";
        
        frame.style.height = `${frame.contentWindow.document.documentElement.scrollHeight}px`;
        frame.style.filter = "";
    })
}

window.addEventListener("load", removeLectioScripts)

var removeLectioScripts = function() {
    console.log(window.SessionHelper)
    // Fjern lectio SessionHelper (den kører i baggrunden og logger en ud)
    window.SessionHelper = "";
}
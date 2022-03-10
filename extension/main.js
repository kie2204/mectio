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

    console.log(loginStatus)

    if (loginStatus.loginStatus == 1) {
        var test = new wmWindow();
        var frame = document.createElement("iframe")
        frame.setAttribute("src", window.location.href)
        frame.style.width = "100%";
        frame.style.height = "100vh";
        test.element.appendChild(frame)
    } else {
        showLoginPage();
    }
})

var showLoginPage = async function() {
    var test = new wmWindow();
    test.element.innerHTML = await getLocalPage("/pages/login.html");
    windowManager.setHeaderState(0)

    test.element.addEventListener("click", test.close)
}
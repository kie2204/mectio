// @ts-check

// mectio navigation manager
// Handles page loads, redirects, navbar
class NavCallback {
    /**
     *
     * @param {Function} callback
     * @param {Object} matches
     * @param {?Array} matches.regex
     * @param {?Array} matches.includes
     * @param {?Array} matches.equal
     */
    constructor(callback, matches) {
        this.callback = callback;
        this.matches = {
            regex: matches.regex || [],
            includes: matches.includes || [],
            equal: matches.equal || [],
        };
    }

    /**
     *
     * @param {String} str
     */
    checkMatch(str) {
        // Tjek lig med
        if (this.matches.equal.length > 0) {
            for (var match of this.matches.equal) {
                if (str == match) {
                    console.log(match, str);
                    return true;
                }
            }
        }

        if (this.matches.includes.length > 0) {
            for (var match of this.matches.includes) {
                if (str.includes(match)) {
                    console.log(match, str);
                    return true;
                }
            }
        }

        if (this.matches.regex.length > 0) {
            for (var match of this.matches.regex) {
                if (match.test(str)) {
                    console.log(match, str);
                    return true;
                }
            }
        }

        return false;
    }
}

class MNavigator {
    constructor(_lecPath) {
        // Init libs
        this.parser = new DOMParser();

        // PageData
        if (_lecPath instanceof LecPath) {
            this.path = _lecPath
        } else {
            this.path = LecRequest.parseLink(window.location.href)
        }

        const _auth = new Auth(this.path.inst)

        this.lib = {
            auth: _auth,
            loginScreen: new LoginScreen(_auth, NaN),
            windowManager: new WindowManager2(),
        };

        // Init variables
        this.urlCallbacks = [
            // Liste af URL-callbacks
        ];
    }

    /**
     *
     * @param {NavCallback} callback
     */
    addCallback(callback) {
        this.urlCallbacks.splice(0, 0, callback);
    }

    async init(args) {
        // Aktiver ikon
        this.setIconListeners();
        this.applyIcon();

        // Type checks
        this.navElement = document.getElementById("nav")
        var localPath = this.path.localPath;

        windowManager2.headerState = 2;

        console.log(new LecGroup("elev", "100"));
    }

    userInit() {
        // Forbered nuværende bruger
    }

    setIconListeners() {
        // Listeners for aktiv/inaktiv tab
        window.addEventListener("focus", function () {
            browser.runtime.sendMessage({
                action: "switchIcon",
                value: 1,
            });
        });

        window.addEventListener("blur", function () {
            browser.runtime.sendMessage({
                action: "switchIcon",
                value: 0,
            });
        });

        return console.debug("Navigation: Ikon aktiveret");
    }

    applyIcon() {
        // Skift sideikon
        var link = document.createElement("link");
        link.rel = "shortcut icon";
        console.log(document.getElementsByTagName("head")[0]);
        document.getElementsByTagName("head")[0].appendChild(link);

        link.href = browser.runtime.getURL("icons/icon-48.ico");

        document.title = "mectio";
    }

    async showLogin(inst) {
        loginScreen.inst = inst;
        return loginScreen.waitForLogin();
    }

    async load(_lecPath) {
        // Find callBACK
        const callbacks = this.urlCallbacks;
        let filteredCallbacks = callbacks.filter((_callback) => {
            return _callback.checkMatch(_lecPath.url);
        });

        console.log(filteredCallbacks);

        const callback = filteredCallbacks[0].callback;
        if (callback instanceof Function) {
            const _lecRes = await callback(_lecPath, this.update);

            this.update(_lecRes);
            return _lecRes;
        } else {
            alert("Ingen callback fundet!")
        }
    }

    /**
     *
     * @param {LecResponse} _lecRes
     * @returns
     */

    update(_lecRes) {
        // Opdaterer navigation
        if (!(_lecRes instanceof LecResponse))
            throw "Nav fejl: Ingen LecResponse, kan ikke opdatere!";
        console.debug("Opdaterer:", _lecRes);

        this.currentPage = _lecRes.path.url;

        this.updateNavBar(_lecRes);

        document.title = `${this.currentPage} - mectio`;
        window.history.replaceState("", "", this.currentPage);

        console.log(_lecRes.auth);

        return auth.updateLoginStatus(_lecRes);
    }

    /**
     *
     * @param {LecResponse} _lecRes
     * @returns
     */

    updateNavBar(_lecRes) {
        var nav = this.parseSubnav(_lecRes.rawData);

        // Slet tidl. nav-gruppe (midlertidig fix)
        try {
            document.getElementsByClassName("mectio-nav-group")[0].remove();
        } catch (e) {
            console.log("Ingen nav gruppe slettet.");
        }

        var navLinks = document.getElementById("mectio-nav-links");

        var navTitle = document.getElementById("mectio-nav-title");
        navTitle.innerText = "id: " + nav.navCtxId; // todo

        if (typeof nav.links != "object") return;

        var navGroup = document.createElement("div");
        navGroup.classList.add("mectio-nav-group");

        for (var link of nav.links) {
            var el = document.createElement("a");

            el.innerText = link.name;
            el.href = link.href;
            if (link.active) el.classList.add("active");

            // Add click listener
            el.addEventListener("click", (e) => {
                e.preventDefault();
                this.load({
                    url: document.activeElement.href,
                });
            });

            navGroup.appendChild(el);
        }

        navLinks.appendChild(navGroup);
    }

    parseSubnav(data) {
        var parsedData = this.parser.parseFromString(data, "text/html");

        var navLinks = [];
        try {
            var navArray =
                parsedData.getElementsByClassName("ls-subnav1")[0].children;
        } catch (e) {
            return { error: "Ingen links fundet" };
        }

        let navTitle, navCtxId;

        try {
            navTitle = parsedData.getElementById("s_m_HeaderContent_MainTitle");
            // @ts-ignore
            navCtxId = navTitle.getAttribute("data-lectiocontextcard");
        } catch (e) {
            return { error: "" };
        }

        for (var i = 0; i < navArray.length; i++) {
            // Kører gennem alle links og tilføjer til array
            try {
                var navLink = navArray[i].children[0].getAttribute("href");
                // @ts-ignore
                var navActive = navArray[i]
                    .getAttribute("class")
                    .includes("ls-subnav-active");
                var navName = navArray[i].textContent;

                navLinks.push({
                    name: navName,
                    href: navLink,
                    active: navActive,
                });
            } catch (e) {}
        }

        if (navLinks.length == 0) {
            return { error: "Ingen links fundet" };
        }

        return {
            navCtxId,
            links: navLinks,
        };
    }
}

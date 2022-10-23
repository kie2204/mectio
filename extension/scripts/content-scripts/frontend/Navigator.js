// mectio navigation manager
// Handles page loads, redirects, navbar
class Navigator {
    constructor(args) {
        // Init libs
        this.parser = new DOMParser();
        this.lecRequest = new LecRequest();

        this.lib = {
            lecReq: new LecRequest(),
            auth: new Auth(),
            loginScreen: new LoginScreen(),
            windowManager: new WindowManager2(),
        };

        // Init variables
        this.urlCallbacks = [
            // Liste af URL-callbacks
            {
                callback: function () {},
                matches: ["*"],
                priority: 0,
            },
        ];

        // PageData
        this.currentPage = window.location.href; // Nuværende side
        this.pageData = this.lib.lecReq.parseLink(this.currentPage);
    }

    async init(args) {
        // Aktiver ikon
        this.setIconListeners();
        this.applyIcon();

        // Type checks
        this.navElement = args?.navElement ? args?.navElement : false; // typisk document.getElementById("nav")
        if (this.navElement instanceof Element == false)
            throw "Intet nav-element valgt!!";

        var loginState;
        var localPath = this.pageData.localPath || "";

        if (
            localPath.substring(0, 10).includes("login.aspx") ||
            this.pageData.url == "https://www.lectio.dk/"
        ) {
            loginState = await this.showLogin(this.pageData?.inst);

            this.userInit();
        }

        windowManager2.headerState = 2;
        this.load({
            url: loginState?.newUrl || this.currentPage,
        });
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

    async load(args) {
        var _lecRes = await lecCompat.load(args, this.update);

        this.update(_lecRes);
        return _lecRes;
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
                parsedData.getElementsByClassName("ls-subnav1")[0].childNodes;
        } catch (e) {
            return { error: "Ingen links fundet" };
        }

        var navTitle = parsedData.getElementById("s_m_HeaderContent_MainTitle");
        var navCtxId = navTitle.getAttribute("data-lectiocontextcard");

        for (var i = 0; i < navArray.length; i++) {
            // Kører gennem alle links og tilføjer til array
            try {
                var navLink = navArray[i].childNodes[0].getAttribute("href");
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

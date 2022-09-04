// mectio navigation manager
// Handles page loads, redirects, navbar
class Navigator {
    constructor(args) {
        // Init libs
        console.log("Navigator")
        this.parser = new DOMParser();

        // Init variables
        this.currentPage = window.location.href; // Nuværende side
        this.urlCallbacks = [ // Liste af URL-callbacks
            {
                callback: function(){},
                matches: ["*"],
                priority: 0
            }
        ] 
        this.currentUser = {
            signedIn: false,
            general: {
                userId: 0, 
                username: "",
                userType: 0
            },
            display: {
                pictureUrl: "",
                firstName: "",
                lastName: "",
            },
            studentInfo: {
                class: "", // eks. 1a
                groups: {
                    teams: [],
                    internalGroups: [],
                    otherGroups: []
                },
                studentId: "" // eks. 1a 23
            }
        }

        console.log("Navigator")
    }

    init(args) { 
        // Aktiver ikon
        this.setIconListeners()
        console.debug("Navigation: Ikon aktiveret")

        // Type checks
        this.navElement = args?.navElement ? args?.navElement : false; // typisk document.getElementById("nav")
        if ((this.navElement instanceof Element) == false) throw "Intet nav-element valgt!!"
        
        windowManager2.headerState = 2;

        return this.load({
            url: this.currentPage
        })
    }

    setIconListeners() {
        // Listeners for aktiv/inaktiv tab
        window.addEventListener("focus", function(){
            browser.runtime.sendMessage({
                action: "switchIcon",
                value: 1
            });
        })

        window.addEventListener("blur", function(){
            browser.runtime.sendMessage({
                action: "switchIcon",
                value: 0
            });
        })
    }

    async showLogin(inst) {
        loginScreen.openWindow();
    }

    async load(args) {
        var x = await lecCompat.load(args, this.update)

        this.update({
            url: this.currentPage,
            data: x.data
        })
        return x;
    }

    update(args) { // Opdaterer navigation
        /**
         * url:
         * data:
         */
        this.currentPage = args.url;

        this.updateNavBar({
            url: this.currentPage,
            data: args.data
        })

        document.title = `${this.currentPage} - mectio`
        window.history.replaceState("", "", this.currentPage)

        return auth.updateLoginStatus({
            data: args.data
        })
    }

    updateNavBar(args) {
        /**
         * url:
         * data:
         */

        // Type check
        if (
            typeof args?.url !== "string" ||
            typeof args?.data !== "string"
        ) {
            console.log(args)
            return false
        }

        var nav = this.parseSubnav(args.data)

        // Slet tidl. nav-gruppe (midlertidig fix)
        try {
            document.getElementsByClassName("mectio-nav-group")[0].remove();
        } catch (e) {
            console.log("Ingen nav gruppe slettet.")
        }

        var navLinks = document.getElementById("mectio-nav-links")

        var navTitle = document.getElementById("mectio-nav-title")
        navTitle.innerText = "id: " + nav.navCtxId; // todo

        var navGroup = document.createElement("div")
        navGroup.classList.add("mectio-nav-group")

        for (var link of nav.links) {
            var el = document.createElement("a")

            el.innerText = link.name;
            el.href = link.href;
            if (link.active) el.classList.add("active")

            // Add click listener
            el.addEventListener("click", (e) => {
                e.preventDefault();
                this.load({
                    url: document.activeElement.href
                })
            })

            navGroup.appendChild(el)
        }

        navLinks.appendChild(navGroup)
    }

    parseSubnav(data) {
        var parsedData = this.parser.parseFromString(data, "text/html");

        var navLinks = [];
        try {
            var navArray = parsedData.getElementsByClassName("ls-subnav1")[0].childNodes
        } catch (e) {
            return {error: "Ingen links fundet"}
        }

        var navTitle = parsedData.getElementById("s_m_HeaderContent_MainTitle")
        var navCtxId = navTitle.getAttribute("data-lectiocontextcard")

        for (var i = 0; i < navArray.length; i++) { // Kører gennem alle links og tilføjer til array
            try {
                var navLink = navArray[i].childNodes[0].getAttribute("href");
                var navActive = navArray[i].getAttribute("class").includes("ls-subnav-active")
                var navName = navArray[i].textContent;

                navLinks.push({
                    name: navName, 
                    href: navLink,
                    active: navActive
                })
            } catch (e) {}
        }

        if (navLinks.length == 0) {
            return {error: "Ingen links fundet"}
        }

        return {
            navCtxId,
            links: navLinks
        };
    }
}
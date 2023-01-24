// @ts-check

class WM2Window {
    constructor(id, windowElement, hidden, exclusive, persistent, data) {
        this.id = id;
        this.windowElement = windowElement;
        this._hidden = hidden;
        this._exclusive = exclusive;
        this.persistent = persistent;
        this.data = data;
    }

    get hidden() { return this._hidden; }

    set hidden(value) { 
        if (value) {
            windowManager2.hideWindow(this.id)
        } else {
            windowManager2.showWindow(this.id)
        }

        this._hidden = !!value
    }
}

class WindowManager2 {
    #activeWindow = "";

    /**
     *
     * @param {*} args
     */
    constructor(args) {
        this.lecRequest = new LecRequest();
        this.openWindows = {};
    }

    async init() {
        document.documentElement.innerHTML = "";
        document.body.style.opacity = "0";

        // Indsæt html for dok-struktur
        await this.lecRequest.getLocalPage("pages/main.html").then((text) => {
            document.body.innerHTML = text;

            this.hostElement = document.getElementById("window-container");
        });
        console.debug("WindowManager2: Init done.");
    }

    set headerState(state) {
        // state 0: skjul, 1: kun main, 2: main og nav
        var mectioHeader = document.getElementById("header-container");
        var nav = document.getElementById("nav-wrapper");
        var main = document.getElementsByTagName("main")[0];

        if (
            mectioHeader instanceof Element &&
            nav instanceof Element &&
            main instanceof Element
        ) {
            requestAnimationFrame(function () {
                switch (state) {
                    case 0:
                        mectioHeader.classList.add("hidden");
                        nav.classList.add("hidden");

                        main.classList.remove("collapse1");
                        main.classList.remove("collapse2");
                        break;
                    case 1:
                        mectioHeader.classList.remove("hidden");
                        nav.classList.add("hidden");

                        main.classList.add("collapse1");
                        main.classList.remove("collapse2");
                        break;
                    case 2:
                        mectioHeader.classList.remove("hidden");
                        nav.classList.remove("hidden");

                        main.classList.remove("collapse1");
                        main.classList.add("collapse2");
                        break;
                    default:
                        console.warn(
                            "Ugyldig argument, forventer 0, 1 eller 2"
                        );
                }
            });
        } else {
            return;
        }
    }
    /**
     *
     * @param {number} len
     * @returns
     */
    genRandomId(len) {
        const charset =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
            "abcdefghijklmnopqrstuvwxyz" +
            "1234567890" +
            "-_";
        let index;
        let randomId = "";

        for (let i = 0; i < len; i++) {
            index = Math.floor(Math.random() * charset.length);
            randomId += charset[index];
        }

        return randomId;
    }
    /**
     *
     * @param {object} args
     * @param {string?} args.id - Vindue-id. Genereres automatisk.
     * @param {boolean} args.exclusive - Vindue i fuld skærm.
     * @param {boolean} args.persistent - Lukkes ikke under closeAll.
     * @param {boolean} args.hidden - Skjult når oprettet.
     * @param {object} args.data - Info tilhørende vinduet, bruges af andre funktioner
     * @returns
     */
    createWindow(
        args = {
            id: "",
            hidden: false,
            exclusive: false,
            persistent: false,
            data: {},
        }
    ) {
        console.debug("WindowManager2: Nyt vindue");
        var id = this.genRandomId(32);
        var hidden = !!args.hidden;
        var exclusive = !!args.exclusive;
        var persistent = !!args.persistent;
        var data = args.data;

        var windowElement = document.createElement("div");
        windowElement.setAttribute("id", id);

        windowElement.classList.add("mectio-window");
        if (hidden == true) {
            windowElement.classList.add("hidden");
        }
        if (exclusive == true) {
            windowElement.classList.add("exclusive");
        }

        this.hostElement.appendChild(windowElement);

        this.openWindows[id] = {
            windowElement,
            hidden,
            exclusive,
            persistent,
            data,
        };
        console.debug(this.openWindows);
        return new WM2Window(
            id,
            windowElement,
            hidden,
            exclusive,
            persistent,
            data
        );
    }
    destroyWindow(id) {
        var win = this.openWindows[id];

        try {
            win.windowElement.remove();
            this.openWindows[id] = undefined;
        } catch (e) {
            console.warn("Kunne ikke lukke vindue, object:", win);
        }
    }
    get activeWindow() {
        return this.#activeWindow;
    }
    set activeWindow(id) {
        var prevWindowObj = this.openWindows[this.#activeWindow];
        var windowObj = this.openWindows[id];

        if (typeof windowObj == "object") {
            if (this.#activeWindow !== "")
                prevWindowObj.windowElement.classList.remove("active");
            windowObj.windowElement.classList.add("active");
            this.#activeWindow = id;
        }
    }
    searchWindowData(data) {
        var openWindows = this.openWindows;
        var matchingWindows = {};

        var searchOne = function (input, object) {
            var value1 = input[Object.keys(input)[0]];
            var value2 = object[Object.keys(input)[0]];
            if (value1 == value2) {
                return true;
            } else {
                return false;
            }
        };

        for (var window in openWindows) {
            var match = searchOne(data, openWindows[window].data);

            if (match) {
                matchingWindows[window] = openWindows[window];
            }
        }

        return matchingWindows;
    }
    showWindow(id) {
        var window = this.openWindows[id];

        window.windowElement.classList.remove("hidden");
    }
    hideWindow(id) {
        var window = this.openWindows[id];

        window.windowElement.classList.add("hidden");
    }
}

class WindowManager2 {
    #activeWindow = "";

    constructor(args) {
        /** Args:
         *  {
         *      
         *  }
         */
        this.readyState = false;
        this.lecReqLib = new LecRequest();
        this.openWindows = {};
    }
    applyIcon() {
        // Skift sideikon, hører ikke til i windowmanager
        var link = document.createElement('link');
        link.rel = 'shortcut icon';
        console.log(document.getElementsByTagName('head')[0])
        document.getElementsByTagName('head')[0].appendChild(link);

        link.href = browser.runtime.getURL('icons/icon-48.ico');

        document.title = "mectio";
    }
    async init() {
        this.readyState = new Promise(async (resolve, reject) => {
            // Nulstil document
            document.documentElement.innerHTML = "";

            // Indsæt html for dok-struktur
            await this.lecReqLib.getLocalPage("pages/main.html").then((text) => {
                document.body.innerHTML = text;
                this.applyIcon();

                this.hostElement = document.getElementById("window-container");
            })
            console.debug("WindowManager2: Init done.")
            resolve(true)
        })
        return this.readyState;
    }
    set headerState(state) { // state 0: skjul, 1: kun main, 2: main og nav
        var mectioHeader = document.getElementById("header-container")
        var nav = document.getElementById("nav-wrapper")
        var main = document.getElementsByTagName("main")[0]

        requestAnimationFrame(function(){
            switch(state) {
                case 0:
                    mectioHeader.classList.add("hidden")
                    nav.classList.add("hidden")
    
                    main.classList.remove("collapse1")
                    main.classList.remove("collapse2")
                    break;
                case 1:
                    mectioHeader.classList.remove("hidden")
                    nav.classList.add("hidden")

                    main.classList.add("collapse1")
                    main.classList.remove("collapse2")
                    break;
                case 2:
                    mectioHeader.classList.remove("hidden")
                    nav.classList.remove("hidden")
    
                    main.classList.remove("collapse1")
                    main.classList.add("collapse2")
                    break;
                default:
                    console.warn("Ugyldig argument, forventer 0, 1 eller 2")    
            }
        })
    } 
    createWindow(args) {
        /** Args:
         *  {
         *      exclusive: true/false - Vindue i fuld skærm.
         *      persistent: true/false - Lukkes ikke under closeAll.
         *      hidden: true/false - Skjult når oprettet.
         *      data: object - Info tilhørende vinduet, bruges af andre funktioner
         *  }
         */
        console.debug("WindowManager2: Nyt vindue")
        var id = (Math.random() + 1).toString(36).substring(2) + (Math.random() + 1).toString(36).substring(2)
        var hidden = args?.hidden ? true : false;
        var exclusive = args?.exclusive ? true : false;
        var persistent = args?.persistent ? true : false;
        var data = args?.data ? args.data : {};

        var windowElement = document.createElement("div");
        windowElement.setAttribute("id", id)

        windowElement.classList.add("mectio-window");
        if (hidden == true) {windowElement.classList.add("hidden");}
        if (exclusive == true) {windowElement.classList.add("exclusive");}

        this.hostElement.appendChild(windowElement);

        this.openWindows[id] = {
            windowElement,
            hidden,
            exclusive,
            persistent,
            data
        }
        console.debug(this.openWindows)
        return {
            id,
            windowElement,
            hidden,
            exclusive,
            persistent,
            data
        };
    }
    destroyWindow(id) {
        var win = this.openWindows[id];

        win.windowElement.remove();

        this.openWindows[id] = undefined;
    }
    get activeWindow() {
        return this.#activeWindow;
    }
    set activeWindow(id) {
        var prevWindowObj = this.openWindows[this.#activeWindow];
        var windowObj = this.openWindows[id];

        if (typeof windowObj == "object") {
            if (this.#activeWindow !== "") prevWindowObj.windowElement.classList.remove("active");
            windowObj.windowElement.classList.add("active");
            this.#activeWindow = id;
        }
    }
    searchWindowData(data) {
        var openWindows = this.openWindows;
        var matchingWindows = {};

        var searchOne = function(input, object) {
            var value1 = input[Object.keys(input)[0]]
            var value2 = object[Object.keys(input)[0]]
            if (value1 == value2) {
                return true;
            } else {
                return false;
            }
        }

        for (var window in openWindows) {
            var match = searchOne(data, openWindows[window].data)
            
            if (match) {
                matchingWindows[window] = openWindows[window]
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
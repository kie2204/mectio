var defaultTransitionCurve = "transform 0.2s cubic-bezier(0, 0, 0.2, 1) "

windowManager = {
    initStatus: 0,
    maxRegisteredWindows: 20,
    init: async() => {
        // Stop loading site, replace title
        document.body.innerHTML = "";
    
        // Inject mectio document structure
        return new Promise(resolve => {
            fetch(browser.runtime.getURL('/pages/main.html')).then(r => r.text()).then(html => {
                document.body.innerHTML = html;
        
                links = document.querySelectorAll("*"); // Probably bad for performance

                for (var x of links) {
                    var href = x.getAttribute("href");
                    var src = x.getAttribute('src');

                    if (typeof(href) == "string" && href.substr(0,4) != "http" && href.substr(0,1) != "#" && href.length != 0) {
                        x.href = browser.runtime.getURL('/') + href;
                    }
                    if (typeof(src) == "string" && src.substr(0,4) != "http" && src.substr(0,1) != "#" && src.length != 0) {
                        x.src = browser.runtime.getURL('/') + src;
                    }
                }
        
                // Set page icon
                link = document.createElement('link');
                link.rel = 'shortcut icon';
                document.getElementsByTagName('head')[0].appendChild(link);
        
                link.href = browser.runtime.getURL('/') + 'icons/icon-48.ico';
        
                document.title = "mectio";
                document.getElementsByTagName('p')[0].innerHTML = "";
                logs.info("wm init done");
                resolve();
            });
        });
    },
    setHeaderState: function(state) { // state 0: skjul, 1: vis, 2: vis header + nav
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
                    logs.warn("Ugyldig argument, forventer 0, 1 eller 2")    
            }
        })

        // mectioHeader.style.transition = prevTransition;
    },
    registeredWindows: [],
    registerWindow: function(id, window) {
        this.registeredWindows = this.registeredWindows.filter(a => a != false)

        if (this.registeredWindows.length > this.maxRegisteredWindows) {
            logs.warn("For mange vinduer")
            try {
                this.registeredWindows[0].window.close();
            } catch (e) {
                this.registeredWindows = this.registeredWindows.filter(a => a !== false)
                this.registeredWindows[0].window.close();
            }
        }
        this.registeredWindows.push({
            id: id,
            window: window
        })
    },
    unregisterWindow: function(id) {
        var reg = this.registeredWindows;

        var obj = reg.find(x => x.id === id)
        var index = reg.indexOf(obj)

        this.registeredWindows[index] = false;
    },
    getWindow: function(id) {
        try {
            return this.registeredWindows.find(x => x.id === id);
        } catch (e) {
            return false;
        }
    },
    closeAll: function() {
        for (var x of this.registeredWindows) {
            try {
                x.window.close();
            } catch (e) {logs.warn("Could not close window "+ x.id)}
        }
    },
    activeWindow: "",
    setActiveWindow: function(id) {
        this.activeWindow = id;
        for (var x of this.registeredWindows) {
            if (typeof x == 'object') {
                x.window.element.classList.add("hidden");
            }
        }
        document.getElementById(id).classList.remove("hidden");
        logs.info(`Active window set to ${id}`)
    },
    toggleInstName: function(toggle, name) {
        requestAnimationFrame(function(){
            switch (toggle) {
                case 0:
                    document.getElementById("mectio-text-wrapper").classList.remove("show-instname")
                    document.getElementById("mectio-inst-text").innerText = ""; 
                    break;
                case 1:
                    document.getElementById("mectio-text-wrapper").classList.add("show-instname")
                    document.getElementById("mectio-inst-text").innerText = instName.name; 
                    break;
                default:
                    document.getElementById("mectio-text-wrapper").classList.toggle("show-instname")
            }
        })
    },
    sidebar: {
        getVisible: function() {
            if (element.classList.contains("hidden")) return false;
            return true;
        },
        hide: function() {
            document.getElementById("sidebar-container").classList.add("hidden");
        },
        show: function() {
            document.getElementById("sidebar-container").classList.remove("hidden");
        }
    }
}

class wmWindow {
    constructor(args) {
        /* 
        windowId: Vindue custom id,
        appearWait: Vent med at vise vindue (true/false, 0/1), 
        data: Data-objekt
        */

        if (typeof(args) !== "object") args = {}

        if (typeof(args.windowId) != "string") {
            this.id = (Math.random() + 1).toString(36).substring(2); // generer random id
        } else {
            this.id = args.windowId;
        }

        if (typeof(args.data) != "object") {
            this.data = {};
        } else {
            this.data = args.data;
        }

        var main = document.querySelector("#window-container");

        var windowElement = document.createElement("div");

        windowElement.setAttribute("id", this.id)
        windowElement.setAttribute("class", "mectio-window")
        
        main.appendChild(windowElement);
        logs.info("Nyt vindue med id " + this.id + " åbnet.")

        this.element = windowElement;
        windowManager.registerWindow(this.id, this)

        if (args.appearWait != 1) {
            this.appear();
        } 
    }

    updateData(data) {
        this.data = data;
    }

    appear() {
        var el = document.getElementById(this.id)
        windowManager.setActiveWindow(this.id)

        el.style.display = "";
    }

    hide() {
        var el = document.getElementById(this.id)

        // Luk-animation
        el.style.display = "none";
    }

    close() {
        var id = this.id;
        var el = document.getElementById(id)

        logs.info("Lukker vindue " + id) 
        this.hide();
        windowManager.unregisterWindow(id)
        
        setTimeout(function(){
            el.remove();
        }, 500)
    }

    show() {

    }
}

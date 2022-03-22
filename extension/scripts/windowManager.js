var defaultTransitionCurve = "transform 0.2s cubic-bezier(0, 0, 0.2, 1) "

windowManager = {
    initStatus: 0,
    maxRegisteredWindows: 3,
    init: async() => {
        // Stop loading site, replace title
        document.body.innerHTML = "";
    
        // Inject mectio document structure
        return new Promise(resolve => {
            fetch(browser.runtime.getURL('/pages/main.html')).then(r => r.text()).then(html => {
                document.body.innerHTML = html;
                // not using innerHTML as it would break js event listeners of the page // comment from stackoverflow
        
                links = document.querySelectorAll("*"); // Probably bad for performance
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
        var nav = document.getElementsByTagName("nav")[0]
        var main = document.getElementsByTagName("main")[0]
        var prevTransition = mectioHeader.style.transition;

        mectioHeader.style.transition = defaultTransitionCurve;
        nav.style.transition = defaultTransitionCurve;

        requestAnimationFrame(function(){
            switch(state) {
                case 0:
                    mectioHeader.style.transform = "translateY(-100%)";
                    nav.style.transform = "translateY(-100%)";
    
                    main.classList.remove("collapse1")
                    main.classList.remove("collapse2")
                    break;
                case 1:
                    mectioHeader.style.transform = "";
                    nav.style.transform = "translateY(-100%)";
                    main.classList.add("collapse1")
                    main.classList.remove("collapse2")
                    break;
                case 2:
                    mectioHeader.style.transform = "";
                    nav.style.transform = "";
    
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
        if (this.registeredWindows.length > 3) {
            logs.warn("For mange vinduer")
            this.registeredWindows[0].window.close();
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

        console.log(reg)
        console.log(id + " " + index)

        this.registeredWindows.splice(index, 1)
    },
    getWindow: function(id) {
        try {
            return this.registeredWindows.find(x => x.id === id);
        } catch (e) {
            return false;
        }
    },
    close: function(id) {
        try {
            this.getWindow(id).window.close();
        } catch (e) {logs.warn("Could not close window "+ id)}
    },
    closeAll: function() {
        for (var x of this.registeredWindows) {
            try {
                x.window.close();
            } catch (e) {logs.warn("Could not close window "+ id)}
        }
    },
    activeWindow: "",
    setActiveWindow: function(id) {
        this.activeWindow = id;
        for (var x of this.registeredWindows) {
            x.window.element.style.zIndex = "1";
        }
        document.getElementById(id).style.zIndex = "1000";
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
    }
}

class wmWindow {
    constructor(setId, appearWait, data) {
        if (typeof(setId) != "string") {
            this.id = (Math.random() + 1).toString(36).substring(2);
        } else {
            this.id = setId;
        }

        if (typeof(data) != "object") {
            this.data = {};
        } else {
            this.data = data;
        }

        var main = document.querySelector("#window-container");

        var windowElement = document.createElement("div");
        windowElement.setAttribute("id", this.id)
        windowElement.setAttribute("class", "mectio-window")
        windowElement.style.transform = "scale(0.95)";
        windowElement.style.opacity = "0";  
        
        main.appendChild(windowElement);
        logs.info("Nyt vindue med id " + this.id + " åbnet.")

        this.element = windowElement;
        windowManager.registerWindow(this.id, this)

        if (appearWait != 1) {
            this.appear();
        } 
    }

    appear() {
        var el = document.getElementById(this.id)
        windowManager.setActiveWindow(this.id)

        requestAnimationFrame(function(){
            setTimeout(function(){
                el.style.height = "100vh";
                el.style.transition += `, ${defaultTransitionCurve}, opacity 0.2s`;
                el.style.transform = "scale(1)";
                el.style.opacity = "1";
            })
            setTimeout(function(){
                el.style.height = "";
            }, 500)
        })
    }

    hide() {
        var el = document.getElementById(this.id)

        // Luk-animation
        el.style.maxHeight = "100vh";
        el.style.zIndex = "1";
        el.style.transition = `${defaultTransitionCurve}, opacity 0.2s`;
        el.style.transform = "scale(1.03)";
        el.style.opacity = "0";    
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

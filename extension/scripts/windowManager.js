var defaultTransitionCurve = "transform 0.2s cubic-bezier(0, 0, 0.2, 1) "

windowManager = {
    initStatus: 0,
    init: async() => {
        // Stop loading site, replace title
        document.body.innerHTML = "";
    
        // Inject mectio document structure
        return new Promise(resolve => {
            fetch(browser.runtime.getURL('/pages/main.html')).then(r => r.text()).then(html => {
                document.body.innerHTML = html;
                // not using innerHTML as it would break js event listeners of the page // comment from stackoverflow
        
                links = document.querySelectorAll("*"); // Probably bad for performance
                for (i = 0, le = links.length; i < le; i++) {
                    links[i].href = browser.runtime.getURL('/') + links[i].getAttribute('href');
                    links[i].src = browser.runtime.getURL('/') + links[i].getAttribute('src');
                }
        
                // Set page icon
                link = document.createElement('link');
                link.rel = 'shortcut icon';
                document.getElementsByTagName('head')[0].appendChild(link);
        
                link.href = browser.runtime.getURL('/') + 'icons/icon-48.ico';
        
                document.title = "mectio";
                document.getElementsByTagName('p')[0].innerHTML = "";
                console.log("wm init done");
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
                console.log("Ugyldig argument, forventer 0, 1 eller 2")    
        }

        // mectioHeader.style.transition = prevTransition;
    },
    registeredWindows: [],
    registerWindow: function(id, window) {
        this.registeredWindows.push({
            id: id,
            window: window
        })
    },
    getWindow: function(id) {
        return this.registeredWindows.find(x => x.id === id).window;
    },
    close: function(id) {
        this.getWindow(id).close();
    },
}

class wmWindow {
    constructor(setId) {
        if (setId == "") {
            this.id = (Math.random() + 1).toString(36).substring(2);
        } else {
            this.id = setId;
        }
        var main = document.getElementsByTagName("main")[0];

        var windowElement = document.createElement("div");
        windowElement.setAttribute("id", this.id)
        windowElement.setAttribute("class", "mectio-window")
        windowElement.style.transform = "scale(0.95)";
        windowElement.style.opacity = "0";  
        
        main.appendChild(windowElement);
        console.log("mectio: nyt vindue med id " + this.id + " åbnet.")

        this.element = windowElement;
        windowManager.registerWindow(this.id, this)

        setTimeout(function(){
            windowElement.style.transition = `${defaultTransitionCurve}, opacity 0.2s`;
            windowElement.style.transform = "scale(1)";
            windowElement.style.opacity = "1";
        }, 10)
    }

    close() {
        var closeElement = document.getElementById(this.id)
        // Luk-animation
        console.log("Lukker vindue " + this.id)
        closeElement.style.transition = `${defaultTransitionCurve}, opacity 0.2s`;
        closeElement.style.transform = "scale(0.95)";
        closeElement.style.opacity = "0";     
        
        setTimeout(function(){
            closeElement.remove();
        }, 500)
    }

    show() {

    }
}

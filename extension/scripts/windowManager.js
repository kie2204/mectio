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
    setHeaderState: function(state) { // state 0: skjul, 1: vis
        switch(state) {
            case 0:
            case 1:
            default:
                console.log("Ugyldig argument, forventer 0 eller 1")    
        }
    }
}

class wmWindow {
    constructor() {
        this.id = (Math.random() + 1).toString(36).substring(2);
        var main = document.getElementsByTagName("main")[0];

        var windowElement = document.createElement("div");
        windowElement.setAttribute("id", this.id)
        windowElement.setAttribute("class", "mectio-window")
        
        main.appendChild(windowElement);
        console.log("mectio: nyt vindue med id " + this.id + " åbnet.")

        this.element = windowElement;
    }
}

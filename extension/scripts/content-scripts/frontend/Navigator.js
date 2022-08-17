// mectio navigation manager
// Handles page loads, redirects, navbar
class Navigator {
    constructor(args) {
        this.setIconListeners()

        // Tjek om navigaton bar element er defineret
        this.navElement = args?.navElement ? args?.navElement : false; // typisk document.getElementById("nav")
        if ((this.navElement instanceof Element) == false) throw "Intet nav-element valgt!!"

        // Lav liste med URL-callbacks
        this.urlCallbacks = []

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

    async start() { 

    }
}
// mectio navigation manager
// Handles page loads, redirects, navbar
class Navigator {
    constructor(args) {
        this.setIconListeners()
        console.debug("Navigation: Ikon aktiveret")

        // Tjek om navigaton bar element er defineret
        this.navElement = args?.navElement ? args?.navElement : false; // typisk document.getElementById("nav")
        if ((this.navElement instanceof Element) == false) throw "Intet nav-element valgt!!"

        this.currentPage = window.location.href;

        // Lav liste med URL-callbacks
        this.urlCallbacks = []

        //

        this.parser = new DOMParser();
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

    async init() { 
        windowManager2.headerState = 0;

        this.load({
            url: this.currentPage
        }).then((res) => {
            // Opdater login status
            return auth.updateLoginStatus({
                data: res.data
            })
        }).then((st) => {
            if (st.loginStatus == 1) {
                // Nothing?
            } else {
                this.showLogin();
            }
        })
    }

    async showLogin(inst) {
        loginScreen.openWindow();
    }

    async load(args) {
        var x = await lecCompat.load(args)
        return x;
    }

    update(args) { // Opdaterer navigation
        /**
         * url:
         * data:
         */

    }
}
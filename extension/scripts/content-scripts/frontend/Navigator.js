// mectio navigation manager
// Handles page loads, redirects, navbar
class Navigator {
    constructor(args) {
        // Tjek om navigaton bar element er defineret
        this.navElement = args?.navElement ? args?.navElement : false;
        if ((this.navElement instanceof Element) == false) throw "Intet nav-element valgt!!"
    }

}
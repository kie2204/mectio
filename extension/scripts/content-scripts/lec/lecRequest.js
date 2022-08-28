// lecRequest: Henter data fra Lectio og behandler til brug andre steder
class LecRequest {
    constructor() {
        this.defaultHost = "www.lectio.dk" // Midlertidig
    }

    async getPage(link) { // Henter lectio-side
        var pageData = this.parseLink(link)

        if (pageData.isLec !== true) {
            console.warn(link + ": Ikke et Lectio-link");
            return pageData;
        }

        console.debug("Henter side " + link)

        var resText = await this.fetchText(link);
        pageData.data = resText;

        return pageData;
        /** PageData:
         * {
         *      isLec: boolean // Siden tilhører lectio. Hvis ikke, bliver hverken data eller inst hentet.
         *      url: string // URL
         *      inst: int // Skole ID der tilhører link
         *      data: string // Raw html
         * }
         */
    }

    async fetchText(link) { // fetch().text() wrapper, bruges internt
        var res = await fetch(link);

        if (res.ok !== true) {
            console.error(`Kunne ikke hente side, fejl ${res.status}: ${res.statusText}`)
            return false;
        }

        var resText = await res.text();
        return resText;
    }

    parseLink(link) { // Behandler link
        var parsedUrl = new URL(link);
        var linkData = {};

        linkData.url = parsedUrl.href;

        if (parsedUrl.host !== this.defaultHost) { // Tjekker om siden er del af Lectio
            linkData.isLec = false;
            return linkData;
        }

        linkData.isLec = true;

        if (parsedUrl.pathname.substring(0, 8) === "/lectio/") {
            var cutPath = parsedUrl.pathname.substring(8)
            linkData.inst = parseInt(cutPath.substring(0, cutPath.indexOf("/")))
        }

        return linkData;
    }

    // Lokale sider
    async getLocalPage(link) { // link til siden, fra rod af mectio (f.eks. "pages/login-screen/index.html")
        var localUrl = browser.runtime.getURL(link) // Finder link til siden

        var resText = await this.fetchText(localUrl);
        var curDir = localUrl.substring(0, localUrl.lastIndexOf("/"));

        resText = resText.replaceAll("{_MECTIO_CURDIR}", curDir);
        resText = resText.replaceAll("{_MECTIO_ROOTDIR}", browser.runtime.getURL(""));

        return resText;
    }
}
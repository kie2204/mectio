// lecRequest: Henter data fra Lectio og behandler til brug andre steder
class LecRequest {
    constructor() {
        
    }

    async #fetchText(link) {
        // fetch().text() wrapper, bruges internt
        var res = await fetch(link);

        if (res.ok !== true) {
            console.error(
                `Kunne ikke hente side, fejl ${res.status}: ${res.statusText}`
            );
            return false;
        }

        var resText = await res.text();
        return resText;
    }

    async getPage(_url) {
        // Henter lectio-side
        var path = new LecPath(_url);
        console.log(path);

        if (path.isLec !== true) {
            console.warn(path.url + ": Ikke et Lectio-link");
            return new LecResponse(path.url, "");
        }

        console.debug("Henter side " + _url);

        var resText = await this.fetchText(_url);

        return new LecResponse(path.url, resText);
        /** PageData:
         * {
         *      isLec: boolean // Siden tilhører lectio. Hvis ikke, bliver hverken data eller inst hentet.
         *      url: string // URL
         *      inst: int // Skole ID der tilhører link
         *      data: string // Raw html
         * }
         */
    }

    static parseLink(_url) {
        // Behandler link
        return new LecPath(_url);
    }

    // Lokale sider
    /**
     * 
     * @param {string} link 
     * @returns {Promise<string>}
     */
    async getLocalPage(link) {
        // link til siden, fra rod af mectio (f.eks. "pages/login-screen/index.html")
        var localUrl = browser.runtime.getURL(link); // Finder link til siden

        console.log(this)
        var resText = await this.#fetchText(localUrl);
        var curDir = localUrl.substring(0, localUrl.lastIndexOf("/"));

        resText = resText.replaceAll("{_MECTIO_CURDIR}", curDir);
        resText = resText.replaceAll(
            "{_MECTIO_ROOTDIR}",
            browser.runtime.getURL("")
        );

        return resText;
    }
}

class LecPath {
    constructor(_url) {
        this.parseUrl(_url);
    }
    parseUrl(_url) {
        // Brug URL class til parsin
        var parsedUrl = new URL(_url);
        this._url = parsedUrl.href;

        // Er Lectio URL?
        if (parsedUrl.origin !== _LECTIO_BASE_URL) {
            // Tjekker om siden er del af Lectio
            this.isLec = false;
            return;
        } else {
            this.isLec = true;
        }

        // Lokal URL for skole
        var path = parsedUrl.pathname;

        if (path.substring(0, 8) === "/lectio/") {
            var cutPath = path.substring(8);
            this.inst = parseInt(cutPath.substring(0, cutPath.indexOf("/")));
        }

        if (!isNaN(this.inst)) {
            // Find lokal side (alt efter /lectio/id/)
            var localPathIndex =
                path.indexOf(this.inst) + String(this.inst).length + 1;
            this.localPath = path.substring(localPathIndex);
        }
    }
    set url(_url) {
        this.parseUrl(_url);
    }
    get url() {
        return this._url;
    }
}

class LecResponse {
    constructor(_url, _rawData) {
        this.path = new LecPath(_url);
        this.rawData = _rawData;

        // Sæt timestamp
        this.timestamp = new Date();
    }

    get auth() {
        const _rawData = this.rawData;
        let _auth = Auth.getPageAuthentication(_rawData);
        

        return _auth;
    }
}

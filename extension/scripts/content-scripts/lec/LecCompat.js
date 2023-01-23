class LecCompat {
    constructor(args) {
        /** {
         *      window: Vindue hvor frame indlæses
         *  }
         */
        this.updateCallback = () => {};
        this.frame = null; // iframe
        this.wmWindow = null; // WMWindow

        console.log(this.updateCallback);
    }

    init(args) {
        if (typeof args?.window == "object") {
            this.wmWindow = args.window;
        } else {
            this.wmWindow = windowManager2.createWindow();
        }

        this.wmWindow.data.lecCompat = true;

        this.frame = document.createElement("iframe");
        this.prepIFrame(this.frame);
    }

    prepIFrame(frame, utils) { // Kører en gang under oprettelse af iframe
        // Frame sandbox settings
        frame.setAttribute("scrolling", "no");

        // Decorate iframe
        frame.style.width = "100%";
        frame.style.border = "none";
        frame.style.minHeight = "100vh";

        this.wmWindow.windowElement.appendChild(frame);

        // Loading transition
        frame.classList.add("loading");
        frame.style.transitionProperty = "filter, opacity, transform";

        // Set frame listeners
        frame.addEventListener("load", () => {
            frame.style.transitionDuration = "0.2s";
            frame.classList.remove("loading");

            frame.contentWindow.addEventListener("unload", () => {
                frame.style.transitionDuration = "0s";
                frame.style.height = "";

                window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                });

                frame.classList.add("loading");
                console.log("Unload event");

                setTimeout(() => {
                    this.iFrameDOMLoad(frame).then(() => {
                        this.injectCSS(frame);
                        this.injectScripts(frame);
                        this.applyPatches(frame, true);
                    });
                }, 0);
            });
        });

        window.addEventListener("resize", this.setHeight);

        frame.contentWindow.location.replace("about:blank");
    }

    setHeight = () => {
        const frame = this.frame;

        console.log("height calculating");
        var prevScrollPosition = [window.scrollX, window.scrollY];
        var body = frame.contentDocument.body;
        var html = frame.contentDocument.documentElement;

        // console.log(frame.contentDocument.body, body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
        frame.style.height = "initial";
        frame.style.width = "initial";

        var height = Math.max(
            body.scrollHeight,
            body.offsetHeight,
            html.clientHeight,
            html.scrollHeight,
            html.offsetHeight
        );

        var width = Math.max(
            body.scrollWidth,
            body.offsetWidth,
            html.clientWidth,
            html.scrollWidth,
            html.offsetWidth
        );

        // console.log(frame, "Height: ", height)
        frame.style.height = `${height}px`;
        frame.style.width = `max(${width}px, 100%)`;
        frame.style.filter = "";
        window.scrollTo(prevScrollPosition[0], prevScrollPosition[1]);
    };

    /**
     * 
     * @param {LecPath} _lecPath 
     * @param {object} utils 
     * @param {boolean} update 
     * @returns 
     */
    load = async (_lecPath, utils, update = false) => {
        /** {
         *      url: Url der loades
         *  }
         */
        this.updateCallback = utils.update;

        var url = _lecPath.url;

        if (_lecPath.localPath == "login.aspx") {
            let login = await utils.requestLogin(_lecPath.inst)

            if (login.loginStatus == 1) {
                this.load(login.lecRes.path, utils)
                return true;
            }
        }

        var frame = this.frame;

        var parsedUrl = new URL(url);
        // parsedUrl.searchParams.delete("prevurl")
        console.log(parsedUrl.href);

        frame.contentWindow.location.replace(parsedUrl.href);

        await this.iFrameLoad(frame); // Todo: få domcontentloaded event til at virke hvis mulig

        this.injectCSS(frame);
        this.injectScripts(frame);
        this.applyPatches(frame);

        var pageData = this.frame.contentDocument.documentElement.innerHTML;

        const _lecRes = new LecResponse(parsedUrl.href, pageData);

        return _lecRes;
    };

    injectCSS(frame) {
        var doc = frame.contentWindow.document;

        // Inject CSS with link
        var injCSS = doc.createElement("link");
        var injCSSHref = browser.runtime.getURL(
            "pages/styles/lectioCompatibilityInject.css"
        );
        injCSS.setAttribute("rel", "stylesheet");
        injCSS.setAttribute("href", injCSSHref);
        doc.head.appendChild(injCSS);

        // Skjul header
        try {
            doc.getElementsByTagName("header")[0].style.display = "none";
            doc.getElementById("s_m_HeaderContent_subnav_div").style.display =
                "none";

            var row2 = doc.getElementById(
                "s_m_HeaderContent_subnavigator_genericSecondRow_tr"
            );
            if (row2 != null) {
                doc.getElementById("s_m_outerContentFrameDiv").prepend(row2);
            }
        } catch (e) {
            console.warn("Error: " + e);
        }
    }

    injectScripts(frame) {
        var doc = frame.contentWindow.document;

        var injScript = doc.createElement("script");
        var injScriptSrc = browser.runtime.getURL(
            "scripts/lectioKILLER-frame.js"
        );
        injScript.setAttribute("src", injScriptSrc);
        doc.head.appendChild(injScript);
    }

    applyPatches = (frame, update = false) => {
        console.debug("Aktiverer link patch", frame);
        // Patch links (bruges ikke)
        for (var x of frame.contentWindow.document.getElementsByTagName("a")) {
            var onclick = x.getAttribute("onclick");
            var lecCommand = x.getAttribute("lec-command");
            var dataCommand = x.getAttribute("data-command");
        }

        setTimeout(() => {
            this.setHeight();
        }, 500);

        if (update) {
            // get frame content
            const _lecRes = new LecResponse(
                frame.contentWindow.location.href,
                frame.contentDocument.documentElement.innerHTML
            );

            mNavigator.update(_lecRes);
        }
    }

    async iFrameDOMLoad(frame) {
        return new Promise((resolve) => {
            frame.contentDocument.addEventListener("DOMContentLoaded", () => {
                resolve(true);
            });
        });
    }

    async iFrameLoad(frame) {
        return new Promise((resolve) => {
            frame.addEventListener("load", () => {
                resolve(true);
            });
        });
    }
}

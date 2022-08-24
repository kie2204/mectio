class LecCompat {
    constructor(args) {
        /** {
         *      window: Vindue hvor frame indlæses
         *  }
         */
    }

    init(args) {
        if (typeof args?.window == "object") {
            this.window = args.window;
        } else {
            this.window = windowManager2.createWindow()
        }

        this.window.data.lecCompat = true;

        this.frame = document.createElement("iframe")
        this.prepIFrame(this.frame);
    }

    prepIFrame(frame) {
        frame.setAttribute("scrolling", "no")
        frame.setAttribute("sandbox", "allow-same-origin allow-scripts allow-forms allow-popups")

        // Decorate iframe
        frame.style.width = "100%";
        frame.style.border = "none";
        frame.style.minHeight = "100vh";

        this.window.windowElement.appendChild(frame);

        // Loading transition
        frame.classList.add("loading")
        frame.style.transition = "filter 0.2s, opacity 0.2s, transform 0.2s";

        // Set frame listeners
        frame.addEventListener("load", () => {
            frame.classList.remove("loading")

            frame.contentWindow.addEventListener("unload", () => {
                frame.style.height = "";

                frame.classList.add("loading")
                console.log("Unload event")
                
                setTimeout(() => {
                    this.iFrameDOMLoad(frame).then(() => {
                        this.injectCSS(frame);
                        this.injectScripts(frame);
                        this.applyPatches(frame);
                    })
                }, 0)
            })
        })

        frame.contentWindow.location.replace("about:blank");
    }

    async load(args) {
        /** {
         *      url: Url der loades
         *  }
         */
        console.debug(args.url)
        var url = typeof args.url == "string" ? args.url : "";
        console.debug(url)

        var frame = this.frame;
        
        var parsedUrl = new URL(url)
        // parsedUrl.searchParams.delete("prevurl")
        console.log(parsedUrl.href)

        frame.contentWindow.location.replace(parsedUrl.href);
        
        await this.iFrameLoad(frame) // Todo: få domcontentloaded event til at virke hvis mulig

        this.injectCSS(frame);
        this.injectScripts(frame);
        this.applyPatches(frame);

        var pageData = this.frame.contentDocument.documentElement.innerHTML;

        return {
            url: parsedUrl.href,
            data: pageData
        };
    }

    injectCSS(frame) {
        var doc = frame.contentWindow.document;
    
        // Inject CSS with link
        var injCSS = doc.createElement("link");
        var injCSSHref = browser.runtime.getURL('pages/styles/lectioCompatibilityInject.css')
        injCSS.setAttribute("rel", "stylesheet")
        injCSS.setAttribute("href", injCSSHref)
        doc.head.appendChild(injCSS)

        // Skjul header
        try {
            doc.getElementsByTagName("header")[0].style.display = "none";
            doc.getElementById("s_m_HeaderContent_subnav_div").style.display = "none";
    
            var row2 = doc.getElementById("s_m_HeaderContent_subnavigator_genericSecondRow_tr")
            if (row2 != null) {
                doc.getElementById("s_m_outerContentFrameDiv").prepend(row2)
            }
        } catch (e) {
            console.warn("Error: " + e)
        }
    }

    injectScripts(frame) {
        var doc = frame.contentWindow.document;

        var injScript = doc.createElement("script");
        var injScriptSrc = browser.runtime.getURL('scripts/lectioKILLER-frame.js')
        injScript.setAttribute("src", injScriptSrc)
        doc.head.appendChild(injScript)
    }

    applyPatches(frame) {
        console.debug("Aktiverer link patch", frame)
        // Patch links
        for (var x of frame.contentWindow.document.getElementsByTagName("a")) {
            var onclick = x.getAttribute("onclick");
            var lecCommand = x.getAttribute("lec-command");
            var dataCommand = x.getAttribute("data-command");
        }

        // Sæt højde
        setTimeout(function() { 
            var body = frame.contentDocument.body;
            var html = frame.contentDocument.documentElement;
    
            console.log(frame.contentDocument.body, body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
    
            var height = Math.max( body.scrollHeight, body.offsetHeight, 
                html.clientHeight, html.scrollHeight, html.offsetHeight );
    
            console.log(frame, "Height: ", height)
            
            frame.style.height = `${height*2}px`;
            frame.style.filter = "";
        }, 0)

        // Navigation
        document.title = `${frame.contentWindow.location.pathname} - mectio`
        window.history.replaceState("", "", frame.contentWindow.location.href)
    }

    async iFrameDOMLoad(frame) {
        return new Promise(resolve => {
            frame.contentDocument.addEventListener("DOMContentLoaded", () => { resolve(true); })
        })
    }

    async iFrameLoad(frame) {
        return new Promise(resolve => {
            frame.addEventListener("load", () => { resolve(true); })
        })
    }
}
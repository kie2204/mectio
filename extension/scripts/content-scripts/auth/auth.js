class LecLoginState {}

class LecLoginPrep {
    /**
     * 
     * @param {LecResponse} _lecRes 
     */
    constructor(_lecRes) {
        var parser = new DOMParser();

        var parsedformData = parser.parseFromString(_lecRes.rawformData, "text/html");
        console.debug(parsedformData);

        var _loginService = parsedformData.getElementById(
            "m_Content_schoolnametd"
        ).innerText;

        // Find vigtigste ASP felter
        var VSX = parsedformData
            .getElementById("__VIEWSTATEX")
            .getAttribute("value");
        var EVV = parsedformData
            .getElementById("__EVENTVALIDATION")
            .getAttribute("value");

        // Find resten af ASP felter
        var aspHidden = parsedformData.querySelectorAll(".aspNetHidden");
        var aspExtended = {};

        for (var el of aspHidden) {
            var _children = el.children;
            for (var child of _children) {
                if (child.nodeName == "INPUT") {
                    console.log(child.name, child.value);
                    // Tilføj til extended list
                    aspExtended[child.name] = child.value;
                }
            }
        }

        this.inst = _lecRes.path.inst;
        this.loginService = _loginService;
        this.asp = {
            _extended: aspExtended,
            EVV,
            VSX,
        };
    }
}

class Auth {
    #parser = new DOMParser();

    static instList = false;

    constructor(inst) {
        if (inst) {
            this.inst = inst;
        } else {
            console.warn("Auth: inst ikke valgt under konstruktion!");
            this.inst = NaN;
        }
    }

    resetInst() {
        this.inst = NaN;
    }

    /* Internal */

    /**
     *
     * @param {number} inst
     * @returns
     */
    async #genLoginPrep(inst) {
        var lecRes = await LecRequest.getPage(
            `${_LECTIO_BASE_URL}/lectio/${inst}/login.aspx`
        );

        var prep = new LecLoginPrep(lecRes);
        console.log(prep);

        return prep;
    }

    #parseLoginError(res) {
        // Fungerer ikke, da fejl er gemt i script tag
        //var parsed = this.parser.parseFromString(res, "text/html");

        //return parsed.querySelector("[formData-title=Fejl]").innerText;
        return false;
    }

    /**
     *
     * @param {object Object} args
     * @param {LecLoginPrep} loginPrep
     * @returns
     */
    login = async (args, loginPrep) => {
        let inst = this.inst;
        let credentialsPresent = args.username ? true : false && args.password ? true : false;

        if (credentialsPresent == false) {
            console.loginError("Auth: kan ikke logge ind, mangler info!!!");
            return false;
        }

        // Get VIEWSTATE og EVENTVALIDATION (kræves af ASP.NET)
        if (loginPrep instanceof LecLoginPrep) {
            // credentialsPresent
        } else {
            loginPrep = await this.#genLoginPrep(args.inst);
        }

        /*
        var formData = { // ALLE felter her skal sendes til Lectio
            '__EVENTTARGET': 'm$Content$submitbtn2',
            '__EVENTARGUMENT': "",
            '__SCROLLPOSITION': "",
            '__VIEWSTATEX': loginPrep.asp.VSX,
            '__VIEWSTATEY_KEY': "",
            '__VIEWSTATE': "",
            '__EVENTVALIDATION': loginPrep.asp.EVV,
            'masterfootervalue': 'X1!ÆØÅ',
            'LectioPostbackId': "",
            'm$Content$username': args.username,
            'm$Content$password': args.password
        }
        */

        var formData = loginPrep.asp._extended;

        delete formData["time"], formData["__LASTFOCUS"];

        formData["__EVENTTARGET"] = "m$Content$submitbtn2";
        formData["m$Content$username"] = args.username;
        formData["m$Content$password"] = args.password;
        formData["LectioPostbackId"] = "";
        formData["masterfootervalue"] = "X1!ÆØÅ";

        // Generer POST url
        var formBody = [];
        for (var property in formData) {
            var encodedKey = encodeURIComponent(property);
            var encodedValue = encodeURIComponent(formData[property]);
            formBody.push(encodedKey + "=" + encodedValue);
        }
        formBody = formBody.join("&");

        // Send login til Lectio
        var loginResponse = await fetch(
            `${_LECTIO_BASE_URL}/lectio/${inst}/login.aspx`,
            {
                // Send post request med formData
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formBody,
            }
        );

        var loginResponseText = loginResponse.text();
        var redirectedUrl = loginResponse.url;

        var _lecRes = new LecResponse(redirectedUrl, loginResponseText);

        // Vent på godkendt login

        if (loginResponse.redirected) {
            console.debug("Login succes");
            return {
                loginStatus: 1,
                lecRes: _lecRes,
            };
        } else {
            console.warn("Login fejl ", loginResponseText);
            var loginError = this.#parseLoginError(loginResponseText);
            return {
                loginStatus: 0,
                lecRes: _lecRes,
                loginError,
            };
        }
    };

    async logout() {
        Auth.loginStatus = {
            loginStatus: 0,
        };
        var url = _LECTIO_BASE_URL + "/lectio/" + this.inst + "/logout.aspx";
        console.debug("Logout URL: ", url);
        fetch(url);
    }

    get instList() {
        if (Auth.instList != false) {
            console.info("Auth: skoleliste er hentet, eller er igang");
            return Auth.instList;
        }

        console.debug("Auth: henter skoleliste");

        Auth.instList = new Promise(async (resolve, reject) => {
            var parser = new DOMParser();

            var res = await lecRequest.getPage(
                `${_LECTIO_BASE_URL}/lectio/login_list.aspx`
            ); // Henter skole-liste
            console.debug("Response: ", res);

            var parsedInstformData = parser.parseFromString(
                res.rawformData,
                "text/html"
            );

            var instsUnparsed =
                parsedInstformData.getElementById("schoolsdiv").childNodes;

            var count = 0;
            var instList = [];

            for (var i = 0; i < instsUnparsed.length; i++) {
                try {
                    var instURL =
                        instsUnparsed[i].childNodes[0].getAttribute("href");
                    var instName = instsUnparsed[i].textContent;

                    var chop1 = instURL.substr(instURL.indexOf("/lectio/") + 8);
                    var instId = chop1.substr(0, chop1.indexOf("/"));

                    instList.push({
                        id: instId,
                        name: instName,
                    });
                } catch (e) {}
            }

            resolve({
                count: instList.length,
                instList: instList,
            });
        });

        return Auth.instList;
    }

    /**
     *
     * @param {LecResponse} _lecRes
     */
    getPageAuthentication(_lecRes) { // Få oplysninger om aktiv bruger for enkelt Lectio-side
        let authenticated;

        // Tjek sidens login status med querySelector(`[name=msapplication-starturl]`)
        const parsedformData = this.#parser.parseFromString(_lecRes.rawformData, "text/html");
        const metaEl = parsedformData.querySelector(
            `[name=msapplication-starturl]`
        );

        if (metaEl instanceof Element) {
            const metaContent = metaEl.getAttribute("content");

            if (metaContent.includes("forside.aspx")) {
                // Personlig forside, derfor authenticated
                authenticated = true;
            } else if (metaContent.includes("default.aspx")) {
                authenticated = false;
            }
        }

        return {
            authenticated
        }
    }

    parseCurrentUserId(formData) {
        // Finder id på bruger, der er logget ind ud fra rå HTML formData
        try {
            var parsedformData = this.parser.parseFromString(formData, "text/html");

            var username =
                parsedformData.getElementsByClassName("ls-user-name")[0]
                    .textContent;
            var usernameHref =
                parsedformData.getElementsByClassName("ls-user-name")[0].href;

            var parsedHref = new URL(usernameHref);
            var parsedLink = LecRequest.parseLink(usernameHref);

            var inst = parsedLink.inst;

            // Get user type, lærer/elev
            var userType = parsedHref.searchParams.get("type");

            // Get userid
            var userId;
            switch (userType) {
                case "elev":
                    userId = parsedHref.searchParams.get("elevid");
                    userType = 0;
                    break;
                case "laerer":
                    userId = parsedHref.searchParams.get("laererid");
                    userType = 1;
                    break;
            }
        } catch (e) {
            console.loginError("User id parse fejl! ", e);
            return false;
        }

        return {
            inst, //
            userId, //
            username, //
            userType, //
        };
    }
}

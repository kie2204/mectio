class LecLoginState {

}

class LecLoginPrep {
    constructor(_lecRes) {
        var parser = new DOMParser();

        var parsedData = parser.parseFromString(_lecRes.rawData, "text/html");
        console.debug(parsedData);

        var _loginService = parsedData.getElementById("m_Content_schoolnametd").innerText;

        // Find vigtigste ASP felter
        var VSX = parsedData.getElementById("__VIEWSTATEX").getAttribute("value");
        var EVV = parsedData.getElementById("__EVENTVALIDATION").getAttribute("value");

        // Find resten af ASP felter
        var aspHidden = parsedData.querySelectorAll(".aspNetHidden")
        var aspExtended = {}

        for (var el of aspHidden) {
            var _children = el.childNodes;
            for (var child of _children) {
                if (child.nodeName == "INPUT") {
                    console.log(child.name, child.value);
                    // Tilføj til extended list
                    aspExtended[child.name] = child.value;
                }
            }
        }

        this.loginService = _loginService;
        this.asp = {
            _extended: aspExtended,
            EVV,
            VSX
        }
    }
}

class Auth {
    constructor(args) {
        // Required libs
        this.lecRequest = new LecRequest();
        this.parser = new DOMParser();

        if (args?.inst) { this.inst = args.inst; }
    }

    static instList = false;
    static loginStatus = false;

    set inst(inst) {

    }

    /**
     * 
     * @param {number} inst 
     * @returns 
     */

    async prepLogin(inst) {
        var lecRes = await this.lecRequest.getPage(`${_LECTIO_BASE_URL}/lectio/${inst}/login.aspx`);
        console.debug(lecRes)

        var prep = new LecLoginPrep(lecRes);
        console.log(prep)

        return prep;
    }

    /**
     * 
     * @param {object Object} args 
     * @param {LecLoginPrep} _lecLoginPrep 
     * @returns 
     */

    login = async (args, _lecLoginPrep) => {
        var ok = args.inst ? true : false && args.username ? true : false && args.password ? true : false;
        if (ok == false) {
            console.error("Auth: kan ikke logge ind, mangler info!!!");
            return false;
        }

        // Get VIEWSTATE og EVENTVALIDATION (kræves af ASP.NET)
        if (_lecLoginPrep instanceof LecLoginPrep) {
            // OK
        } else {
            _lecLoginPrep = await this.prepLogin(args.inst);
        }

        /*
        var data = { // ALLE felter her skal sendes til Lectio
            '__EVENTTARGET': 'm$Content$submitbtn2',
            '__EVENTARGUMENT': "",
            '__SCROLLPOSITION': "",
            '__VIEWSTATEX': _lecLoginPrep.asp.VSX,
            '__VIEWSTATEY_KEY': "",
            '__VIEWSTATE': "",
            '__EVENTVALIDATION': _lecLoginPrep.asp.EVV,
            'masterfootervalue': 'X1!ÆØÅ',
            'LectioPostbackId': "",
            'm$Content$username': args.username,
            'm$Content$password': args.password
        }
        */

        var data = _lecLoginPrep.asp._extended;

        delete data['time'], data['__LASTFOCUS']

        data['__EVENTTARGET'] = 'm$Content$submitbtn2';
        data['m$Content$username'] = args.username;
        data['m$Content$password'] = args.password;
        data['LectioPostbackId'] = '';
        data['masterfootervalue'] = 'X1!ÆØÅ';

        // Generer POST url
        var formBody = [];
        for (var property in data) {
            var encodedKey = encodeURIComponent(property);
            var encodedValue = encodeURIComponent(data[property]);
            formBody.push(encodedKey + "=" + encodedValue);
        }
        formBody = formBody.join("&");

        // Send login til Lectio
        var submitPost = await fetch(`${_LECTIO_BASE_URL}/lectio/${args.inst}/login.aspx`, { // Send post request med data
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formBody
        })

        var response = submitPost.text();

        // Vent på godkendt login

        if (submitPost.redirected) {
            console.debug("Login succes")
            return {
                loginStatus: 1,
                response,
                newUrl: submitPost.url
            }
        } else {
            console.warn("Login fejl ", response)
            var error = this.parseLoginError(response)
            return {
                loginStatus: 0,
                response,
                error
            }
        }
    }

    parseLoginError(res) { // Fungerer ikke, da fejl er gemt i script tag
        //var parsed = this.parser.parseFromString(res, "text/html");

        //return parsed.querySelector("[data-title=Fejl]").innerText;
        return false;
    }

    async logout() {
        Auth.loginStatus = {
            loginStatus: 0
        }
        var url = _LECTIO_BASE_URL + "/lectio/" + this.inst + "/logout.aspx"
        console.debug("Logout URL: ", url)
        fetch(url);
    }

    get instList() {
        if (Auth.instList != false) {
            console.info("Auth: skoleliste er hentet, eller er igang")
            return Auth.instList;
        }

        console.debug("Auth: henter skoleliste")

        Auth.instList = new Promise(async (resolve, reject) => {
            var parser = new DOMParser();

            var res = await lecRequest.getPage(`${_LECTIO_BASE_URL}/lectio/login_list.aspx`); // Henter skole-liste
            console.debug("Response: ", res);

            var parsedInstData = parser.parseFromString(res.rawData, "text/html");

            var instsUnparsed = parsedInstData.getElementById("schoolsdiv").childNodes;

            var count = 0;
            var instList = [];

            for (var i = 0; i < instsUnparsed.length; i++) {
                try {
                    var instURL = instsUnparsed[i].childNodes[0].getAttribute("href");
                    var instName = instsUnparsed[i].textContent;

                    var chop1 = instURL.substr(instURL.indexOf("/lectio/") + 8);
                    var instId = chop1.substr(0, chop1.indexOf("/"));

                    instList.push({
                        id: instId,
                        name: instName
                    });
                } catch (e) { }
            }

            resolve({
                count: instList.length,
                instList: instList
            });
        });

        return Auth.instList;
    }

    get loginStatus() {
        if (Auth.loginStatus == false) {
            this.updateLoginStatus().then(() => {
                return Auth.loginStatus;
            })
        }
        return Auth.loginStatus;
    }

    /**
     * 
     * @param {LecResponse} _lecRes
     * @param {number} _inst 
     * @returns 
     */

    async updateLoginStatus(_lecRes, _inst) {
        Auth.loginStatus = new Promise(async (resolve, reject) => {
            if (_lecRes instanceof LecResponse) {
                // OK
            } else if (typeof _inst == "number") {
                // Hent ny LecRes
                _lecRes = await this.lecRequest.getPage(`${_LECTIO_BASE_URL}/lectio/${_inst}/forside.aspx`)
            } else {
                throw "Auth fejl: Ingen respons eller skole ID? Kan ikke opdatere loginstatus."
            }

            console.log("User Status", _lecRes)
            var user = this.parseCurrentUserId(_lecRes.rawData);

            if (user == false) {
                resolve({
                    loginStatus: 0
                })
            } else {
                user.loginStatus = 1;
                resolve(user);
            }
        })

        return Auth.loginStatus;
    }

    parseCurrentUserId(data) { // Finder id på bruger, der er logget ind ud fra rå HTML data
        try {
            var parsedData = this.parser.parseFromString(data, "text/html");

            var username = parsedData.getElementsByClassName("ls-user-name")[0].textContent;
            var usernameHref = parsedData.getElementsByClassName("ls-user-name")[0].href;

            var parsedHref = new URL(usernameHref)
            var parsedLink = this.lecRequest.parseLink(usernameHref)

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
            console.error("User id parse fejl! ", e)
            return false;
        }

        return {
            inst, //
            userId, //
            username, //
            userType //
        }
    }
}
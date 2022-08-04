class Auth {
    constructor(args) {
        this.lecRequest = new LecRequest();
        this.parser = new DOMParser();

        if (args?.inst) {
            this.inst = args.inst;
        }

    }

    static instList = false;
    static loginStatus = false;

    set inst(inst) {

    }

    async login(args) {
        if (!args?.inst || !args?.username || !args?.password) {
            console.error("Auth: kan ikke logge ind, mangler info!!!");
            return false;
        }

        console.debug(``)
        // Get VIEWSTATE og EVENTVALIDATION (kræves af ASP.NET)
        var rawData = await this.lecRequest.getPage(`${_LECTIO_BASE_URL}/lectio/${args.inst}/login.aspx`);
        console.debug(rawData)
        var parsedData = this.parser.parseFromString(rawData.data, "text/html");
        console.debug(parsedData);

        var aspNet_VSX = parsedData.getElementById("__VIEWSTATEX").getAttribute("value")
        var aspNet_EVV = parsedData.getElementById("__EVENTVALIDATION").getAttribute("value")

        var data = { // ALLE felter her skal sendes til Lectio
            '__EVENTTARGET': 'm$Content$submitbtn2',
            '__EVENTARGUMENT': "",
            '__SCROLLPOSITION': "",
            '__VIEWSTATEX': aspNet_VSX,
            '__VIEWSTATEY_KEY': "",
            '__VIEWSTATE': "",
            '__EVENTVALIDATION': aspNet_EVV,
            'm$Content$username': args.username,
            'm$Content$password': args.password,
            'masterfootervalue': 'X1!ÆØÅ',
            'LectioPostbackId': "" 
        }

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

        // Vent på godkendt login
        
        if (submitPost.redirected) {
            return {
                loginStatus: 1
            }
        } else {
            return {
                loginStatus: 0
            }
        }
    }

    async logout() {
        Auth.loginStatus = {
            loginStatus: 0
        }
        fetch(lectioURL + "lectio/" + this.inst + "/logout.aspx");
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

            var parsedInstData = parser.parseFromString(res.data, "text/html");

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

    async updateLoginStatus(id) {
        if (typeof id == 'undefined') {
            var x = this.lecRequest.parseLink(window.location.href).inst;
            id = parseInt(x);
        }

        Auth.loginStatus = new Promise(async (resolve, reject) => {
            var rawData = await this.lecRequest.getPage(`${_LECTIO_BASE_URL}/lectio/${id}/forside.aspx`);
            var parsedData = this.parser.parseFromString(rawData.data, "text/html");

            try {
                var username = parsedData.getElementsByClassName("ls-user-name")[0].textContent;

                var userLink = parsedData.getElementsByClassName("ls-user-name")[0].getAttribute("href")
                var userId = userLink.substr(userLink.lastIndexOf("elevid=")+7) // 7 fordi "elevid=" er 7 lang :)

                // Find elev/lærer id og type

                var userString = parsedData.getElementById("s_m_HeaderContent_MainTitle").textContent;
                var userStringFiltered = userString.substr(0, userString.indexOf(" - Forside"))

                var userType;
                switch (userStringFiltered.substr(0, userStringFiltered.indexOf(" "))) {
                    case "Eleven":
                        userType = 0;
                        break;
                    case "Læreren":
                        userType = 1;
                        break;
                }

                // Send tilbage

                resolve({
                    loginStatus: 1,
                    username: username,
                    userId: userId,
                    userType: userType,
                    inst: id
                })
            } catch (e) {
                resolve({
                    loginStatus: 0,
                    error: e,
                    username: ""
                })
            }
        })

        return Auth.loginStatus;
    }
}
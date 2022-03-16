// Lectio API - af kie2204
// Fungerer med manifest v3, kræver parse5
// Bruger indbygget fetch() der deler cookies med browseren

const parse5 = p5.parse5;
var lectioURL = "https://www.lectio.dk/"

// Main 
var lectioAPI = {
    getParseData: async function(x) { // Henter side fra lectio og parserer siden
        var reqLink = [lectioURL, x].join('')
        console.log(reqLink)
        var response = await fetch(reqLink)
        return response.text();
    },
    getInstList: async function() {
        var rawData = await this.getParseData(`lectio/login_list.aspx`);
        var parsedInstData = parse5.parse(rawData);

        var instsUnparsed = findKey(parsedInstData, "nodeName", "div").objects[0].childNodes

        var count = 0;
        var instList = []

        for (var x of instsUnparsed) {
            try {
                var instURL = x.childNodes[0].attrs[0].value
                var instName = x.childNodes[0].childNodes[0].value

                var chop1 = instURL.substr(instURL.indexOf("/lectio/")+8)
                var instId = chop1.substr(0, chop1.indexOf("/"))

                instList.push({
                    id: instId,
                    name: instName
                })
            } catch (e) {}
        }

        return {
            count: instList.length,
            instList: instList
        }
    },
    getInstData: async function(id) { // Giver JSON info om inst ud fra nummer
        var rawData = await this.getParseData(`lectio/${id}/`);
        var parsedInstData = parse5.parse(rawData);
        var filtered = findKey(parsedInstData, "value", "m_masterleftDiv").prevObject[0][1][0].value.trim()
        return {
            id: id,
            name: filtered
            // name: parsedInstData.window.document.getElementById("m_masterleftDiv").textContent.trim()
        };
    },
    getLoginStatus: async function(id) { // Giver JSON info om login ud fra inst. nummer
        if (typeof id == 'undefined') {
            var x = await browser.cookies.get(
                {
                    url: "https://www.lectio.dk/",
                    name: "LastLoginExamno"
                }
            )
            id = parseInt(x.value);
        }

        var rawData = await this.getParseData(`lectio/${id}/forside.aspx`);
        var parsedData = parse5.parse(rawData);

        try {
            var parsed2 = findKey(parsedData, "value", "ls-user-name")
            var username = parsed2.prevObject[0][1][0].value.trim()

            var userLink = parsed2.prevObject[0][0][1].value
            var userId = userLink.substr(userLink.lastIndexOf("elevid=")+7)

            // Find elev/lærer id og type

            var userString = findKey(parsedData, "value", "s_m_HeaderContent_MainTitle").prevObject[0][1][0].value.trim()
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

            return {
                loginStatus: 1,
                username: username,
                userId: userId,
                userType: userType,
                inst: id
            }
        } catch (e) {
            return {
                loginStatus: 0,
                error: e,
                username: ""
            }
        }
    },
    getUserData: async function(id, userID, type) { // Giver brugerdata // id: instID, userID: brugerens id, type: (0 = elev, 1 = lærer)
        var loginStatus = await this.getLoginStatus(id);

        if (loginStatus.loginStatus == 0) {
            return {error: "Ikke logget ind"}
        }

        var rawData;
        switch (type) {
            case 0:
                rawData = await this.getParseData(`lectio/${id}/SkemaNy.aspx?type=elev&elevid=${userID}`);
                break;
            case 1:
                rawData = await this.getParseData(`lectio/${id}/SkemaNy.aspx?type=laerer&laererid=${userID}`);
                break;
            default:
                return {error: "Bruger ikke fundet"}
        }
        var parsedData = parse5.parse(rawData);

        try {
            var userString = findKey(parsedData, "value", "s_m_HeaderContent_MainTitle").prevObject[0][1][0].value
        } catch (e) {
            return {error: "Bruger ikke fundet"}
        }
        var userPfpUrl = findKey(parsedData, "value", "s_m_HeaderContent_picctrlthumbimage").prevObject[0][0][3].value + "&fullsize=1"

        var userFullName;
        var userStringFiltered = userString.substr(0, userString.indexOf(" - Skema"))

        switch (userStringFiltered.substr(0, userStringFiltered.indexOf(" "))) {
            case "Eleven":
                var studentClass = userStringFiltered.substring(userStringFiltered.indexOf(",")+2)
                userFullName = userStringFiltered.substring(7, userStringFiltered.indexOf(","))

                return {
                    userFullName: userFullName,
                    userType: type,
                    userPfpUrl: userPfpUrl,
                    studentClass: studentClass
                }
            case "Læreren":
                var teacherInit = userStringFiltered.substring(8, userStringFiltered.indexOf(" - "))
                userFullName = userStringFiltered.substring(userStringFiltered.indexOf(" - ")+3)

                return {
                    userFullName: userFullName,
                    userType: type,
                    userPfpUrl: userPfpUrl,
                    teacherInit: teacherInit
                }
            default:
                return {error: "Bruger ikke fundet"}
        }

        return parsedData;
    },
    login: async function(id, username, password) { // Logger ind på Lectio
        // Get VIEWSTATE og EVENTVALIDATION (lectio sikkerhedskrav nederen)
        var rawData = await this.getParseData(`lectio/${id}/login.aspx`);
        var parsedInstData = parse5.parse(rawData);

        var aspNet_VSX = findKey(parsedInstData, "value", "__VIEWSTATEX").prevObject[0][0][3].value
        var aspNet_EVV = findKey(parsedInstData, "value", "__EVENTVALIDATION").prevObject[0][0][3].value

        var data = { // ALLE felter her skal sendes til Lectio
            '__EVENTTARGET': 'm$Content$submitbtn2',
            '__EVENTARGUMENT': "",
            '__SCROLLPOSITION': "",
            '__VIEWSTATEX': aspNet_VSX,
            '__VIEWSTATEY_KEY': "",
            '__VIEWSTATE': "",
            '__EVENTVALIDATION': aspNet_EVV,
            'm$Content$username': username,
            'm$Content$password': password,
            'masterfootervalue': 'X1!ÆØÅ',
            'LectioPostbackId': "" 
        }

        var formBody = [];
        for (var property in data) {
        var encodedKey = encodeURIComponent(property);
        var encodedValue = encodeURIComponent(data[property]);
        formBody.push(encodedKey + "=" + encodedValue);
        }
        formBody = formBody.join("&");

        await fetch(`${lectioURL}lectio/${id}/login.aspx`, { // Send post request med data
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formBody 
        })

        return await this.getLoginStatus(id);
    },
    logout: async function() { // Logger ud fra Lectio
        fetch(lectioURL + "lectio/1/logout.aspx")
        return await this.getLoginStatus();
    },
    getNavLinks: async function(url) {
        var response = await fetch(url)
        var rawData = await response.text();
        var parsedData = parse5.parse(rawData);

        try {
            var userString = findKey(parsedData, "value", "ls-subnav1")
        } catch (e) {
            return {error: "Bruger ikke fundet"}
        }

        var navLinks = [];
        try {
            var navArray = userString.prevObject[0][1]
        } catch (e) {
            var navArray = "";
        }

        for (var x of navArray) {
            try {
                var navName = x.childNodes[0].childNodes[0].value
                var navLink = x.childNodes[0].attrs[0].value

                navLinks.push({
                    name: navName, 
                    href: navLink
                })
            } catch (e) {}
        }

        if (navLinks.length == 0) {
            return {error: "Ingen links fundet"}
        }

        return {
            links: navLinks
        };
    },
    setAspNetSID: async function(sid, expiry) { // Sætter ASP.NET SessionId. SessionId er forbundet til dit login, og bliver normalt slettet efter session.
        await chrome.cookies.set(
            {
                url: lectioURL,
                name: "ASP.NET_SessionId",
                value: sid,
                httpOnly: true,
                path: "/",
                sameSite: "lax",
                secure: true,
                expirationDate: expiry
            }
        )
        return await chrome.cookies.get(
            {
                url: lectioURL,
                name: "ASP.NET_SessionId"
            }
        )
    },
    data: {
        getFrontPage: async function(id) {
            var loginStatus = await lectioAPI.getLoginStatus(id);

            if (loginStatus.loginStatus == 0) {
                return {error: "Ikke logget ind"}
            }

            var rawData = await lectioAPI.getParseData(`lectio/${id}/forside.aspx`);
            var parsedData = parse5.parse(rawData);

            var aktuelt = findKey(parsedData, "value", "s_m_Content_Content_aktueltIsland_pa")
            var undervisning = findKey(parsedData, "value", "s_m_Content_Content_undervisningIsland_pa")
            var komm = findKey(parsedData, "value", "s_m_Content_Content_kommIsland_pa")
            var skema = findKey(parsedData, "value", "s_m_Content_Content_skemaIsland_pa")

            return {
                notices: {},
                dashboard: aktuelt,
                education: undervisning,
                comms: komm,
                schedule: skema
            }
        }
    }
}

// Sorting function (very bad optimization)

function findKey(obj, key, value) {
	if (Array.isArray(obj)) {
		//console.log(`Array input, scanning objects`)
		
		var objects = []
		var unpackedObjects = []
		var filteredObjects = []
        var os // o(bject)s

        for (var xxx of obj) {
			if(Array.isArray(xxx)) {
                obj = obj.concat(xxx)
                obj = obj.filter(x => x !== xxx)
                //console.log(obj)
            }
		}

		for (var xxx of obj) {
			os = searchObjects(xxx, key, value)
			if (os.status == 1) {
				return os;
			}
			//console.log(os.objects)
			objects = objects.concat(os.objects)
		}

		// Unpack arrays in objects 
		for (var xxx of objects) {
			if (Array.isArray(xxx)) {
				unpackedObjects = unpackedObjects.concat(xxx)
			}
		}
		
		// Filter objects 
		//console.log(unpackedObjects)
		for (var xxxx of unpackedObjects) {
			var stringified = JSON.stringify(xxxx, function(key, value) {
				if(key == 'parentNode') { 
					return value.id;
				} else {
					return value;
				}
			})

			if (stringified.includes(value)) {
				filteredObjects.push(xxxx)
			} else {}
		}

		//console.log("All objects:")
		//console.log(filteredObjects)
		if (filteredObjects.length == 0) {
			return {"error": "Key value pair not found"}
		} else {
			return findKey(filteredObjects, key, value)
		}

	} else if (typeof(obj) == "object") {
		var xx = searchObjects(obj, key, value)
		//console.log(xx.objects)
		if (xx.status == 1) {
			return xx;
		} else {
			return findKey(xx.objects, key, value)
		}
	}
}

var prevObject = []

function searchObjects(obj, key, value) {
    //console.log("Searching this object")
    //console.log(obj)
    var objects = []

    for(let [k, val] of Object.entries(obj)) {
        if(k != "parentNode" && typeof(val) == 'object') {
            //console.log(`Found ${typeof (val)} at ${k}`)
            objects.push(obj[k])
        } else {
            //console.log(`${typeof(val)} ${k} ${val}`)
            if (k == key) {
                //console.log(`Key match! (${k}: ${val})`)
                if (val == value) {
                    //console.log("Found value " + val)
                    return {
						"status": 1,
						"objects": [obj],
						"prevObject": [prevObject]
					};
                } else {}
            } else {}
        }
    }

	prevObject = objects;

    //console.log("Found objects")
    //console.log(objects)

    return {
		"status": 0,
		"objects": objects
	};
}
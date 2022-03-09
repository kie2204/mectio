const parse5 = p5.parse5;
var lectioURL = "https://www.lectio.dk/"

// Main 
var lectioAPI = {
    getParseData: async function(x) { // Henter side fra lectio og parserer siden
        var response = await fetch([lectioURL, x].join(''))
        return response.text();
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
    getLoginStatus: async function(id) { // Giver JSON info om bruger ud fra inst. nummer
        var rawData = await this.getParseData(`lectio/${id}/`);
        var parsedInstData = parse5.parse(rawData);
        try {
            username = findKey(parsedInstData, "value", "ls-user-name").prevObject[0][1][0].value.trim()

            return {
                loginStatus: 1,
                username: username,
                inst: id
            }
        } catch (e) {
            return {
                loginStatus: 0,
                error: "Ikke logget ind",
                username: ""
            }
        }
    },
    login: async function(id, username, password) { // Logger ind på Lectio
        // Get VIEWSTATE og EVENTVALIDATION (lectio sikkerhedskrav nederen)
        var rawData = await this.getParseData(`lectio/${id}/login.aspx`);
        var parsedInstData = parse5.parse(rawData);

        var aspNet_VSX = findKey(parsedInstData, "value", "__VIEWSTATEX").prevObject[0][0][3].value
        var aspNet_EVV = findKey(parsedInstData, "value", "__EVENTVALIDATION").prevObject[0][0][3].value

        console.log(aspNet_EVV + " " + aspNet_VSX)

        var data = {
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

        fetch(`${lectioURL}lectio/${id}/login.aspx`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formBody 
        })

        return await this.getLoginStatus(id);
    },
    logout: async function() { //Logger ud fra Lectio
        fetch(lectioAPI + "1/logout.aspx")
        return await this.getLoginStatus();
    }
}

// Sorting function (very bad optimization)

function findKey(obj, key, value) {
	if (Array.isArray(obj)) {
		//console.log(`Array input, scanning objects`)
		
		var objects = []
		var unpackedObjects = []
		var filteredObjects = []
        var os

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
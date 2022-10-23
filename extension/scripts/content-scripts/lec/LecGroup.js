class LecGroupType {
    /**
     *
     * @param {string} _urlType
     * @param {string} _urlLookupType
     * @param {string} _ctxType
     * @param {boolean} _ctxable
     * @param {Object} _additionalData
     */
    constructor(
        _urlType,
        _urlLookupType,
        _ctxType = null,
        _ctxable = false,
        _additionalData = {}
    ) {
        this.urlType = _urlType;
        this.urlLookupType = _urlLookupType;
        if (typeof _ctxType == "string") {
            this.ctxType = _ctxType;
            this.ctxable = _ctxable;
        }
        this.additionalData = _additionalData;
    }
}

class LecGroup {
    #validTypes = [
        new LecGroupType("elev", "elevid", "S", true),
        new LecGroupType("laerer", "laererid", "T", true),
        new LecGroupType("holdelement", "holdelementid", "HE", true),
        new LecGroupType("stamklasse", "klasseid", "SC", false), // SC for stamclass haha
        new LecGroupType("lokale", "id", false, false, {
            urlParams: { nosubnav: 1 },
        }),
    ];

    constructor(_urlType, _id) {
        let _type = this.#validTypes.find(function (type) {
            return _urlType === type.urlType;
        });
        if (!(_type instanceof LecGroupType)) throw `Ugyldig type ${_urlType}`;

        this.type = _type;
        this.id = _id;
    }
    
    get contextId() {
        if (this.type.ctxable == false)
            console.warn("Gruppe", this.type, "kan ikke bruges til ctx.!");
        return this.type.ctxType + this.id;
    }
}

class LecUser extends LecGroup {
    #validTypes = [
        new LecGroupType("elev", "elevid", "S"),
        new LecGroupType("laerer", "laererid", "T"),
    ];

    constructor(_urlType, _id) {
        // Type Check
        if (!this.#validTypes.includes(_gtype))
            throw `Ugyldig gruppe type ${_type}`;
    }
}

/* this.currentUser = {
    signedIn: false,
    general: {
        userId: 0,
        username: "",
        userType: 0
    },
    display: {
        pictureUrl: "",
        firstName: "",
        lastName: "",
    },
    studentInfo: {
        class: "", // eks. 1a
        groups: {
            teams: [],
            internalGroups: [],
            otherGroups: []
        },
        studentId: "" // eks. 1a 23
    }
} */

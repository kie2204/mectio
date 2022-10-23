class LecGroupType {
    constructor(_urlType, _urlLookupType, _ctxType, _ctxable) {
        this.urlType = _urlType;
        this.urlLookupType = _urlLookupType;
        this.ctxType = _ctxType ? _ctxType : null;
    }
}

class LecGroup {
    #validTypes = [
        new LecGroupType("elev", "elevid", "S"),
        new LecGroupType("laerer", "laererid", "T"),
        new LecGroupType("holdelement", "holdelementid", "HE"),
        new LecGroupType("stamklasse", "klasseid"),
    ];

    constructor(_urlType, _id) {
        if (!this.#validTypes.includes(_type)) throw `Ugyldig type ${_type}`;
        this.type = _type;
        this.id = _id;
    }
    set id(x) {}
    #populateFromResponse(_lecRes) {}
    #generateContextId(type, id) {
        return type + id;
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

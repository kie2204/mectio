catchPhrases = {}

catchPhrases.get = function (type) {
    switch (type) {
        case "loading":
            return "starter robot-maskine"
            break;
        default:
            return "..øøøhh? (catchPhrases fejl: mangler type)"
    }

}
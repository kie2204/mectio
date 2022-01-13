catchPhrases = {}

catchPhrases.get = function (type) {
    switch (type) {
        case "loading":
            return "starter robot-maskine"
        default:
            console.log("catchPhrases fejl: mangler type")
            return "..øøøhh?"
    }

}
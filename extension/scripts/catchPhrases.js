catchPhrases = {}

catchPhrases.get = function (type) {
    switch (type) {
        case "loading":
            var phrases = ["starter robot-maskine", "afskaffer forældet grafik", "finder noget flot til din skærm"]
            var index = Math.round(Math.random()*phrases.length)

            return phrases[index]
        default:
            console.log("catchPhrases fejl: mangler type")
            return "..øøøhh?"
    }

}
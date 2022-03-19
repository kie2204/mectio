var logs = {
    logLevel: 0,
    info: function(l) {
        try {
            var name = this.info.caller.name
        } catch (e) {
            var name = ""
        }
        if (this.logLevel <= 0) {
            console.log(`mectio [INFO] (${name}): ${l}`)
        }
    },
    warn: function(l) {
        try {
            var name = this.warn.caller.name
        } catch (e) {
            var name = ""
        }
        if (this.logLevel <= 1) {
            console.warn(`mectio [WARN] (${name}): ${l}`)
        }
    },
    error: function(l) {
        try {
            var name = this.error.caller.name
        } catch (e) {
            var name = ""
        }
        if (this.logLevel <= 2) {
            console.error(`mectio [ERROR] (${name}): ${l}`)
        }
    }
}
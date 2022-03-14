var loadConfig = async function(){
    var config = await chrome.storage.local.get(['config']);

    if (typeof(config.config) != "object") {
        console.log("Config invalid, resetting to default")
        await setDefaultConfig();
    }

    return config.config;
}

var saveConfig = function(config){
    chrome.storage.local.set({config: config}, function() {
        console.log('Value is set to ' + config);
    });
}

var setDefaultConfig = async function(){
    var fetched = await fetch("/config.mectio")
    var defaultConfig = await fetched.json()

    await chrome.storage.local.set({config: defaultConfig});
    return true;
}

window.addEventListener("load", async function(){
    currentConfig = await loadConfig();
    document.getElementById("config-text").value = JSON.stringify(currentConfig);

    document.getElementById("save-config").addEventListener("click", function(){
        var config = JSON.parse(document.getElementById("config-text").value)
        saveConfig(config)
    })

    document.getElementById("reset-config").addEventListener("click", async function(){
        await setDefaultConfig();

        currentConfig = await loadConfig();
        document.getElementById("config-text").value = JSON.stringify(currentConfig);
    })

    var settings = document.getElementsByClassName("settings-option")

    for (var x of settings) {
        value = x.getAttribute("value")

        if (currentConfig[value] == 1) {
            x.querySelector("input").checked = true;
        }

        x.querySelector("input").addEventListener("change", async function(){
            value = x.getAttribute("value")

            if (this.checked) {
                currentConfig[value] = 1;
            } else {
                currentConfig[value] = 0;
            }

            await saveConfig(currentConfig)
            document.getElementById("config-text").value = JSON.stringify(currentConfig);
        })
    }
})
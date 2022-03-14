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
    x = await loadConfig();
    document.getElementById("config-text").value = JSON.stringify(x);

    document.getElementById("save-config").addEventListener("click", function(){
        var config = JSON.parse(document.getElementById("config-text").value)
        saveConfig(config)
    })

    document.getElementById("reset-config").addEventListener("click", async function(){
        await setDefaultConfig();

        x = await loadConfig();
        document.getElementById("config-text").value = JSON.stringify(x);
    })
})
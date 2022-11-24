// mectio preload, ubrugt

window.loadP = function(pageData) {
    pageData = pageData.replace("LectioPageOps.InitializeHistory(PageHistoryBehavior.PrevUrl);", "") // fjerner funktion der forstyrrer historik
    
    console.log("...")

    document.open();
    document.write(pageData);
    document.close();
    
    console.log("ok")

    setTimeout(() => {
        window.parent.postMessage("ready");
    }, 100)
}

var pageData = document.querySelector("script").getAttribute("pageData")

window.loadP(pageData)
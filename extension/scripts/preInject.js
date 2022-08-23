// mectio preload

window.loadP = function(pageData) {
    pageData2 = pageData.replace("LectioPageOps.InitializeHistory(PageHistoryBehavior.PrevUrl);", "") // fjerner funktion der forstyrrer mectio
    
    console.log("...")

    document.open();
    document.write(pageData2);

    document.close();
    console.log("ok")

    setTimeout(function(){
        window.parent.postMessage("ready")   
    }, 100)
}

var pageData = document.querySelector("script").getAttribute("pageData")

window.loadP(pageData)
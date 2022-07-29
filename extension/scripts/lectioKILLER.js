// Kører i main world, har adgang til lectio js funktioner
// I nogle tilfælde bliver lectio scripts indlæst, nogle af dem påvirker mectio

window.addEventListener("load", function(){
    // Rydder timer for sessionsudløb, sletter funktion
    try {
        clearInterval(SessionHelper.Instance.sessionCheckIntervalId);
    } catch (e) {
        console.log("SessionHelper ikke aktiv, ignorerer")
    }
    delete SessionHelper;
})
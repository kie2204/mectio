// Kører i main world, har adgang til lectio js funktioner
// I nogle tilfælde bliver lectio scripts indlæst, her slettes de værste funktioner

window.addEventListener("load", function(){
    // Rydder timer for sessionsudløb, sletter funktion
    if (SessionHelper?.Instance) {
        clearInterval(SessionHelper.Instance.sessionCheckIntervalId);
    }
    delete SessionHelper;
    // Ved ikke hvad den her gør
    delete LectioPageOps;
})
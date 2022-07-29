// Rydder timer for sessionsudløb, sletter funktion
try {
    clearInterval(SessionHelper.Instance.sessionCheckIntervalId);
} catch (e) {
    console.log("SessionHelper ikke aktiv, ignorerer")
}
delete SessionHelper;
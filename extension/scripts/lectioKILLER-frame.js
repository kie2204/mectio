// Rydder timer for sessionsudløb, sletter funktion
if (SessionHelper?.Instance) {
    clearInterval(SessionHelper.Instance.sessionCheckIntervalId);
}
delete SessionHelper;
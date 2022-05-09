// Rydder timer for sessionsudløb, sletter funktion
clearInterval(SessionHelper.Instance.sessionCheckIntervalId);
delete SessionHelper;
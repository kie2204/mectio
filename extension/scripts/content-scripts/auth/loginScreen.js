class LoginScreen {
    constructor(args) {
        this.authLib = new Auth();
        this.lecReqLib = new LecRequest();

        this.defaultInst = args.defaultInst; // defaultInst åbner automatisk den valgte skoles login-side
        this.callback = args?.submitCallback || this.authLib.login; // callback når der klikkes log ind

        var loginPage = new wmWindow({
            windowId: "mectio-login",
            appearWait: true
        });
        
        this.lecReqLib.getLocalPage("/pages/login-screen/index.html").then(async (page) => {
            await loginPage.initStatus;
            windowManager.setHeaderState(0);
            return page;
        }).then((page) => {
            loginPage.element.innerHTML = page;
        })
    }

    submit(args) {
        return this.callback(args);
    }

    show() {

    }
    
    hide() {

    }
}
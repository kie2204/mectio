class LoginScreen {
    #inst = NaN;
    #loginStep = 1;
    #onSuccessfulLogin = function () {};
    #loginPrep = null;

    /**
     *
     * @param {number | undefined} [inst] Sæt denne hvis skole-id skal skiftes under konstruktion
     * @param {Auth} auth Auth-klasse
     */
    constructor(auth, inst) {
        this.auth = auth;
        this.windowState = false;
        this.lecReqLib = new LecRequest();
    }

    async requestLogin(_inst = NaN, loginPrep = null) { // Kan bruges eksternt hvis bruger ikke er logget ind
        if (loginPrep) {
            this.#loginPrep = loginPrep;
        } else {
            this.#loginPrep = null;
        }

        if (!isNaN(_inst)) {
            this.#inst = _inst;
        }

        return new Promise((resolve, reject) => {
            this.#onSuccessfulLogin = (res) => {
                console.log("Success");

                this.closeWindow();
                resolve(res);
            };

            this.openWindow();
        });
    }

    async waitForLogin() { // Forældet
        return new Promise((resolve, reject) => {
            this.successCallback = (res) => {
                console.log("Succ");
                resolve(res);
            };

            this.openWindow();
        });
    }

    async openWindow() { // Åbner loginvindue
        this.loginPage = windowManager2.createWindow({
            hidden: true,
            exclusive: true,
        });

        this.lecReqLib
            .getLocalPage("/pages/login-screen/index.html")
            .then(async (page) => { // Pre
                return page;
            })
            .then((page) => { // Injicer HTML
                this.loginPage.windowElement.innerHTML = page;
                return this.prepWindow(this.loginPage);
            })
            .then(() => { //
                this.windowState = true;

                if (!isNaN(this.#inst)) {
                    this.inst = this.#inst;
                    this.toStep2();
                }
            });
    }

    async closeWindow() { // Lukker vindue
        console.debug("Lukker...");

        if (typeof this.loginPage != "object") return false;

        window.requestAnimationFrame(async () => {
            var container = document.querySelector("#login-screen-container");
            var box = document.querySelector("#login-screen-box");

            container.style.transitionDuration = "0.2s";
            box.style.transitionDuration = "0.2s";

            container.classList.add("hidden");

            await new Promise((resolve) => {
                container.addEventListener("transitionend", () => {
                    resolve(true);
                });
            });

            this.windowState = false;
            windowManager2.destroyWindow(this.loginPage.id);
            return true;
        });
    }

    prepWindow = async (w) => { // Forbereder knapper til input
        // Forbered login-vindue
        await this.getInstList();

        document
            .querySelector(".login-search")
            .addEventListener("input", () => {
                var filter = document.querySelector(".login-search").value;
                return this.filterInstList(filter);
            });

        document
            .querySelector("#login-return.login-button")
            .addEventListener("click", () => {
                return this.returnButton();
            });

        document
            .querySelector("#login-main.login-button")
            .addEventListener("click", () => {
                return this.loginButton();
            });

        document
            .querySelector("#input-container-container")
            .addEventListener("submit", (e) => {
                e.preventDefault();
                return this.loginButton();
            });

        document
            .querySelector("#mectio-disable-link")
            .addEventListener("click", () => {
                loadConfig()
                    .then((c) => {
                        c.enabled = 0;

                        return saveConfig(c);
                    })
                    .then(() => {
                        window.location.reload();
                    });
            });

        w.hidden = false;
        setTimeout(function () {
            var container = document.querySelector("#login-screen-container");
            var box = document.querySelector("#login-screen-box");

            container.style.transitionProperty = "transform, opacity";
            box.style.transitionProperty = "transform, opacity";

            container.style.transitionDuration = "0.2s";
            box.style.transitionDuration = "0.2s";

            container.classList.remove("hidden");
        }, 1);

        return;
    }

    returnButton() {
        if (this.#loginStep == 1) return;

        this.toStep1();
    }

    loginButton() {
        if (this.#loginStep == 1) {
            this.toStep2();
        } else if (this.#loginStep == 2) {
            this.submit({
                inst: this.#inst,
                username: document.getElementById("login-username").value,
                password: document.getElementById("login-password").value,
            });
        }
    }

    async toStep1() {
        var root = document.documentElement;
        root.style.setProperty("--login-step", 1);
        this.#loginStep = 1;
        document
            .querySelector("#login-return.login-button")
            .setAttribute("disabled", "");
        if (!this.#inst) {
            document
                .querySelector("#login-main.login-button")
                .setAttribute("disabled", "");
        }
    }

    async toStep2() {
        console.debug("LoginScreen: Går til trin 2, inst", this.#inst);

        var instName = await Promise.resolve(this.auth.instList).then(
            (list) => {
                var matchedInst = list.instList.filter((obj) => {
                    return obj.id == this.#inst; // Tjekker om ID fra liste matcher valgt ID
                })[0]; // Første match

                if (typeof matchedInst == "object") {
                    return matchedInst.name;
                } else {
                    return false;
                }
            }
        );

        if (!instName) {
            console.warn("LoginScreen: Kan ikke nå trin 2, ugyldigt skole ID");
            return false;
        }

        document.getElementById("{_MECTIO_CURRENTINST}").innerText = instName;

        var root = document.documentElement;
        root.style.setProperty("--login-step", 2);

        document
            .querySelector("#login-return.login-button")
            .removeAttribute("disabled");
        this.#loginStep = 2;

        await new Promise((resolve) => {
            // async wait 300ms
            setTimeout(() => {
                resolve(true);
            }, 300);
        });

        document.querySelector("#login-username").focus();
    }

    filterInstList(filterString) {
        // Filtrerer viste skoler ud fra string
        for (var button of document.querySelector(".login-list").childNodes) {
            var name = button.innerHTML.toLowerCase()
                ? button.innerHTML.toLowerCase()
                : "";
            var match = filterString.toLowerCase();

            // console.debug(name, match, name.includes(match))
            if (name.includes(match)) {
                button.removeAttribute("tabindex");
                button.classList.remove("hidden");
            } else {
                button.setAttribute("tabindex", "-1");
                button.classList.add("hidden");
            }
        }
    }

    async getInstList() {
        var listElement = document.querySelector(".login-list");
        await Promise.resolve(this.auth.instList).then((list) => {
            // Tilføj til loginskærm
            listElement.innerHTML = "";

            for (var inst of list.instList) {
                var element = document.createElement("a");
                element.classList.add("login-opt");
                element.setAttribute("id", inst.id);
                element.setAttribute("href", "#");
                element.innerText = inst.name;
                listElement.appendChild(element);

                // Add listener
                element.addEventListener("click", (e) => {
                    this.inst = e.target.id;
                });
            }
        });

        console.log("getinstlist done");
        return;
    }

    set inst(inst) {
        if (parseInt(inst) === NaN) return false;

        this.#inst = inst;

        if (this.windowState == false) return;

        document
            .querySelector("#login-main.login-button")
            .removeAttribute("disabled");

        for (var button of document.querySelector(".login-list").childNodes) {
            if (this.#inst == button.id) {
                button.classList.add("selected");
            } else {
                button.classList.remove("selected");
            }
        }
    }

    submit(args, loginPrep) {
        return this.auth.login(args, loginPrep).then((loginRes) => {
            console.debug(loginRes.loginStatus);
            var ok = loginRes.loginStatus;

            if (ok == false) return loginRes;

            this.#onSuccessfulLogin(loginRes);
            return loginRes;
        });
    }

    show() {
        this.loginPage.appear();
    }

    hide() {
        this.loginPage.hide();
    }
}

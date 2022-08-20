class LoginScreen {
    #inst = NaN;
    #loginStep = 1;

    constructor(args) {
        this.authLib = new Auth();
        this.lecReqLib = new LecRequest();
        this.#inst = args?.inst ? args?.inst : NaN;

        this.callback = args?.submitCallback || this.authLib.login; // callback når der klikkes log ind
    }

    async openWindow() {
        this.loginPage = windowManager2.createWindow({
            exclusive: true
        });
        
        this.lecReqLib.getLocalPage("/pages/login-screen/index.html").then(async (page) => {
            windowManager2.headerState = 0;
            return page;
        }).then((page) => {
            this.loginPage.windowElement.innerHTML = page;
            return this.prepWindow();
        }).then(() => {
            if (!isNaN(this.#inst)) {
                this.inst = this.#inst;
                this.toStep2();
            }
        })
    }

    async prepWindow() { // Forbered login-vindue
        await this.getInstList();

        document.querySelector(".login-search").addEventListener("input", () => {
            var filter = document.querySelector(".login-search").value
            return this.filterInstList(filter)
        })

        document.querySelector("#login-return.login-button").addEventListener("click", () => {
            return this.returnButton();
        })

        document.querySelector("#login-main.login-button").addEventListener("click", () => {
            return this.loginButton();
        })

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
            this.callback({
                inst: this.#inst,
                username: document.getElementById("login-username").value,
                password: document.getElementById("login-password").value
            })
        }
    }

    async toStep1() {
        var root = document.documentElement;
        root.style.setProperty("--login-step", 1)
        this.#loginStep = 1;
        document.querySelector("#login-return.login-button").setAttribute("disabled", "")
        if (!this.#inst) {
            document.querySelector("#login-main.login-button").setAttribute("disabled", "")
        }
    }

    async toStep2() {
        console.log("Inst", this.#inst)
        var root = document.documentElement;
        root.style.setProperty("--login-step", 2)

        document.querySelector("#login-return.login-button").removeAttribute("disabled")
        this.#loginStep = 2;

        Promise.resolve(this.authLib.instList).then((list) => {
            var instText = list.instList.filter(obj => {
                return obj.id == this.#inst;
            })[0].name;

            document.getElementById("{_MECTIO_CURRENTINST}").innerText = instText;
        })
    }

    filterInstList(filterString) { // Filtrerer viste skoler ud fra string
        for (var button of document.querySelector(".login-list").childNodes) {
            var name = button.innerHTML.toLowerCase() ? button.innerHTML.toLowerCase() : ""
            var match = filterString.toLowerCase()

            console.debug(name, match, name.includes(match))
            if (name.includes(match)) {
                button.removeAttribute("tabindex")
                button.classList.remove("hidden")
            } else {
                button.setAttribute("tabindex", "-1")
                button.classList.add("hidden")
            }
        }
    }

    async getInstList() {
        var listElement = document.querySelector(".login-list")
        await Promise.resolve(this.authLib.instList).then((list) => {
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
                })
            }
        })

        console.log("getinstlist done")
        return;
    }

    set inst(inst) {
        if (parseInt(inst) === NaN) return false;

        this.#inst = inst;
        for (var button of document.querySelector(".login-list").childNodes) {
            if (this.#inst == button.id) {
                button.classList.add("selected")
            } else {
                button.classList.remove("selected")
            }
        }

        document.querySelector("#login-main.login-button").removeAttribute("disabled")
    }

    submit(args) {
        return this.callback(args);
    }

    show() {
        if (this.loginPage.initStatus == false) {
            this.loginPage.init(this.windowArgs);
        }
        this.loginPage.appear()
    }
    
    hide() {
        this.loginPage.hide()
    }
}
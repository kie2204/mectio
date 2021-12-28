windowManager = {}

windowManager.init = () => {
    // Stop loading site, replace title
    window.stop();
    document.body.innerHTML = "";
    document.title = "mectio";

    // Inject mectio document structure
    fetch(browser.runtime.getURL('/pages/main.html')).then(r => r.text()).then(html => {
        document.body.insertAdjacentHTML('beforeend', html);
        // not using innerHTML as it would break js event listeners of the page // comment from stackoverflow

        document.getElementById("mectio-logo").setAttribute("src", browser.runtime.getURL('/icons/logo-text-dark.svg'));
        document.getElementById("style-general").setAttribute("href", browser.runtime.getURL('/pages/styles/general.css'));
    });

    return new Promise(resolve => {
        browser.runtime.sendMessage({
            action: "fetch",
            page: "https://www.lectio.dk/lectio/login_list.aspx"
        }, (response) => {
            resolve(response.data);
        })
    });
}
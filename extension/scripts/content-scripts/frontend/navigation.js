// mectio navigation manager
// Handles page loads, redirects, navbar

var navigation = {
    parseLinkObject: function(attr){
        var link = attr.link;
        var page = attr.page;
        var inst;

        if (typeof link != "undefined") {
            // Parse link
            inst = parseInt(link.substr(link.indexOf("/lectio/")+8).substr(0,link.substr(link.indexOf("/lectio/")+8).indexOf("/")))

            if (link.includes(`https://www.lectio.dk/lectio/${inst}/forside.aspx`)) {
                page = "forside" 
            }
        }

        if (typeof link == "undefined" && typeof page != "undefined") {
            inst = defaultInst;

            if (page == "forside") {
                link = `https://www.lectio.dk/lectio/${inst}/forside.aspx`;
            }
        }

        var url = new URL(link);
        url.searchParams.delete('prevurl');

        link = url.href;

        logs.info(JSON.stringify({
            link: link,
            page: page,
            inst: inst
        }))

        return {
            link: link,
            page: page,
            inst: inst
        };
    },
    navbar: {
        loadDefault: function() {

        },
        maxLoadedGroups: 5,
        loadGroup: function(attr) {

        },
        deleteGroup: function(attr) {

        },
    },
    pageLoad: {
        loadConfig: {
            "forside": "pages/mectio/forside/"  
        },
        loadURL: function(attr) {
            // Convert to data object from link
            pageMeta = navigation.parseLinkObject(attr.url);

            if (this.loadConfig[pageMeta.page]) {
                alert(this.loadConfig[pageMeta.page])
            }
        }
    }
}
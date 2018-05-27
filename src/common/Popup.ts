import * as $ from "jquery";
import * as L from "leaflet";

const API_URL = "https://www.zeldadungeon.net/wiki/api.php?format=json";

enum ContentState {
    Initial,
    Loading,
    Loaded
}

export interface Options extends L.PopupOptions {
    id: string;
    name: string;
    link?: string;
    editLink?: string;
    complete(): void;
    uncomplete(): void;
    linkClicked(target: string): void;
}

export class Popup extends L.Popup {
    public options: Options;
    private container: HTMLElement;
    private body: HTMLElement;
    private contentState = ContentState.Initial;

    private constructor(options: Options) {
        super(options);

        this.container = L.DomUtil.create("div", "zd-popup");

        const title = L.DomUtil.create("h3", "zd-popup__title", this.container);
        if (options.link) {
            const link = L.DomUtil.create("a", "", title);
            link.setAttribute("target", "_blank");
            link.setAttribute("href", `/wiki/${encodeURIComponent(options.link)}`);
            link.innerText = options.name;
        } else {
            title.innerText = options.name;
        }

        this.body = L.DomUtil.create("div", "zd-popup__body", this.container);

        const controls = L.DomUtil.create("div", "zd-popup__controls", this.container);

        const completeButton = L.DomUtil.create("a", "zd-popup__control zd-popup__control--complete", controls);
        L.DomUtil.create("i", "fa fa-check", completeButton).title = "Mark completed";
        L.DomEvent.addListener(completeButton, "click", options.complete);

        const uncompleteButton = L.DomUtil.create("a", "zd-popup__control zd-popup__control--uncomplete", controls);
        L.DomUtil.create("i", "fa fa-undo", uncompleteButton).title = "Mark not completed";
        L.DomEvent.addListener(uncompleteButton, "click", options.uncomplete);

        if (options.editLink) {
            const editButton = L.DomUtil.create("a", "zd-popup__control zd-popup__control--edit", controls);
            editButton.setAttribute("target", "_blank");
            editButton.setAttribute("href", `/wiki/index.php?action=edit&title=${encodeURIComponent(options.editLink)}`);
            L.DomUtil.create("i", "fa fa-edit", editButton).title = "Edit";
        }

        const linkButton = L.DomUtil.create("a", "zd-popup__control zd-popup__control--permalink", controls);
        linkButton.setAttribute("href", `?id=${options.id}`);
        L.DomUtil.create("i", "fa fa-link", linkButton).title = "Permalink";

        this.setContent(this.container);
    }

    public static create(options: Options): Popup {
        if (options.autoPan == undefined) { options.autoPan = true; }
        if (options.maxWidth == undefined) { options.maxWidth = 300; }

        return new Popup(options);
    }

    public loadContentFromSummary(pageTitle: string): void {
        if (this.contentState === ContentState.Initial) {
            this.startLoading();
            $.getJSON(`${API_URL}&action=query&prop=pageprops&titles=${encodeURIComponent(pageTitle)}&callback=?`)
                .then(result => {
                    const pageId = Object.keys(result.query.pages)[0];
                    const page = result.query.pages[pageId];
                    this.loadContent(pageId === "-1" || !page.pageprops || !page.pageprops.description ?
                        "" : `<p>${page.pageprops.description}</p>`);
                });
        }
    }

    public loadContentFromSection(pageTitle: string, sectionName: string): void {
        if (this.contentState === ContentState.Initial) {
            this.startLoading();
            const textToParse = encodeURIComponent(`{{#lst:${pageTitle}|${sectionName}}}`);
            $.getJSON(`${API_URL}&action=parse&prop=text&contentmodel=wikitext&text=${textToParse}&callback=?`)
                .then(result => {
                    let content = result.parse.text["*"];
                    content = content.replace(/\s*<!--[\s\S]*-->\s*/g, "");
                    if (content.match(/page does not exist/)) {
                        content = content.replace(`>${name}</a>`, ">Create this article</a>");
                    }
                    this.loadContent(content);
                });
        }
    }

    public loadContentFromSubpage(pageTitle: string, subsubpage: string): void {
        const subpage = subsubpage ? `Map/${subsubpage}` : "Map";
        this.loadContentFromPage(`${pageTitle}/${subpage}`);
    }

    public loadContentFromPage(pageTitle: string): void {
        if (this.contentState === ContentState.Initial) {
            this.startLoading();
            $.getJSON(`${API_URL}&action=parse&page=${encodeURIComponent(pageTitle)}&callback=?`)
                .then(result => {
                    this.loadContent(result.parse && result.parse.text["*"] || "");
                });
        }
    }

    private startLoading(): void {
        this.contentState = ContentState.Loading;
        const loading = L.DomUtil.create("div", "zd-popup__loading-indicator", this.body);
        L.DomUtil.create("i", "fa fa-circle-o-notch fa-spin fa-3x fa-fw", loading);
    }

    private loadContent(content: string): void {
        this.body.innerHTML = content;
        const internalLinks = this.body.getElementsByClassName("internal-link");
        for (let i = 0; i < internalLinks.length; ++i) {
            const link = <HTMLElement>internalLinks[i];
            L.DomEvent.addListener(link, "click", () => {
                const id = link.getAttribute("data-target");
                if (id) {
                    this.options.linkClicked(id);
                }
            });
        }
        this.setContent(this.container); // force it to resize and recenter
        this.contentState = ContentState.Loaded;
    }
}
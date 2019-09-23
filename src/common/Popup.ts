import * as L from "leaflet";
import { dom, library } from "@fortawesome/fontawesome-svg-core";
import { WikiConnector } from "./WikiConnector";
import { faCheck } from "@fortawesome/free-solid-svg-icons/faCheck";
import { faCircleNotch } from "@fortawesome/free-solid-svg-icons/faCircleNotch";
import { faEdit } from "@fortawesome/free-solid-svg-icons/faEdit";
import { faLink } from "@fortawesome/free-solid-svg-icons/faLink";
import { faUndo } from "@fortawesome/free-solid-svg-icons/faUndo";

library.add(faCheck, faUndo, faEdit, faLink, faCircleNotch);
dom.watch();

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
    getWikiConnector(): WikiConnector;
    complete(): void;
    uncomplete(): void;
    linkClicked(target: string): void;
}

/**
 * Popup that opens when clicking on a marker. Contains information and controls.
 */
export class Popup extends L.Popup {
    public options: Options;
    private container: HTMLElement;
    private body: HTMLElement;
    private controls: HTMLElement;
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

        this.controls = L.DomUtil.create("div", "zd-popup__controls", this.container);

        const completeButton = L.DomUtil.create("a", "zd-popup__control zd-popup__control--complete", this.controls);
        L.DomUtil.create("i", "fas fa-check", completeButton).title = "Mark completed";
        L.DomEvent.addListener(completeButton, "click", () => {
            this.markCompleted();
            options.complete();
        });

        const uncompleteButton = L.DomUtil.create("a", "zd-popup__control zd-popup__control--uncomplete", this.controls);
        L.DomUtil.create("i", "fas fa-undo", uncompleteButton).title = "Mark not completed";
        L.DomEvent.addListener(uncompleteButton, "click", () => {
            this.markUncompleted();
            options.uncomplete();
        });

        if (options.editLink) {
            const editButton = L.DomUtil.create("a", "zd-popup__control zd-popup__control--edit", this.controls);
            editButton.setAttribute("target", "_blank");
            editButton.setAttribute("href", `/wiki/index.php?action=edit&title=${encodeURIComponent(options.editLink)}`);
            L.DomUtil.create("i", "fas fa-edit", editButton).title = "Edit";
        }

        const linkButton = L.DomUtil.create("a", "zd-popup__control zd-popup__control--permalink", this.controls);
        linkButton.setAttribute("href", `?id=${options.id}`);
        L.DomUtil.create("i", "fas fa-link", linkButton).title = "Permalink";

        this.setContent(this.container);
    }

    public static create(options: Options): Popup {
        if (options.autoPan == undefined) { options.autoPan = true; }
        if (options.minWidth == undefined) { options.minWidth = 100; }
        if (options.maxWidth == undefined) { options.maxWidth = 300; }

        return new Popup(options);
    }

    public markCompleted(): void {
        L.DomUtil.addClass(this.controls, "zd-popup__controls--completed");
    }

    public markUncompleted(): void {
        L.DomUtil.removeClass(this.controls, "zd-popup__controls--completed");
    }

    public loadContentFromSummary(pageTitle: string): void {
        if (this.contentState === ContentState.Initial) {
            this.startLoading();
            this.options.getWikiConnector().query<any>(`action=query&prop=pageprops&titles=${encodeURIComponent(pageTitle)}`)
                .then(result => {
                    // TODO move result parsing to WikiConnector
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
            const textToParse = encodeURIComponent(`{{#vardefine:gsize|300}}{{#vardefine:galign|left}}{{#vardefine:gpad|0}}{{#vardefine:square|false}}{{#lst:${pageTitle}|${sectionName}}}`);
            this.options.getWikiConnector().query<any>(`action=parse&prop=text&contentmodel=wikitext&text=${textToParse}`)
                .then(result => {
                    // TODO move result parsing to WikiConnector
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
            this.options.getWikiConnector().query<any>(`action=parse&page=${encodeURIComponent(pageTitle)}`)
                .then(result => {
                    // TODO move result parsing to WikiConnector
                    this.loadContent(result.parse && result.parse.text["*"] || "");
                });
        }
    }

    private startLoading(): void {
        this.contentState = ContentState.Loading;
        const loading = L.DomUtil.create("div", "zd-popup__loading-indicator", this.body);
        L.DomUtil.create("i", "fas fa-circle-notch fa-spin fa-3x fa-fw", loading);
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
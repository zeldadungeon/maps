import { DomEvent, DomUtil, Popup } from "leaflet";
import { dom, library } from "@fortawesome/fontawesome-svg-core";
import { WikiConnector } from "./WikiConnector";
import { faCheck } from "@fortawesome/free-solid-svg-icons/faCheck";
import { faCircleNotch } from "@fortawesome/free-solid-svg-icons/faCircleNotch";
import { faEdit } from "@fortawesome/free-solid-svg-icons/faEdit";
import { faLink } from "@fortawesome/free-solid-svg-icons/faLink";
import { faUndo } from "@fortawesome/free-solid-svg-icons/faUndo";

library.add(faCheck, faUndo, faEdit, faLink, faCircleNotch);
dom.watch();

enum ContentState {
  Initial,
  Loading,
  Loaded,
}

export interface Options extends L.PopupOptions {
  id: string;
  name: string;
  link?: string;
  editLink?: string;
  wiki: WikiConnector;
  linkClicked(target: string): void;
}

/**
 * Popup that opens when clicking on a marker. Contains information and controls.
 */
export class ZDPopup extends Popup {
  public myOptions: Options;
  private container: HTMLElement;
  private body: HTMLElement;
  private controls: HTMLElement;
  private contentState = ContentState.Initial;

  private constructor(options: Options) {
    super(options);
    this.myOptions = options;

    this.container = DomUtil.create("div", "zd-popup");

    const title = DomUtil.create("h3", "zd-popup__title", this.container);
    if (options.link) {
      const link = DomUtil.create("a", "", title);
      link.setAttribute("target", "_blank");
      link.setAttribute("href", `/wiki/${encodeURIComponent(options.link)}`);
      link.innerText = options.name;
    } else {
      title.innerText = options.name;
    }

    this.body = DomUtil.create("div", "zd-popup__body", this.container);

    this.controls = DomUtil.create("div", "zd-popup__controls", this.container);

    const completeButton = DomUtil.create(
      "a",
      "zd-popup__control zd-popup__control--complete",
      this.controls
    );
    DomUtil.create("i", "fas fa-check", completeButton).title =
      "Mark completed";
    DomEvent.addListener(completeButton, "click", () => {
      this.markCompleted();
      this.fire("complete");
    });

    const uncompleteButton = DomUtil.create(
      "a",
      "zd-popup__control zd-popup__control--uncomplete",
      this.controls
    );
    DomUtil.create("i", "fas fa-undo", uncompleteButton).title =
      "Mark not completed";
    DomEvent.addListener(uncompleteButton, "click", () => {
      this.markUncompleted();
      this.fire("uncomplete");
    });

    if (options.editLink) {
      const editButton = DomUtil.create(
        "a",
        "zd-popup__control zd-popup__control--edit",
        this.controls
      );
      editButton.setAttribute("target", "_blank");
      editButton.setAttribute(
        "href",
        `/wiki/index.php?action=edit&title=${encodeURIComponent(
          options.editLink
        )}`
      );
      DomUtil.create("i", "fas fa-edit", editButton).title = "Edit";
    }

    const linkButton = DomUtil.create(
      "a",
      "zd-popup__control zd-popup__control--permalink",
      this.controls
    );
    linkButton.setAttribute("href", `?id=${options.id}`);
    DomUtil.create("i", "fas fa-link", linkButton).title = "Permalink";

    this.setContent(this.container);
  }

  public static create(options: Options): ZDPopup {
    if (options.autoPan == undefined) {
      options.autoPan = true;
    }
    if (options.minWidth == undefined) {
      options.minWidth = 100;
    }
    if (options.maxWidth == undefined) {
      options.maxWidth = 300;
    }

    return new ZDPopup(options);
  }

  public markCompleted(): void {
    DomUtil.addClass(this.controls, "zd-popup__controls--completed");
  }

  public markUncompleted(): void {
    DomUtil.removeClass(this.controls, "zd-popup__controls--completed");
  }

  public loadContentFromSummary(pageTitle: string): void {
    if (this.contentState === ContentState.Initial) {
      this.startLoading();
      this.myOptions.wiki
        .query<any>( // eslint-disable-line @typescript-eslint/no-explicit-any
          `action=query&prop=pageprops&titles=${encodeURIComponent(pageTitle)}`
        )
        .then((result) => {
          // TODO move result parsing to WikiConnector and add typing
          const pageId = Object.keys(result.query.pages)[0];
          const page = result.query.pages[pageId];
          this.loadContent(
            pageId === "-1" || !page.pageprops || !page.pageprops.description
              ? ""
              : `<p>${page.pageprops.description}</p>`
          );
        });
    }
  }

  public loadContentFromSection(pageTitle: string, sectionName: string): void {
    if (this.contentState === ContentState.Initial) {
      this.startLoading();
      const textToParse = encodeURIComponent(
        `{{#vardefine:gsize|300}}{{#vardefine:galign|left}}{{#vardefine:gpad|0}}{{#vardefine:square|false}}{{#lst:${pageTitle}|${sectionName}}}`
      );
      this.myOptions.wiki
        .query<any>( // eslint-disable-line @typescript-eslint/no-explicit-any
          `action=parse&prop=text&contentmodel=wikitext&text=${textToParse}`
        )
        .then((result) => {
          // TODO move result parsing to WikiConnector and add typing
          let content = result.parse.text["*"];
          content = content.replace(/\s*<!--[\s\S]*-->\s*/g, "");
          if (content.match(/page does not exist/)) {
            content = content.replace(
              `>${pageTitle}</a>`,
              ">Create this article</a>"
            );
          }
          this.loadContent(content);
        });
    }
  }

  public loadContentFromMapPage(pageTitle: string, subpage: string): void {
    if (this.contentState === ContentState.Initial) {
      this.startLoading();

      // first try Map: namespace
      let fullPageTitle = subpage
        ? `Map:${pageTitle}/${subpage}`
        : `Map:${pageTitle}`;
      this.myOptions.wiki
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .query<any>(`action=parse&page=${encodeURIComponent(fullPageTitle)}`)
        .then((result) => {
          // TODO move result parsing to WikiConnector and add typing
          const content = result.parse && result.parse.text["*"];
          if (content && !(<string>content).includes("redirectMsg")) {
            this.loadContent(content);
          } else {
            // fall back to subpage
            fullPageTitle = subpage
              ? `${pageTitle}/Map/${subpage}`
              : `${pageTitle}/Map`;
            this.myOptions.wiki
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .query<any>(
                `action=parse&page=${encodeURIComponent(fullPageTitle)}`
              )
              .then((result) => {
                this.loadContent(
                  (result.parse && result.parse.text["*"]) || ""
                );
              });
          }
        });
    }
  }

  public loadContentFromPage(pageTitle: string): void {
    if (this.contentState === ContentState.Initial) {
      this.startLoading();
      this.myOptions.wiki
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .query<any>(`action=parse&page=${encodeURIComponent(pageTitle)}`)
        .then((result) => {
          // TODO move result parsing to WikiConnector and add typing
          this.loadContent((result.parse && result.parse.text["*"]) || "");
        });
    }
  }

  private startLoading(): void {
    this.contentState = ContentState.Loading;
    const loading = DomUtil.create(
      "div",
      "zd-popup__loading-indicator",
      this.body
    );
    DomUtil.create("i", "fas fa-circle-notch fa-spin fa-3x fa-fw", loading);
  }

  private loadContent(content: string): void {
    this.body.innerHTML = content;
    const internalLinks = this.body.getElementsByClassName("internal-link");
    for (let i = 0; i < internalLinks.length; ++i) {
      const link = <HTMLElement>internalLinks[i];
      DomEvent.addListener(link, "click", () => {
        const id = link.getAttribute("data-target");
        if (id) {
          this.myOptions.linkClicked(id);
        }
      });
    }
    this.setContent(this.container); // force it to resize and recenter
    this.contentState = ContentState.Loaded;
  }
}

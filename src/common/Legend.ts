import { Control, DomEvent, DomUtil } from "leaflet";
import { ICategory } from "./ICategory";
import { MapLayer } from "./MapLayer";

interface LegendItem {
  category: ICategory;
  li: HTMLElement;
}

export class Legend extends Control {
  private container: HTMLElement;
  private categoryList: HTMLElement;
  private all: HTMLElement;
  private none: HTMLElement;
  private categories = <LegendItem[]>[];

  private constructor(
    private mapLayers: MapLayer[],
    options?: L.ControlOptions
  ) {
    super(options);
    const bottom = options && options.position === "bottomright";

    this.container = DomUtil.create(
      "div",
      `zd-control zd-legend zd-legend--${bottom ? "portrait" : "landscape"}`
    );
    DomEvent.disableClickPropagation(this.container);
    DomEvent.disableScrollPropagation(this.container);

    if (bottom) {
      const header = DomUtil.create("h3", "zd-legend__header", this.container);
      header.innerText = "Legend";
      DomEvent.addListener(header, "click", () => {
        if (
          DomUtil.hasClass(this.categoryList, "zd-legend__categories--show")
        ) {
          DomUtil.removeClass(this.categoryList, "zd-legend__categories--show");
        } else {
          DomUtil.addClass(this.categoryList, "zd-legend__categories--show");
        }
      });
    }

    this.categoryList = DomUtil.create(
      "ul",
      "zd-legend__categories",
      this.container
    );
    const allNone = DomUtil.create("li", "", this.categoryList);
    this.all = DomUtil.create(
      "div",
      "zd-legend__all selectable selected",
      allNone
    );
    this.all.innerText = "All";
    this.none = DomUtil.create("div", "zd-legend__none selectable", allNone);
    this.none.innerText = "None";

    DomEvent.addListener(this.all, "click", () => {
      if (!DomUtil.hasClass(this.all, "selected")) {
        DomUtil.addClass(this.all, "selected");
        DomUtil.removeClass(this.none, "selected");
        this.categories.forEach((c) => {
          DomUtil.removeClass(c.li, "selected");
          this.mapLayers.forEach((l) =>
            l.resetCategoryVisibility(c.category.name)
          );
        });
      }
    });

    DomEvent.addListener(this.none, "click", () => {
      if (!DomUtil.hasClass(this.none, "selected")) {
        DomUtil.addClass(this.none, "selected");
        DomUtil.removeClass(this.all, "selected");
        this.categories.forEach((c) => {
          DomUtil.removeClass(c.li, "selected");
          this.mapLayers.forEach((l) => l.hideCategory(c.category.name));
        });
      }
    });
  }

  public static createPortrait(mapLayers: MapLayer[]): Legend {
    return new Legend(mapLayers, {
      position: "bottomright",
    });
  }

  public static createLandscape(mapLayers: MapLayer[]): Legend {
    return new Legend(mapLayers);
  }

  public onAdd(_map: L.Map): HTMLElement {
    return this.container;
  }

  public onRemove(_map: L.Map): void {
    // doesn't happen
  }

  public addCategory(category: ICategory): void {
    // make it
    const li = DomUtil.create("li", "zd-legend__category selectable");
    li.innerText = category.name;
    li.style.backgroundImage = `url(${category.iconUrl})`;
    li.style.backgroundPosition = `${(50 - category.iconWidth) / 2}px center`;
    li.style.backgroundSize = `${category.iconWidth}px`;
    this.categories.push({ category, li });

    // activate it
    DomEvent.addListener(li, "click", () => {
      if (DomUtil.hasClass(li, "selected")) {
        DomUtil.removeClass(li, "selected");
        this.mapLayers.forEach((l) => l.hideCategory(category.name));

        // select "None" if no others are selected
        if (this.categories.every((c) => !DomUtil.hasClass(c.li, "selected"))) {
          DomUtil.addClass(this.none, "selected");
        }
      } else {
        DomUtil.addClass(li, "selected");
        this.mapLayers.forEach((l) => l.showCategory(category.name));

        // hide the others
        if (DomUtil.hasClass(this.all, "selected")) {
          DomUtil.removeClass(this.all, "selected");
          this.categories.forEach((c) => {
            if (!DomUtil.hasClass(c.li, "selected")) {
              this.mapLayers.forEach((l) => l.hideCategory(c.category.name));
            }
          });
        }
        DomUtil.removeClass(this.none, "selected");
      }
    });

    // insert it
    this.categoryList.appendChild(li);
  }

  public reset(): void {
    this.all.click();
  }
}

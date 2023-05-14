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
  private categoryGroupULArr: HTMLElement[] = [];
  private all: HTMLElement;
  private none: HTMLElement;
  private allNoneUL: HTMLElement;
  private categories = <LegendItem[]>[];

  private bottom = false;

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
      this.bottom = true;
      const header = DomUtil.create("h3", "zd-legend__header", this.container);
      header.innerText = "Legend";
      DomEvent.addListener(header, "click", () => {
        if (
          DomUtil.hasClass(this.categoryList, "zd-legend__categories--show")
        ) {
          DomUtil.removeClass(this.categoryList, "zd-legend__categories--show");
          DomUtil.removeClass(this.allNoneUL, "zd-legend-allNoneUl--show");
        } else {
          DomUtil.addClass(this.categoryList, "zd-legend__categories--show");
          DomUtil.addClass(this.allNoneUL, "zd-legend-allNoneUl--show");
        }
      });
    }

    this.allNoneUL = DomUtil.create(
      "ul",
      "zd-legend-allNoneUl",
      this.container
    );
    this.categoryList = DomUtil.create(
      "ul",
      "zd-legend__categories",
      this.container
    );
    this.all = DomUtil.create(
      "li",
      "zd-legend__all selectable selected",
      this.allNoneUL
    );
    this.all.innerText = "All";
    this.none = DomUtil.create(
      "li",
      "zd-legend__none selectable",
      this.allNoneUL
    );
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

  public addGroup(category: ICategory): void {
    const groupUl = DomUtil.create(
      "ul",
      "zd-legend-group-ul",
      this.categoryList
    );
    const groupHeaderLi = DomUtil.create("li", "zd-legend__group", groupUl);
    if (!this.bottom) {
      groupHeaderLi.classList.add("toggelable");
    }
    groupHeaderLi.innerText = category.group + " ▼";
    groupHeaderLi.style.textAlign = "center";
    groupHeaderLi.style.fontWeight = "bold";
    groupHeaderLi.classList.add("group-text");
    //Add group to group array
    this.categoryGroupULArr.push(groupUl);
    DomUtil.addClass(groupUl, "toggled-on");
    //Add click event to group
    if (!this.bottom) {
      DomEvent.addListener(groupHeaderLi, "click", () => {
        //Check if group is selected
        if (DomUtil.hasClass(groupUl, "toggled-on")) {
          //Toggle group off
          DomUtil.removeClass(groupUl, "toggled-on");
          groupHeaderLi.innerText = category.group + " ▶";
          //Display: none, for all categories in group
          this.categories.forEach((c) => {
            if (c.category.group === category.group) {
              c.li.style.display = "none";
            }
          });
        } else {
          //Toggle group on
          DomUtil.addClass(groupUl, "toggled-on");
          groupHeaderLi.innerText = category.group + " ▼";
          //Show all categories in group and remove css display none
          this.categories.forEach((c) => {
            if (c.category.group === category.group) {
              c.li.style.display = "";
            }
          });
        }
      });
    }
  }
  public addCategory(category: ICategory, group?: string): void {
    //Check if group is defined
    if (group != undefined) {
      //Set this category group
      category.group = group;
      //Check if group already exists
      if (!this.categories.some((c) => c.category.group === category.group)) {
        //Create group
        this.addGroup(category);
      }
    }

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
    //Check if group is defined
    if (group != undefined) {
      //Add category to group
      this.categoryGroupULArr.forEach((g) => {
        if (g.innerText.includes(group)) {
          g.appendChild(li);
        }
      });
    } else {
      this.categoryList.appendChild(li);
    }
  }

  public reset(): void {
    this.all.click();
  }
}

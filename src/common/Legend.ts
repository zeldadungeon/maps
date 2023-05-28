import { Control, DomEvent, DomUtil } from "leaflet";
import { ICategory } from "./ICategory";
import { MapLayer } from "./MapLayer";

interface LegendItem {
  category: ICategory;
  li: HTMLElement;
}

export class Legend extends Control {
  private container: HTMLElement;
  private wrapper: HTMLElement;
  private categoryList: HTMLElement;
  private groupUlArr: HTMLElement[] = [];
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

    this.wrapper = DomUtil.create("div", "zd-legend__wrapper");

    this.container = DomUtil.create(
      "div",
      `zd-control zd-legend zd-legend--${bottom ? "portrait" : "landscape"}`,
      this.wrapper
    );

    DomEvent.disableClickPropagation(this.container);
    DomEvent.disableScrollPropagation(this.container);

    if (bottom) {
      this.bottom = true;
      const header = DomUtil.create("h3", "zd-legend__header", this.container);
      header.innerText = "Show Categories";
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

    if (!bottom) {
      DomUtil.addClass(this.container, "zd-legend-open");
      //Add button to close legend
      const closeButton = DomUtil.create(
        "div",
        "zd-legend__close",
        this.wrapper
      );
      closeButton.innerText = "▶";
      closeButton.style.position = "absolute";
      closeButton.style.top = "15px"; // Same as allNone
      closeButton.style.left = "-25px";
      closeButton.style.overflow = "visible";
      this.wrapper.style.overflow = "visible";
      closeButton.style.width = "25px";
      closeButton.style.height = "40px";
      DomEvent.disableClickPropagation(closeButton);
      //Add click event listener
      DomEvent.addListener(closeButton, "click", () => {
        //If zd-legend-open
        if (DomUtil.hasClass(this.container, "zd-legend-open")) {
          DomUtil.removeClass(this.container, "zd-legend-open");
          closeButton.innerText = "◀";
        } else {
          DomUtil.addClass(this.container, "zd-legend-open");
          closeButton.innerText = "▶";
        }
      });
    }

    this.allNoneUL = DomUtil.create(
      "ul",
      "zd-legend-allNoneUl",
      this.container
    );
    this.categoryList = DomUtil.create(
      "li",
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
    return this.wrapper;
  }

  public onRemove(_map: L.Map): void {
    // doesn't happen
  }

  public addGroup(category: ICategory | null): void {
    //Check if group defined
    const groupUl = DomUtil.create("ul", "zd-legend-group", this.categoryList);
    if (category === null) {
      groupUl.classList.add("null-group");
    }
    const groupLi = DomUtil.create("li", "zd-legend-group__li", groupUl);
    const groupDiv = DomUtil.create("div", "zd-legend-group__div", groupLi);
    const groupHeader = DomUtil.create(
      "div",
      "zd-legend-group__header",
      groupDiv
    );
    const groupHeaderTitle = DomUtil.create(
      "p",
      "zd-legend-group__title",
      groupHeader
    );
    const groupHeaderDropdown = DomUtil.create(
      "p",
      "zd-legend-group__dropdown",
      groupHeader
    );
    const groupBody = DomUtil.create("ul", "zd-legend-group__body", groupDiv);
    //Add group to group array
    this.groupUlArr.push(groupUl);

    if (!this.bottom) {
      groupHeaderDropdown.classList.add("toggelable");
    }
    if (category !== null) {
      groupHeaderTitle.classList.add("toggelable");
      groupHeaderTitle.innerText = category.group || "Undefined Group";
      groupHeaderTitle.style.textAlign = "center";
      groupHeaderTitle.style.fontWeight = "bold";
      groupHeaderDropdown.innerText = "▼";
      DomUtil.addClass(groupHeaderDropdown, "toggled-on");
      //Add clickable title to disable/enable all categories in group
      DomEvent.addListener(groupHeaderTitle, "click", () => {
        //Check if any category in group is selected
        if (
          this.categories.some(
            (c) =>
              DomUtil.hasClass(c.li, "selected") &&
              c.category.group === category.group
          )
        ) {
          //Deselect all categories in group
          this.categories.forEach((c) => {
            if (c.category.group === category.group) {
              DomUtil.removeClass(c.li, "selected");
              this.mapLayers.forEach((l) => l.hideCategory(c.category.name));
            }
          });
        } else {
          //Hide everything
          if (DomUtil.hasClass(this.all, "selected")) {
            DomUtil.removeClass(this.all, "selected");
            this.categories.forEach((c) => {
              if (!DomUtil.hasClass(c.li, "selected")) {
                this.mapLayers.forEach((l) => l.hideCategory(c.category.name));
              }
            });
          }
          //Select all categories in group
          this.categories.forEach((c) => {
            if (c.category.group === category.group) {
              DomUtil.addClass(c.li, "selected");
              this.mapLayers.forEach((l) => l.showCategory(c.category.name));
            }
          });

          //Deselect all and none buttons
          DomUtil.removeClass(this.all, "selected");
          DomUtil.removeClass(this.none, "selected");
        }
      });
      //Add click event to group for dropdown functionality
      if (!this.bottom) {
        DomEvent.addListener(groupHeaderDropdown, "click", () => {
          //Check if group is selected
          if (DomUtil.hasClass(groupHeaderDropdown, "toggled-on")) {
            //Toggle group off
            DomUtil.removeClass(groupHeaderDropdown, "toggled-on");
            groupHeaderDropdown.innerText = "▶";
            //Display: none, for all categories in group
            groupBody.style.display = "none";
          } else {
            //Toggle group on
            DomUtil.addClass(groupHeaderDropdown, "toggled-on");
            groupHeaderDropdown.innerText = " ▼";
            groupBody.style.display = "block";
          }
        });
      }
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
    } else {
      //Check if null group already exists
      if (!this.groupUlArr.some((g) => DomUtil.hasClass(g, "null-group"))) {
        //Create null group
        this.addGroup(null);
      }
    }

    // make it
    const div = DomUtil.create(
      "li",
      "zd-legend__category-div",
      this.categoryList
    );
    const icon = DomUtil.create("img", "", div);
    //Check if URL ends in .png or .svg
    if (category.iconUrl.endsWith(".svg")) {
      DomUtil.addClass(icon, "zd-legend__icon__svg");
    } else {
      DomUtil.addClass(icon, "zd-legend__icon");
    }

    const li = DomUtil.create("div", "zd-legend__category selectable", div);
    li.innerText = category.name;
    icon.src = category.iconUrl;
    //Set size of image container, make sure they all share the same centre
    const iconSize = 35;
    icon.style.width = iconSize + "px";
    icon.style.height = iconSize + "px";
    //Scale image using transform scale to get proper size without changing border size
    icon.style.transform = `scale(${category.iconWidth / iconSize}, ${
      category.iconHeight / iconSize
    })`;

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
      this.groupUlArr.forEach((g) => {
        if (
          g.getElementsByClassName("zd-legend-group__title")[0].innerHTML ===
          group
        ) {
          g.getElementsByClassName("zd-legend-group__body")[0].appendChild(div);
        }
      });
    } else {
      //Add category to null group
      this.groupUlArr.forEach((g) => {
        if (DomUtil.hasClass(g, "null-group")) {
          g.getElementsByClassName("zd-legend-group__body")[0].appendChild(div);
        }
      });
    }
  }

  public reset(): void {
    this.all.click();
  }
}

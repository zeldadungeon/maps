import { DomEvent, DomUtil } from "leaflet";
import { ControlPane } from "./ControlPane";
import { ICategory } from "../ICategory";
import { MapLayer } from "../MapLayer";
import { faFilter } from "@fortawesome/free-solid-svg-icons/faFilter";
import { library } from "@fortawesome/fontawesome-svg-core";

library.add(faFilter);

interface LegendItem {
  category: ICategory;
  li: HTMLElement;
}

/**
 * Control that allows the user to filter which location markers are visible
 */
export class FilterControl extends ControlPane {
  private categoryList: HTMLElement;
  private groupLiArr: HTMLElement[] = [];
  private all: HTMLElement;
  private none: HTMLElement;
  private allNoneUL: HTMLElement;
  private categories = <LegendItem[]>[];

  public constructor(private mapLayers: MapLayer[]) {
    super({
      icon: "fa-filter",
      title: "Filter",
    });

    DomUtil.create("h3", "zd-control__title", this.container).innerText =
      "Filter Markers";

    this.allNoneUL = DomUtil.create("ul", "zd-tabs", this.container);
    this.categoryList = DomUtil.create(
      "ul",
      "zd-legend__categories",
      this.container
    );
    this.all = DomUtil.create(
      "li",
      "zd-tab selectable selected",
      this.allNoneUL
    );
    this.all.innerText = "All";
    this.none = DomUtil.create("li", "zd-tab selectable", this.allNoneUL);
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

  public addGroup(category: ICategory | null): void {
    //Check if group defined
    const groupLi = DomUtil.create("li", "zd-legend-group", this.categoryList);
    if (category === null) {
      groupLi.classList.add("null-group");
    }
    const groupDiv = DomUtil.create("div", "zd-legend-group__div", groupLi);
    const groupHeader = DomUtil.create(
      "div",
      "zd-legend-group__header",
      groupDiv
    );
    const groupHeaderDropdown = DomUtil.create(
      "p",
      "zd-legend-group__dropdown",
      groupHeader
    );
    const groupHeaderTitle = DomUtil.create(
      "p",
      "zd-legend-group__title",
      groupHeader
    );
    const groupBody = DomUtil.create(
      "ul",
      "zd-legend-group__body visible",
      groupDiv
    );
    //Add group to group array
    this.groupLiArr.push(groupLi);

    groupHeaderDropdown.classList.add("toggleable");
    if (category !== null) {
      groupHeaderTitle.classList.add("toggleable");
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
      DomEvent.addListener(groupHeaderDropdown, "click", () => {
        //Check if group is selected
        if (DomUtil.hasClass(groupHeaderDropdown, "toggled-on")) {
          //Toggle group off
          DomUtil.removeClass(groupHeaderDropdown, "toggled-on");
          groupHeaderDropdown.innerText = "▶";
          DomUtil.removeClass(groupBody, "visible");
        } else {
          //Toggle group on
          DomUtil.addClass(groupHeaderDropdown, "toggled-on");
          groupHeaderDropdown.innerText = " ▼";
          DomUtil.addClass(groupBody, "visible");
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
    } else {
      //Check if null group already exists
      if (!this.groupLiArr.some((g) => DomUtil.hasClass(g, "null-group"))) {
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
      this.groupLiArr.forEach((g) => {
        if (
          g.getElementsByClassName("zd-legend-group__title")[0].innerHTML ===
          group
        ) {
          g.getElementsByClassName("zd-legend-group__body")[0].appendChild(div);
        }
      });
    } else {
      //Add category to null group
      this.groupLiArr.forEach((g) => {
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

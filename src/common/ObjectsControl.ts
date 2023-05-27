import { DomEvent, DomUtil } from "leaflet";
import { ZDControl } from "./ZDControl";

export interface ObjectGroup {
  groupName: string;
  objectNames: string[];
}

export interface ObjectGrouping {
  groupingName: string;
  groups: ObjectGroup[];
}

export interface Options {
  icon: string;
  title: string;
  groupings: ObjectGrouping[];
}

interface TabAndContent {
  tab: HTMLElement;
  content: HTMLElement;
}

/**
 * Control that allows the user to show different categories of additional objects on the map,
 * separate from the markers which are controlled by the Legend
 */
export class ObjectsControl extends ZDControl {
  private selectedObjects: { [key: string]: boolean } = {};

  private objectElements: { [key: string]: HTMLElement[] } = {};

  public constructor(
    options: Options,
    private onSelectionChanged: (selectedObjects: {
      [key: string]: boolean;
    }) => void
  ) {
    super({
      icon: options.icon,
      title: options.title,
      content: DomUtil.create("div"),
    });

    DomUtil.create("h3", "zd-control__title", this.content).innerText =
      options.title;

    const tabContainer = DomUtil.create("div", "zd-tabs", this.content);
    const groupingTabsAndContents: TabAndContent[] = [];
    for (const grouping of options.groupings) {
      const tab = DomUtil.create(
        "div",
        "zd-tabs__tab selectable",
        tabContainer
      );
      tab.innerText = grouping.groupingName;

      const content = DomUtil.create(
        "ul",
        "zd-object-groups-list hidden",
        this.content
      );
      for (const group of grouping.groups) {
        const groupListItem = DomUtil.create("li", "zd-object-group", content);
        const groupListDropdown = DomUtil.create(
          "div",
          "zd-object-group__dropdown",
          groupListItem
        );
        groupListDropdown.innerText = "▶";
        const groupName = DomUtil.create(
          "div",
          "selectable-text",
          groupListItem
        );
        groupName.innerText = group.groupName;
        DomEvent.addListener(groupName, "click", () => {
          if (DomUtil.hasClass(groupName, "selected-text")) {
            DomUtil.removeClass(groupName, "selected-text");
          } else {
            DomUtil.addClass(groupName, "selected-text");
          }
          for (const objectName of group.objectNames) {
            if (DomUtil.hasClass(groupName, "selected-text")) {
              this.selectObject(objectName);
            } else {
              this.deselectObject(objectName);
            }
          }
        });

        const groupObjects = DomUtil.create(
          "ul",
          "zd-objects-list hidden",
          groupListItem
        );
        for (const objectName of group.objectNames) {
          const objectNameListItem = DomUtil.create(
            "li",
            "zd-object selectable-text",
            groupObjects
          );
          objectNameListItem.innerText = objectName;

          if (this.objectElements[objectName] == undefined) {
            this.objectElements[objectName] = [];
          }
          this.objectElements[objectName].push(objectNameListItem);

          DomEvent.addListener(objectNameListItem, "click", () => {
            if (DomUtil.hasClass(objectNameListItem, "selected-text")) {
              this.deselectObject(objectName);
            } else {
              this.selectObject(objectName);
            }
          });
        }

        DomEvent.addListener(groupListDropdown, "click", () => {
          if (groupListDropdown.innerText == "▶") {
            DomUtil.removeClass(groupObjects, "hidden");
            groupListDropdown.innerText = "▼";
          } else {
            DomUtil.addClass(groupObjects, "hidden");
            groupListDropdown.innerText = "▶";
          }
        });
      }

      DomEvent.addListener(tab, "click", () => {
        if (!DomUtil.hasClass(tab, "selected")) {
          for (const groupingTabAndContent of groupingTabsAndContents) {
            DomUtil.removeClass(groupingTabAndContent.tab, "selected");
            DomUtil.addClass(groupingTabAndContent.content, "hidden");
          }
          DomUtil.addClass(tab, "selected");
          DomUtil.removeClass(content, "hidden");
          // TODO save to settingsStore
        }
      });
      groupingTabsAndContents.push({ tab, content });
    }

    // TODO load from settingsStore
    DomUtil.addClass(groupingTabsAndContents[0].tab, "selected");
    DomUtil.removeClass(groupingTabsAndContents[0].content, "hidden");
  }

  private selectObject(objectName: string): void {
    this.selectedObjects[objectName] = true;
    for (const element of this.objectElements[objectName]) {
      DomUtil.addClass(element, "selected-text");
    }
    this.onSelectionChanged(this.selectedObjects);
  }

  private deselectObject(objectName: string): void {
    this.selectedObjects[objectName] = false;
    for (const element of this.objectElements[objectName]) {
      DomUtil.removeClass(element, "selected-text");
    }
    this.onSelectionChanged(this.selectedObjects);
  }
}

import { DomEvent, DomUtil } from "leaflet";
import { ControlPane } from "./ControlPane";

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
export class ObjectsControl extends ControlPane {
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
    });

    DomUtil.create("h3", "zd-control__title", this.container).innerText =
      options.title;

    const tabContainer = DomUtil.create("ul", "zd-tabs", this.container);
    const groupingTabsAndContents: TabAndContent[] = [];
    for (const grouping of options.groupings) {
      const tab = DomUtil.create("li", "zd-tab selectable", tabContainer);
      tab.innerText = grouping.groupingName;

      const content = DomUtil.create(
        "ul",
        "zd-legend__categories hideable",
        this.container
      );
      for (const group of grouping.groups) {
        const groupListItem = DomUtil.create("li", "zd-legend-group", content);
        const groupListItemHeader = DomUtil.create(
          "div",
          "zd-legend-group__header",
          groupListItem
        );
        const groupListDropdown = DomUtil.create(
          "p",
          "zd-legend-group__dropdown toggleable",
          groupListItemHeader
        );
        groupListDropdown.innerText = "▶";
        const groupName = DomUtil.create(
          "p",
          "zd-legend-group__title toggleable",
          groupListItemHeader
        );
        groupName.innerText = group.groupName;
        DomEvent.addListener(groupName, "click", () => {
          if (DomUtil.hasClass(groupName, "toggled-on")) {
            DomUtil.removeClass(groupName, "toggled-on");
          } else {
            DomUtil.addClass(groupName, "toggled-on");
          }
          for (const objectName of group.objectNames) {
            if (DomUtil.hasClass(groupName, "toggled-on")) {
              this.selectObject(objectName);
            } else {
              this.deselectObject(objectName);
            }
          }
        });

        const groupObjects = DomUtil.create(
          "ul",
          "zd-legend-group__body",
          groupListItem
        );
        for (const objectName of group.objectNames) {
          const objectNameListItem = DomUtil.create(
            "li",
            "zd-object selectable",
            groupObjects
          );
          objectNameListItem.innerText = objectName;

          if (this.objectElements[objectName] == undefined) {
            this.objectElements[objectName] = [];
          }
          this.objectElements[objectName].push(objectNameListItem);

          DomEvent.addListener(objectNameListItem, "click", () => {
            if (DomUtil.hasClass(objectNameListItem, "selected")) {
              this.deselectObject(objectName);
            } else {
              this.selectObject(objectName);
            }
          });
        }

        DomEvent.addListener(groupListDropdown, "click", () => {
          if (groupListDropdown.innerText == "▶") {
            DomUtil.addClass(groupObjects, "visible");
            groupListDropdown.innerText = "▼";
          } else {
            DomUtil.removeClass(groupObjects, "visible");
            groupListDropdown.innerText = "▶";
          }
        });
      }

      DomEvent.addListener(tab, "click", () => {
        if (!DomUtil.hasClass(tab, "selected")) {
          for (const groupingTabAndContent of groupingTabsAndContents) {
            DomUtil.removeClass(groupingTabAndContent.tab, "selected");
            DomUtil.removeClass(groupingTabAndContent.content, "visible");
          }
          DomUtil.addClass(tab, "selected");
          DomUtil.addClass(content, "visible");
          // TODO save to settingsStore
        }
      });
      groupingTabsAndContents.push({ tab, content });
    }

    // TODO load from settingsStore
    DomUtil.addClass(groupingTabsAndContents[0].tab, "selected");
    DomUtil.addClass(groupingTabsAndContents[0].content, "visible");
  }

  private selectObject(objectName: string): void {
    this.selectedObjects[objectName] = true;
    for (const element of this.objectElements[objectName]) {
      DomUtil.addClass(element, "selected");
    }
    this.onSelectionChanged(this.selectedObjects);
  }

  private deselectObject(objectName: string): void {
    this.selectedObjects[objectName] = false;
    for (const element of this.objectElements[objectName]) {
      DomUtil.removeClass(element, "selected");
    }
    this.onSelectionChanged(this.selectedObjects);
  }
}

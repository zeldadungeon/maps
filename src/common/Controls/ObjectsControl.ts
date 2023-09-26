import { DomEvent, DomUtil } from "leaflet";
import { ControlPane } from "./ControlPane";
import { LocalStorage } from "../LocalStorage";

export interface ObjectGroup {
  groupName: string;
  objectNames: string[];
}

export interface ObjectGrouping {
  groupingName: string;
  groupingIcon?: string;
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
    private settingsStore: LocalStorage,
    private onSelectionChanged: (selectedObjects: {
      [key: string]: boolean;
    }) => void
  ) {
    super({
      icon: options.icon,
      title: options.title,
    });

    const visibleGroups = <string[]>(
      (settingsStore.getItem("Objects-VisibleGroups") ?? [])
    );
    const initSelected = <string[]>(
      (settingsStore.getItem("Objects-Selected") ?? [])
    );

    const header = DomUtil.create("h3", "zd-control__title", this.container);
    header.innerText = options.title;

    const tabContainer = DomUtil.create("ul", "zd-tabs", this.container);
    const groupingTabsAndContents: TabAndContent[] = [];
    for (const grouping of options.groupings) {
      const tab = DomUtil.create(
        "li",
        "zd-tab zd-tab--button selectable",
        tabContainer
      );
      tab.style.backgroundImage = `url('${import.meta.env.BASE_URL}totk/icons/${
        grouping.groupingIcon
      }')`;
      tab.title = grouping.groupingName;
      DomEvent.addListener(tab, "click", () => {
        if (!DomUtil.hasClass(tab, "selected")) {
          for (const groupingTabAndContent of groupingTabsAndContents) {
            DomUtil.removeClass(groupingTabAndContent.tab, "selected");
            DomUtil.removeClass(groupingTabAndContent.content, "visible");
          }
          header.innerText = `${options.title} - ${grouping.groupingName}`;
          DomUtil.addClass(tab, "selected");
          DomUtil.addClass(content, "visible");
          settingsStore.setItem("Objects-SelectedTab", grouping.groupingName);
        }
      });

      const content = DomUtil.create(
        "ul",
        "zd-legend__categories hideable",
        this.container
      );

      const initTab = settingsStore.getItem("Objects-SelectedTab");
      if (
        initTab === grouping.groupingName ||
        (initTab == undefined && grouping === options.groupings[0]) // open the first one by default
      ) {
        header.innerText = `${options.title} - ${grouping.groupingName}`;
        DomUtil.addClass(tab, "selected");
        DomUtil.addClass(content, "visible");
      }

      for (const group of grouping.groups) {
        const initVisible = visibleGroups.includes(group.groupName);
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
        DomEvent.addListener(groupListDropdown, "click", () => {
          if (groupListDropdown.innerText == "▶") {
            DomUtil.addClass(groupObjects, "visible");
            groupListDropdown.innerText = "▼";
            visibleGroups.push(group.groupName);
          } else {
            DomUtil.removeClass(groupObjects, "visible");
            groupListDropdown.innerText = "▶";
            const index = visibleGroups.indexOf(group.groupName, 0);
            if (index != -1) {
              visibleGroups.splice(index, 1);
            }
          }
          settingsStore.setItem("Objects-VisibleGroups", visibleGroups);
        });

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

        if (initVisible) {
          groupListDropdown.innerText = "▼";
          DomUtil.addClass(groupObjects, "visible");
        } else {
          groupListDropdown.innerText = "▶";
        }

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

          if (initSelected.includes(objectName)) {
            this.selectObject(objectName, false);
            DomUtil.addClass(groupName, "toggled-on");
          }

          DomEvent.addListener(objectNameListItem, "click", () => {
            if (DomUtil.hasClass(objectNameListItem, "selected")) {
              this.deselectObject(objectName);
            } else {
              this.selectObject(objectName);
            }
          });
        }
      }

      groupingTabsAndContents.push({ tab, content });
    }
  }

  private selectObject(objectName: string, save = true): void {
    this.selectedObjects[objectName] = true;
    for (const element of this.objectElements[objectName]) {
      DomUtil.addClass(element, "selected");
    }
    if (save) {
      this.settingsStore.setItem(
        "Objects-Selected",
        Object.keys(this.selectedObjects).filter((k) => this.selectedObjects[k])
      );
    }
    this.onSelectionChanged(this.selectedObjects);
  }

  private deselectObject(objectName: string, save = true): void {
    this.selectedObjects[objectName] = false;
    for (const element of this.objectElements[objectName]) {
      DomUtil.removeClass(element, "selected");
    }
    if (save) {
      this.settingsStore.setItem(
        "Objects-Selected",
        Object.keys(this.selectedObjects).filter((k) => this.selectedObjects[k])
      );
    }
    this.onSelectionChanged(this.selectedObjects);
  }
}

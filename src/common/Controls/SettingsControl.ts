import { DomEvent, DomUtil } from "leaflet";
import { ControlPane } from "./ControlPane";
import { WikiConnector } from "../WikiConnector";
import { MapLayer } from "../MapLayer";
import { LocalStorage } from "../LocalStorage";
import { faCog } from "@fortawesome/free-solid-svg-icons/faCog";
import { library } from "@fortawesome/fontawesome-svg-core";

library.add(faCog);

/**
 * Settings control
 */
export class SettingsControl extends ControlPane {
  private userCell: HTMLElement;

  public constructor(
    private wiki: WikiConnector,
    directory: string,
    layers: MapLayer[],
    tags: string[]
  ) {
    super({
      icon: "fa-cog",
      title: "Settings",
    });

    const settingsStore = LocalStorage.getStore(directory, "settings");

    DomUtil.create("h3", "zd-control__title", this.container).innerText =
      "Settings";

    const settingsContent = DomUtil.create(
      "table",
      "zd-settings",
      this.container
    );
    const userRow = DomUtil.create(
      "tr",
      "zd-settings__setting",
      settingsContent
    );
    this.userCell = DomUtil.create("td", "", userRow);
    this.userCell.setAttribute("colspan", "3");
    const loginButton = DomUtil.create("div", "selectable", this.userCell);
    loginButton.innerText = "Login";
    DomEvent.addListener(loginButton, "click", () => {
      wiki.login();
    });

    tags.forEach((tag) => {
      const row = DomUtil.create("tr", "zd-settings__setting", settingsContent);
      const show = DomUtil.create("td", "zd-settings__button selectable", row);
      show.innerText = "Show";
      const hide = DomUtil.create("td", "zd-settings__button selectable", row);
      hide.innerText = "Hide";
      const label = DomUtil.create("th", "zd-settings__label", row);
      label.innerText = tag;

      const settingValue = settingsStore.getItem<boolean>(`show-${tag}`);
      if (
        settingValue === false ||
        (tag === "Completed" && settingValue !== true) // Completed is hidden by default
      ) {
        DomUtil.addClass(hide, "selected");
      } else {
        layers.forEach((l) => l.showTaggedMarkers(tag));
        DomUtil.addClass(show, "selected");
      }

      DomEvent.addListener(show, "click", () => {
        if (!DomUtil.hasClass(show, "selected")) {
          DomUtil.removeClass(hide, "selected");
          DomUtil.addClass(show, "selected");
          layers.forEach((l) => l.showTaggedMarkers(tag));
          settingsStore.setItem(`show-${tag}`, true);
        }
      });
      DomEvent.addListener(hide, "click", () => {
        if (!DomUtil.hasClass(hide, "selected")) {
          DomUtil.removeClass(show, "selected");
          DomUtil.addClass(hide, "selected");
          layers.forEach((l) => l.hideTaggedMarkers(tag));
          settingsStore.setItem(`show-${tag}`, false);
        }
      });
    });
    const clearCompletionDataRow = DomUtil.create(
      "tr",
      "zd-settings__setting",
      settingsContent
    );
    const clearCompletionData = DomUtil.create(
      "td",
      "selectable",
      clearCompletionDataRow
    );
    clearCompletionData.setAttribute("colspan", "3");
    clearCompletionData.innerText = "Clear completion data";
    DomEvent.addListener(clearCompletionData, "click", () => {
      if (
        confirm(
          "This will reset all pins that you've marked completed. Are you sure?"
        )
      ) {
        wiki.clearCompletion();
        layers.forEach((l) => l.clearTaggedMarkers("Completed"));
      }
    });
  }

  public login(username: string) {
    DomUtil.empty(this.userCell);
    const logoutButton = DomUtil.create("div", "selectable", this.userCell);
    logoutButton.style.cssFloat = "right";
    logoutButton.innerText = "Logout";
    DomEvent.addListener(logoutButton, "click", () => {
      this.wiki.logout();
    });
    const usernameLabel = DomUtil.create("div", "", this.userCell);
    usernameLabel.innerText = username;
  }
}

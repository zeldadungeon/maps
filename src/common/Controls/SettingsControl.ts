import { DomEvent, DomUtil } from "leaflet";
import { ControlPane } from "./ControlPane";
import { ControlDock } from "./ControlDock";
import { WikiConnector } from "../WikiConnector";
import { MapLayer } from "../MapLayer";
import { LocalStorage } from "../LocalStorage";
import { faCog } from "@fortawesome/free-solid-svg-icons/faCog";
import { library } from "@fortawesome/fontawesome-svg-core";
import { ZDHandler } from "common/Handlers/ZDHandler";

library.add(faCog);

type ToggleableSettingsRowConfig = {
  settingsContent: HTMLTableElement;
  onText: string;
  offText: string;
  tag: string;
  settingsStore: LocalStorage;
  settingsStoreKey: string;
  offByDefault: boolean;
  handleToggleOn: () => void;
  handleToggleOff: () => void;
  toggleOffOnLoadFalse: boolean;
};
function createToggleableSettingsRow({
  settingsContent,
  onText,
  offText,
  tag,
  settingsStore,
  settingsStoreKey,
  offByDefault,
  handleToggleOn,
  handleToggleOff,
  toggleOffOnLoadFalse,
}: ToggleableSettingsRowConfig) {
  const row = DomUtil.create("tr", "zd-settings__setting", settingsContent);
  const on = DomUtil.create("td", "zd-settings__button selectable", row);
  on.innerText = onText;
  const off = DomUtil.create("td", "zd-settings__button selectable", row);
  off.innerText = offText;
  const label = DomUtil.create("th", "zd-settings__label", row);
  label.innerText = tag;

  const settingValue = settingsStore.getItem<boolean>(settingsStoreKey);
  if (settingValue === false && toggleOffOnLoadFalse) {
    handleToggleOff();
  }
  if (settingValue === false || (offByDefault && settingValue !== true)) {
    DomUtil.addClass(off, "selected");
  } else {
    handleToggleOn();
    DomUtil.addClass(on, "selected");
  }

  DomEvent.addListener(on, "click", () => {
    if (!DomUtil.hasClass(on, "selected")) {
      DomUtil.removeClass(off, "selected");
      DomUtil.addClass(on, "selected");
      handleToggleOn();
      settingsStore.setItem(settingsStoreKey, true);
    }
  });
  DomEvent.addListener(off, "click", () => {
    if (!DomUtil.hasClass(off, "selected")) {
      DomUtil.removeClass(on, "selected");
      DomUtil.addClass(off, "selected");
      handleToggleOff();
      settingsStore.setItem(settingsStoreKey, false);
    }
  });
}

/**
 * Settings control
 */
export class SettingsControl extends ControlPane {
  private userCell: HTMLElement;

  public constructor(
    private wiki: WikiConnector,
    settingsStore: LocalStorage,
    layers: MapLayer[],
    tags: string[],
    handlers: ZDHandler[],
    controls: ControlDock
  ) {
    super({
      icon: "fa-cog",
      title: "Settings",
    });

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
      const handleToggleOn = () =>
        layers.forEach((l) => l.showTaggedMarkers(tag));
      const handleToggleOff = () =>
        layers.forEach((l) => l.hideTaggedMarkers(tag));
      createToggleableSettingsRow({
        settingsContent,
        onText: "Show",
        offText: "Hide",
        tag,
        settingsStore,
        settingsStoreKey: `show-${tag}`,
        offByDefault: tag === "Completed",
        handleToggleOn,
        handleToggleOff,
        toggleOffOnLoadFalse: false,
      });
    });

    handlers.forEach((handler) => {
      const handleToggleOn = () => handler.enable();
      const handleToggleOff = () => handler.disable();
      createToggleableSettingsRow({
        settingsContent,
        onText: "Enable",
        offText: "Disable",
        tag: handler.name,
        settingsStore,
        settingsStoreKey: `enable-${handler.name}`,
        offByDefault: false,
        handleToggleOn,
        handleToggleOff,
        toggleOffOnLoadFalse: false,
      });
    });
    createToggleableSettingsRow({
      settingsContent,
      onText: "Left",
      offText: "Right",
      tag: "Controls Position",
      settingsStore,
      settingsStoreKey: "controls-on-left",
      offByDefault: false,
      handleToggleOn: () => controls.setPosition("bottomleft"),
      handleToggleOff: () => controls.setPosition("bottomright"),
      toggleOffOnLoadFalse: true,
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

import { Control, DomEvent, DomUtil } from "leaflet";
import { ControlPane } from "./ControlPane";
import { LayersControl } from "./LayersControl";
import { LocalStorage } from "../LocalStorage";
import { ZoomControl } from "./ZoomControl";

/**
 * Dock containing all the map controls. It appears as a bar on the left in landscape, or on the bottom in portrait.
 */
export class ControlDock extends Control {
  private container: HTMLElement;
  private group1: HTMLElement;
  private group2: HTMLElement;
  private group3: HTMLElement;
  private paneContainer: HTMLElement;
  private controls: ControlPane[] = [];

  public constructor(private settingsStore: LocalStorage) {
    super({
      position: "bottomleft",
    });

    this.container = DomUtil.create("aside", "zd-controls");
    const dock = DomUtil.create("div", "zd-controls__dock", this.container);
    this.group1 = DomUtil.create("div", "zd-controls__dock__group", dock);
    this.group2 = DomUtil.create("div", "zd-controls__dock__group", dock);
    this.group3 = DomUtil.create("div", "zd-controls__dock__group", dock);
    this.paneContainer = DomUtil.create(
      "div",
      "zd-controls__pane-container",
      this.container
    );
    DomEvent.disableClickPropagation(this.container);
    DomEvent.disableScrollPropagation(this.container);
  }

  public onAdd(_map: L.Map): HTMLElement {
    return this.container;
  }

  public onRemove(_map: L.Map): void {
    // doesn't happen
  }

  public addControl(control: ControlPane, initShow = false): void {
    this.controls.push(control);

    // Add button
    const button = control.getButton();
    this.group1.appendChild(button);
    DomEvent.addListener(button, "click", () => {
      if (DomUtil.hasClass(button, "selected")) {
        control.close();
        DomUtil.removeClass(this.paneContainer, "visible");
        this.settingsStore.setItem("OpenControlPane", "None");
      } else {
        this.showControl(control);
        this.settingsStore.setItem("OpenControlPane", button.title);
      }
    });

    // Add content pane
    this.paneContainer.appendChild(control.getPane());

    const initOpenControlPane = this.settingsStore.getItem("OpenControlPane");
    if (
      initOpenControlPane === button.title ||
      (initOpenControlPane == undefined && initShow && window.innerWidth >= 768)
    ) {
      this.showControl(control);
    }
  }

  public addLayers(layers: LayersControl): void {
    this.group2.appendChild(layers.getButtons());
  }

  public addZoom(zoom: ZoomControl): void {
    this.group2.appendChild(zoom.getButtons());
  }

  private showControl(control: ControlPane): void {
    for (const otherControl of this.controls) {
      if (otherControl != control) {
        otherControl.close();
      }
    }
    control.open();

    DomUtil.addClass(this.paneContainer, "visible");
  }
}

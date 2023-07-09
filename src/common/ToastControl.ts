import { Control, DomEvent, DomUtil } from "leaflet";

/**
 * Shows a toast notification at the bottom of the screen
 */
export class ToastControl extends Control {
  private container: HTMLElement;

  public constructor() {
    super({
      position: "topright",
    });

    this.container = DomUtil.create("div", "zd-toast-container");
    DomEvent.disableClickPropagation(this.container);
  }

  public onAdd(_map: L.Map): HTMLElement {
    return this.container;
  }

  public onRemove(_map: L.Map): void {
    // doesn't happen
  }

  public showNotification(message: string): void {
    const toast = DomUtil.create("div", "zd-toast");
    toast.innerText = message;
    this.container.appendChild(toast);
    setTimeout(() => this.container.removeChild(toast), 5000);
  }

  public showStickyNotification(message: string, linkUrl?: string): void {
    const toast = DomUtil.create("div", "zd-toast zd-toast--sticky");
    toast.innerText = message;
    if (linkUrl != undefined) {
      DomUtil.addClass(toast, "zd-toast--link");
      DomEvent.addListener(toast, "click", () => {
        window.open(linkUrl, "_blank");
      });
    }
    this.container.appendChild(toast);
  }
}

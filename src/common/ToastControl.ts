import { Control, DomUtil } from "leaflet";

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
}

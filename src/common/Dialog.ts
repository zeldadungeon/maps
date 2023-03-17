import { Control, DomEvent, DomUtil } from "leaflet";
import { ZDMap } from "./ZDMap";
import "leaflet-control-window";
import "leaflet-control-window/src/L.Control.Window.css";

export interface DialogOptions {
  prompt: string;
  actions: string[];
}

/**
 * Wrapper for leaflet-control-window to show modal dialogs in a promise-friendly way
 */
export class Dialog {
  private dialog: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  constructor(map: ZDMap) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.dialog = new (<any>Control).Window(map, {
      modal: true,
      closeButton: false,
    });
  }

  public async showDialog(prompt: string, actions: string[]): Promise<string> {
    const dialog = this.dialog;

    return new Promise((resolve: (value: string) => void, _reject) => {
      dialog.content(
        `<p>${prompt}</p>${actions
          .map(
            (a) =>
              `<button id="dialog-action-${a
                .toLowerCase()
                .replace(" ", "")}">${a}</button><br />`
          )
          .join("")}`
      );
      actions.forEach((a) => {
        DomEvent.addListener(
          <HTMLElement>(
            DomUtil.get(`dialog-action-${a.toLowerCase().replace(" ", "")}`)
          ),
          "click",
          () => {
            dialog.hide();
            resolve(a);
          }
        );
      });
      dialog.show();
    });
  }
}

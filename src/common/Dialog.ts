import * as L from "leaflet";
import { Map } from "Map";
require("leaflet-control-window");
require("leaflet-control-window/src/L.Control.Window.css");

export interface DialogOptions {
    prompt: string;
    actions: string[];
}

/**
 * Wrapper for leaflet-control-window to show modal dialogs in a promise-friendly way
 */
export class Dialog {
    private dialog: any;

    constructor(map: Map) {
        this.dialog = (<any>L.control).window(map, {
            modal: true,
            closeButton: false
        });
    }

    public async showDialog(prompt: string, actions: string[]): Promise<string> {
        const dialog = this.dialog;

        return new Promise(function(resolve: (value?: string) => void, reject) {
            dialog.content(`<p>${prompt}</p>${actions.map(a =>
                `<button id="dialog-action-${a.toLowerCase().replace(" ", "")}">${a}</button><br />`).join("")}`);
            actions.forEach(a => {
                L.DomEvent.addListener(<HTMLElement>L.DomUtil.get(`dialog-action-${a.toLowerCase().replace(" ", "")}`), "click", () => {
                    dialog.hide();
                    resolve(a);
                });
            });
            dialog.show();
        });
    }
}
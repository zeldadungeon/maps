import { Browser, DomEvent, DomUtil } from "leaflet";
import { MapLayer } from "../MapLayer";

type LayerControlEventHandler = (layer: MapLayer) => void;

export interface Options {
  minZoom: number;
  maxZoom: number;
  initialZoom: number;
  zoomIn: () => void;
  zoomOut: () => void;
}

/**
 * Set of controls for toggling which layer is visible
 */
export class ZoomControl {
  private container: HTMLElement;
  private zoomInBtn: HTMLElement;
  private zoomOutBtn: HTMLElement;

  public constructor(private options: Options) {
    this.container = DomUtil.create("div", "zd-control__button-group");

    this.zoomInBtn = DomUtil.create(
      "div",
      "zd-control__button",
      this.container
    );
    this.zoomInBtn.innerText = "+";
    this.zoomInBtn.title = "Zoom in";
    if (options.initialZoom >= options.maxZoom) {
      DomUtil.addClass(this.zoomInBtn, "disabled");
    }
    DomEvent.on(this.zoomInBtn, "click", () => {
      if (!DomUtil.hasClass(this.zoomInBtn, "disabled")) {
        options.zoomIn();
      }
    });

    this.zoomOutBtn = DomUtil.create(
      "div",
      "zd-control__button",
      this.container
    );
    this.zoomOutBtn.innerText = "-";
    this.zoomOutBtn.title = "Zoom out";
    if (options.initialZoom <= options.minZoom) {
      DomUtil.addClass(this.zoomOutBtn, "disabled");
    }
    DomEvent.on(this.zoomOutBtn, "click", () => {
      if (!DomUtil.hasClass(this.zoomOutBtn, "disabled")) {
        options.zoomOut();
      }
    });
  }

  public getButtons(): HTMLElement {
    return this.container;
  }

  public setZoom(zoom: number) {
    if (zoom >= this.options.maxZoom) {
      DomUtil.addClass(this.zoomInBtn, "disabled");
    } else {
      DomUtil.removeClass(this.zoomInBtn, "disabled");
    }

    if (zoom <= this.options.minZoom) {
      DomUtil.addClass(this.zoomOutBtn, "disabled");
    } else {
      DomUtil.removeClass(this.zoomOutBtn, "disabled");
    }
  }
}

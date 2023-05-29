import { Browser, DomEvent, DomUtil } from "leaflet";
import { MapLayer } from "../MapLayer";

type LayerControlEventHandler = (layer: MapLayer) => void;

export interface Options {
  layers: MapLayer[];
}

interface LayerAndButton {
  layer: MapLayer;
  button: HTMLElement;
}

/**
 * Set of controls for toggling which layer is visible
 */
export class LayersControl {
  private container: HTMLElement;
  private layers: LayerAndButton[] = [];
  private onLayerSelectedHandlers = <LayerControlEventHandler[]>[];

  public constructor(options: Options) {
    this.container = DomUtil.create("div", "zd-control__button-group");

    for (const layer of options.layers) {
      const button = DomUtil.create(
        "div",
        "zd-control__button",
        this.container
      );
      button.style.backgroundImage = `url('${layer.iconUrl}')`;
      button.style.backgroundSize = "contain";
      button.style.backgroundRepeat = "no-repeat";
      button.title = layer.layerName;

      DomEvent.disableClickPropagation(button);
      DomEvent.on(button, "click", DomEvent.stop);
      if (!Browser.touch) {
        DomEvent.disableScrollPropagation(button);
      }

      DomEvent.addListener(button, "click", () =>
        this.selectLayer(layer.layerName)
      );

      this.layers.push({ layer, button });
      //Check whether this layer is currently visible, if so select it
      if (layer.hasLayer(layer.tileLayer)) {
        this.selectLayer(layer.layerName);
      }
    }
  }

  public getButtons(): HTMLElement {
    return this.container;
  }

  public selectLayer(layerName: string): void {
    for (const l of this.layers) {
      if (l.layer.layerName == layerName) {
        l.layer.show();
        DomUtil.addClass(l.button, "bar-selected");
        this.onLayerSelectedHandlers.forEach((h) => h(l.layer));
        //Use enabledIcon if it exists
        if (l.layer.enabledIconUrl) {
          l.button.style.backgroundImage = `url('${l.layer.enabledIconUrl}')`;
        }
      } else {
        l.layer.hide();
        DomUtil.removeClass(l.button, "bar-selected");
        //Use normal icon
        l.button.style.backgroundImage = `url('${l.layer.iconUrl}')`;
      }
    }
  }

  public onLayerSelected(handler: LayerControlEventHandler): void {
    this.onLayerSelectedHandlers.push(handler);
  }
}

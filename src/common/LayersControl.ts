import { Browser, Control, DomEvent, DomUtil } from "leaflet";
import { MapLayer } from "./MapLayer";

type LayerControlEventHandler = (layer: MapLayer) => void;

export interface Options extends L.ControlOptions {
  layers: MapLayer[];
}

interface LayerAndButton {
  layer: MapLayer;
  button: HTMLAnchorElement;
}

/**
 * Set of controls for toggling which layer is visible
 */
export class LayersControl extends Control {
  private container: HTMLElement;
  private layers: LayerAndButton[] = [];
  private onLayerSelectedHandlers = <LayerControlEventHandler[]>[];

  public constructor(options: Options) {
    super(options);

    this.container = DomUtil.create("div", "leaflet-bar");

    for (const layer of options.layers) {
      const button = DomUtil.create("a", "", this.container);
      button.href = "#";
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
    }
  }

  public onAdd(_map: L.Map): HTMLElement {
    return this.container;
  }

  public onRemove(_map: L.Map): void {
    // doesn't happen
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

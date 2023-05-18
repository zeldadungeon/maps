import * as Schema from "./JSONSchema";
import { Icon, LayerGroup } from "leaflet";
import { WikiConnector } from "./WikiConnector";
import { ZDMarker } from "./ZDMarker";

type ZoomHandler = (zoom: number) => void;

export enum Visibility {
  Off,
  On,
  Default,
}

export class Layer extends LayerGroup {
  public icon?: L.Icon;
  public link?: string;

  public minZoom = 0;
  public maxZoom = Number.MAX_VALUE;
  public visibility = Visibility.Default;
  public markers!: ZDMarker[]; // BUGBUG refactor to avoid having to suppress null checking
  private zoomHandlers = <ZoomHandler[]>[];

  private constructor(public name: string, public infoSource: string) {
    super();
  }

  public static fromJSON(
    json: Schema.Layer,
    categoryName: string,
    categoryLink: string | undefined,
    infoSource: string,
    directory: string,
    wiki: WikiConnector
  ): Layer {
    const layer = new Layer(json.name ?? categoryName, infoSource);

    if (json.icon) {
      layer.icon = new Icon({
        iconUrl: `${import.meta.env.BASE_URL}${directory}/icons/${
          json.icon.url
        }`, // TODO find a better way to get directory
        iconSize: [json.icon.width, json.icon.height],
      });
    }

    layer.link = json.link ?? categoryLink;

    if (json.minZoom != undefined) {
      layer.minZoom = json.minZoom;
    }
    if (json.maxZoom != undefined) {
      layer.maxZoom = json.maxZoom;
    }

    layer.markers = json.markers.map((m) => ZDMarker.fromJSON(m, layer, wiki));

    return layer;
  }

  // called by ZDMarker to register zoom handlers
  public onZoom(handler: ZoomHandler): void {
    this.zoomHandlers.push(handler);
  }

  // called by MapLayer (which is called by ZDMap) to activate zoom handlers
  public updateZoom(zoom: number): void {
    for (const handler of this.zoomHandlers) {
      handler(zoom);
    }
  }

  public getIconUrl(): string {
    return (this.icon && this.icon.options.iconUrl) || "";
  }

  public getIconWidth(): number {
    return (this.icon && (<L.PointTuple>this.icon.options.iconSize)[0]) || 0;
  }

  public getMinZoom(): number {
    return this.minZoom;
  }

  public forceShow(): void {
    this.setVisibility(Visibility.On);
  }

  public forceHide(): void {
    this.setVisibility(Visibility.Off);
  }

  public resetVisibility(): void {
    this.setVisibility(Visibility.Default);
  }

  private setVisibility(visibility: Visibility): void {
    this.visibility = visibility;
  }
}

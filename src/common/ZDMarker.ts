import * as Schema from "./JSONSchema";
import { DivIcon, LatLngTuple, Marker, PointTuple, Polyline } from "leaflet";
import { Layer } from "./Layer";
import { MarkerContainer } from "./MarkerContainer";
import { WikiConnector } from "./WikiConnector";
import { ZDPopup } from "./ZDPopup";

export class ZDMarker extends Marker {
  public id: string;
  public name: string;
  public tags: string[];
  public layer: Layer;
  public tileContainers = <MarkerContainer[]>[]; // TODO get rid of this. Let MapLayer handle it.
  private zoomAdjustedCoords?: { [zoom: number]: LatLngTuple };
  private showLabelForZoomLevel?: number;
  private labelOffset?: number;
  private originalLatLng: LatLngTuple;
  private path?: L.Polyline;
  private popup?: ZDPopup;

  private constructor(
    json: Schema.Marker,
    coords: L.LatLngExpression,
    layer: Layer
  ) {
    super(coords, {
      title: json.name ?? layer.name,
      icon:
        layer.icon ||
        new DivIcon({
          className: "zd-void-icon",
        }),
    });
    this.id = json.id;
    this.name = json.name ?? layer.name;
    this.tags = json.tags ?? [];
    this.layer = layer;
    this.zoomAdjustedCoords = json.zoomAdjustedCoords;
    if (layer.showLabelForZoomLevel != undefined) {
      this.showLabelForZoomLevel = layer.showLabelForZoomLevel;
      this.labelOffset = (<PointTuple>layer.icon?.options.iconSize)[1];
    }
    this.originalLatLng = json.coords;
    this.layer.onZoom(this.handleZoom.bind(this));
  }

  public static fromJSON(
    json: Schema.Marker,
    layer: Layer,
    wiki: WikiConnector
  ): ZDMarker {
    const marker = new ZDMarker(json, json.coords, layer);

    if (layer.icon) {
      marker.popup = ZDPopup.create({
        id: json.id,
        name: marker.name,
        link: json.link ?? layer.link,
        infoSource: layer.infoSource,
        coords: json.elv
          ? [json.coords[1], json.coords[0], json.elv]
          : undefined,
        wiki,
        linkClicked: (target) => {
          marker.fire("internallinkclicked", { linkTarget: target });
        },
      });
      marker.popup.on("complete", () => {
        marker.complete();
      });
      marker.popup.on("uncomplete", () => {
        const tag = marker.tags.indexOf("Completed");
        if (tag > -1) {
          marker.tags.splice(tag, 1);
        }
        marker.fire("uncompleted");
      });
      marker.bindPopup(marker.popup);
      marker.on("popupopen", () => {
        marker.updateUrl();
        marker.popup?.loadDynamicContent();
      });
    } else {
      marker
        .bindTooltip(marker.name, {
          permanent: true,
          direction: "center",
          className: "zd-location-label",
        })
        .openTooltip();
    }

    if (json.path) {
      marker.path = new Polyline(json.path, {
        color: "#ffffff",
      });
    }

    return marker;
  }

  public addToTileContainer(container: MarkerContainer): void {
    this.tileContainers.push(container);
  }

  public complete(): void {
    this.tags.push("Completed");
    this.popup?.markCompleted();
    this.fire("completed");
  }

  public clearCompletion(): void {
    const tag = this.tags.indexOf("Completed");
    if (tag > -1) {
      this.tags.splice(tag, 1);
    }
    this.popup?.markUncompleted();
    this.fire("uncompleted");
  }

  public hasPath(): boolean {
    return this.path != undefined;
  }

  // TODO refactor Layer, marker shouldn't need a reference to it? layer should add/remove the marker itself.
  public show(showPath = true): void {
    if (this.layer) {
      // TODO is this check really needed?
      this.addTo(this.layer);
      if (showPath) {
        this.path?.addTo(this.layer);
      } else if (this.path) {
        this.layer.removeLayer(this.path);
      }
    }
  }

  public hide(): void {
    if (this.layer) {
      // TODO is this check really needed?
      this.layer.removeLayer(this); // this.removeFrom only takes Map for some reason?
      if (this.path) {
        this.layer.removeLayer(this.path);
      }
    }
  }

  public handleZoom(zoom: number): void {
    if (this.zoomAdjustedCoords != undefined) {
      this.setLatLng(this.zoomAdjustedCoords[zoom] ?? this.originalLatLng);
    }

    if (this.showLabelForZoomLevel != undefined) {
      if (this.showLabelForZoomLevel <= zoom) {
        this.bindTooltip(this.name, {
          permanent: true,
          direction: "center",
          className: "zd-location-label zd-location-label--with-icon",
          offset: [0, this.labelOffset ?? 0],
        });
      } else {
        this.unbindTooltip();
      }
    }
  }

  public getIconUrl(): string {
    return this.layer.getIconUrl();
  }

  public getIconWidth(): number {
    return this.layer.getIconWidth();
  }

  public getIconHeight(): number {
    return this.layer.getIconHeight();
  }

  public getMinZoom(): number {
    return this.layer.getMinZoom();
  }

  private updateUrl(): void {
    const url = new URL(window.location.toString());
    url.searchParams.set("m", this.id);
    url.searchParams.delete("id");
    history.pushState({}, "", url);
  }
}

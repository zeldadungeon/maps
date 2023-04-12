import * as Schema from "./JSONSchema";
import { DivIcon, Marker, Polyline } from "leaflet";
import { Layer } from "./Layer";
import { ZDMap } from "./ZDMap";
import { MarkerContainer } from "./MarkerContainer";
import { ZDPopup } from "./ZDPopup";

export class ZDMarker extends Marker {
  public id: string;
  public name: string;
  public tags: string[];
  private map!: ZDMap; // BUGBUG refactor to avoid having to suppress null checking
  public layer: Layer;
  public tileContainers = <MarkerContainer[]>[]; // TODO get rid of this. Let MapLayer handle it.
  private path?: L.Polyline;
  private popup?: ZDPopup;

  private constructor(
    json: Schema.Marker,
    coords: L.LatLngExpression,
    layer: Layer
  ) {
    super(coords, {
      title: json.name,
      icon:
        layer.icon ||
        new DivIcon({
          className: "zd-void-icon",
        }),
    });
    this.id = json.id;
    this.name = json.name;
    this.tags = json.tags || [];
    this.layer = layer;
  }

  public static fromJSON(json: Schema.Marker, layer: Layer): ZDMarker {
    const marker = new ZDMarker(json, json.coords, layer);
    const linkParts = json.link && json.link !== "" ? json.link.split("#") : [];
    const editLink =
      layer.infoSource === "summary" || layer.infoSource === "section"
        ? linkParts[0]
        : layer.infoSource === "subpage" && linkParts[1]
        ? `${linkParts[0]}/Map/${linkParts[1]}`
        : layer.infoSource === "subpage"
        ? `${linkParts[0]}/Map`
        : linkParts[0];

    if (layer.icon) {
      marker.popup = ZDPopup.create({
        id: json.id,
        name: json.name,
        link: json.link,
        editLink: editLink,
        getWikiConnector: () => marker.map.wiki,
        complete: () => {
          marker.map.wiki.complete(marker.id);
          marker.complete();
        },
        uncomplete: () => {
          marker.map.wiki.uncomplete(marker.id);
          const tag = marker.tags.indexOf("Completed");
          if (tag > -1) {
            marker.tags.splice(tag, 1);
          }
          marker.fire("uncompleted");
        },
        linkClicked: (target) => {
          marker.map.navigateToMarkerById(target);
        },
      });
      marker.bindPopup(marker.popup);
      marker.on("popupopen", () => {
        if (layer.infoSource === "summary") {
          marker.popup?.loadContentFromSummary(linkParts[0]);
        } else if (layer.infoSource === "section") {
          marker.popup?.loadContentFromSection(
            linkParts[0],
            json.id.match(/^Seed\d{3}$/)
              ? `${json.id}summary`
              : linkParts[1] || "summary"
          );
        } else if (layer.infoSource === "subpage") {
          marker.popup?.loadContentFromSubpage(linkParts[0], linkParts[1]);
        } else if (layer.infoSource) {
          marker.popup?.loadContentFromPage(layer.infoSource);
        }
      });
    } else {
      marker
        .bindTooltip(json.name, {
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

  public addToMap(map: ZDMap): void {
    this.map = map;
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

  // TODO refactor Layer, marker shouldn't need a reference to it? layer should add/remove the marker itself.
  public show(): void {
    if (this.layer) {
      // TODO is this check really needed?
      this.addTo(this.layer);
      this.path?.addTo(this.layer);
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

  public getIconUrl(): string {
    return this.layer.getIconUrl();
  }

  public getIconWidth(): number {
    return this.layer.getIconWidth();
  }

  public getMinZoom(): number {
    return this.layer.getMinZoom();
  }
}

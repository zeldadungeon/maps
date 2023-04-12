import { Layer, Visibility } from "./Layer";
import { Category } from "./Category";
import { LatLngExpression, LayerGroup, Point } from "leaflet";
import { MarkerContainer } from "./MarkerContainer";
import { TileLayer } from "leaflet";
import { ZDMarker } from "./ZDMarker";

export class MapLayer {
  public tileLayer: TileLayer;
  public markerLayer: LayerGroup; // TODO add markers here instead of directly on the map, and add this to the map
  private categories = <{ [key: string]: Layer[] }>{};
  private tileMarkerContainers: MarkerContainer[][][] = [];
  private taggedMarkerContainers = <{ [key: string]: MarkerContainer }>{};
  private currentZoom = 0;

  public constructor(
    public layerName: string,
    directory: string,
    private tileSize: number,
    private maxZoom: number,
    bounds: L.LatLngBounds
  ) {
    this.tileLayer = new TileLayer(
      `https://www.zeldadungeon.net/maps/${directory}/tiles/{z}/{x}_{y}.jpg`,
      {
        tileSize: tileSize,
        minZoom: 0,
        maxZoom: maxZoom,
        bounds: bounds,
        noWrap: true,
      }
    );

    this.markerLayer = new LayerGroup();

    for (let z = 0; z <= maxZoom; ++z) {
      this.tileMarkerContainers[z] = [];
      for (let x = 0; x < Math.pow(2, z); ++x) {
        this.tileMarkerContainers[z][x] = [];
        for (let y = 0; y < Math.pow(2, z); ++y) {
          this.tileMarkerContainers[z][x][y] = new MarkerContainer();
        }
      }
    }

    this.tileLayer.on("tileload", (e: L.LeafletEvent) => {
      const te = <L.TileEvent>e;
      const container =
        this.tileMarkerContainers[te.coords.z][te.coords.x][te.coords.y];
      container.show();
      container.getMarkers().forEach(this.updateMarkerVisibility.bind(this));
    });
    this.tileLayer.on("tileunload", (e: L.LeafletEvent) => {
      const te = <L.TileEvent>e;
      const container =
        this.tileMarkerContainers[te.coords.z][te.coords.x][te.coords.y];
      container.hide();
      container.getMarkers().forEach(this.updateMarkerVisibility.bind(this));
    });

    this.taggedMarkerContainers["Completed"] = new MarkerContainer();
  }

  public addCategory(
    category: Category,
    projectFn: (latLng: LatLngExpression, zoom?: number) => Point,
    addMarkerToMapFn: (marker: ZDMarker) => void
  ): void {
    this.categories[category.name] = category.layers;
    category.layers.forEach((l) => {
      this.updateLayerVisibility(l);
      l.markers.forEach((m) => {
        this.addMarker(m, projectFn(m.getLatLng(), 0));
        addMarkerToMapFn(m);
      });
    });
  }

  public addMarker(marker: ZDMarker, point: L.Point): void {
    let isVisible = false;

    // add to tile containers
    for (let z = 0; z <= this.maxZoom; ++z) {
      const x = Math.floor((point.x * Math.pow(2, z)) / this.tileSize);
      const y = Math.floor((point.y * Math.pow(2, z)) / this.tileSize);
      this.tileMarkerContainers[z][x][y].addMarker(marker);

      // marker is visible if tile container at ANY zoom level is visible
      if (this.tileMarkerContainers[z][x][y].isVisible()) {
        isVisible = true;
      }

      // TODO remove this, marker shouldn't need reference to tile containers
      marker.addToTileContainer(this.tileMarkerContainers[z][x][y]);
    }

    // add to tag containers
    marker.tags.forEach((tag) => {
      const container = this.getTaggedMarkerContainer(tag);
      container.addMarker(marker);

      // marker is visible if EVERY tag container is visible
      if (!container.isVisible()) {
        isVisible = false;
      }
    });

    if (isVisible) {
      marker.show();
    }

    marker.on("completed", () => {
      this.taggedMarkerContainers["Completed"].addMarker(marker);
      this.updateMarkerVisibility(marker);
    });
    marker.on("uncompleted", () => {
      this.taggedMarkerContainers["Completed"].removeMarker(marker);
      this.updateMarkerVisibility(marker);
    });
  }

  public getMarkerById(id: string): ZDMarker {
    return this.tileMarkerContainers[0][0][0].getMarker(id);
  }

  public findMarkers(searchRegex: RegExp): ZDMarker[] {
    // [0][0][0] is the top-level/min-zoom/one-tile container that contains all markers
    return this.tileMarkerContainers[0][0][0].findMarkers(searchRegex);
  }

  public showTaggedMarkers(tag: string): void {
    const container = this.getTaggedMarkerContainer(tag);
    container.show();
    container.getMarkers().forEach(this.updateMarkerVisibility.bind(this));
  }

  public hideTaggedMarkers(tag: string): void {
    const container = this.taggedMarkerContainers[tag]; // don't bother creating it if it doesn't exist, since hiding would be a no-op
    container?.hide();
    container?.getMarkers().forEach(this.updateMarkerVisibility.bind(this));
  }

  public showCategory(categoryName: string): void {
    this.categories[categoryName]?.forEach((l) => {
      l.forceShow();
      this.updateLayerVisibility(l);
    });
  }

  public hideCategory(categoryName: string): void {
    this.categories[categoryName]?.forEach((l) => {
      l.forceHide();
      this.updateLayerVisibility(l);
    });
  }

  public resetCategoryVisibility(categoryName: string): void {
    this.categories[categoryName]?.forEach((l) => {
      l.resetVisibility();
      this.updateLayerVisibility(l);
    });
  }

  public clearTaggedMarkers(tag: string): void {
    this.taggedMarkerContainers[tag]?.clear();
  }

  public updateZoom(zoom: number): void {
    this.currentZoom = zoom;
    Object.values(this.categories).forEach((c) =>
      c.forEach((l) => this.updateLayerVisibility(l))
    );
  }

  // TODO refactor
  public openPopupWhenLoaded(marker: ZDMarker): void {
    if (
      marker.layer.hasLayer(marker) &&
      this.markerLayer.hasLayer(marker.layer)
    ) {
      marker.openPopup();
    } else {
      const func = () => {
        marker.off("add", func);
        marker.layer.off("add", func);
        if (!marker.layer.hasLayer(marker)) {
          marker.on("add", func);
        } else if (!this.markerLayer.hasLayer(marker.layer)) {
          marker.layer.on("add", func);
        } else {
          marker.openPopup();
        }
      };
      func();
    }
  }

  private getTaggedMarkerContainer(tag: string): MarkerContainer {
    if (this.taggedMarkerContainers[tag] == undefined) {
      this.taggedMarkerContainers[tag] = new MarkerContainer();
    }
    return this.taggedMarkerContainers[tag];
  }

  private updateMarkerVisibility(marker: ZDMarker): void {
    if (
      marker.tileContainers.some((c) => c.isVisible()) &&
      marker.tags.every(
        (tag) => this.taggedMarkerContainers[tag]?.isVisible() !== false // undefined -> true
      )
    ) {
      marker.show();
    } else {
      marker.hide();
    }
  }

  private updateLayerVisibility(layer: Layer): void {
    if (
      layer.visibility === Visibility.On ||
      (layer.visibility === Visibility.Default &&
        this.currentZoom >= layer.minZoom &&
        this.currentZoom <= layer.maxZoom)
    ) {
      this.markerLayer.addLayer(layer);
    } else {
      this.markerLayer.removeLayer(layer);
    }
  }
}
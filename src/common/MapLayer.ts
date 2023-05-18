import { Layer, Visibility } from "./Layer";
import { LayerGroup } from "leaflet";
import { MarkerContainer } from "./MarkerContainer";
import { TileLayer } from "leaflet";
import { ZDMap } from "./ZDMap";
import { ZDMarker } from "./ZDMarker";

export class MapLayer extends LayerGroup {
  public tileLayer: TileLayer;
  public markerLayer: LayerGroup;
  public iconUrl: string;
  private categories = <{ [key: string]: Layer[] }>{};
  private tileMarkerContainers: MarkerContainer[][][] = [];
  private taggedMarkerContainers = <{ [key: string]: MarkerContainer }>{};
  private currentZoom = 0;

  public constructor(
    private map: ZDMap,
    public layerName: string,
    tilePath: string | undefined,
    private tileSize: number,
    private maxZoom: number,
    bounds: L.LatLngBounds
  ) {
    super();
    this.iconUrl = `${import.meta.env.BASE_URL}${
      map.directory
    }/icons/${tilePath}.png`;
    tilePath = tilePath ? `tiles/${tilePath}` : "tiles";
    this.tileLayer = new TileLayer(
      `${import.meta.env.BASE_URL}${map.directory}/${tilePath}/{z}/{x}_{y}.jpg`,
      {
        tileSize: tileSize,
        minZoom: 0,
        maxZoom: map.getMaxZoom(),
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

  public addCategory(categoryName: string, layers: Layer[]): void {
    this.categories[categoryName] = layers;
    layers.forEach((l) => {
      this.updateLayerVisibility(l);
      l.markers.forEach((m) => {
        this.addMarker(m, this.map.project(m.getLatLng(), 0));
        this.map.addMarker(m, this);
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

    if (marker.hasPath()) {
      const pathContainer = this.getTaggedMarkerContainer("Paths");
      pathContainer.addMarker(marker);
    }

    if (isVisible) {
      marker.show(this.taggedMarkerContainers["Paths"]?.isVisible() !== false);
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

  public show(): void {
    if (!this.hasLayer(this.tileLayer)) {
      this.addLayer(this.tileLayer);
    }
    if (!this.hasLayer(this.markerLayer)) {
      this.addLayer(this.markerLayer);
    }
  }

  public hide(): void {
    if (this.hasLayer(this.tileLayer)) {
      this.removeLayer(this.tileLayer);
    }
    if (this.hasLayer(this.markerLayer)) {
      this.removeLayer(this.markerLayer);
    }
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
    for (const category of Object.values(this.categories)) {
      for (const layer of category) {
        layer.updateZoom(zoom);
        this.updateLayerVisibility(layer);
      }
    }
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
      marker.show(this.taggedMarkerContainers["Paths"]?.isVisible() !== false);
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

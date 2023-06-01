import { Layer, Visibility } from "./Layer";
import { CircleMarker, DivIcon, LayerGroup, Point } from "leaflet";
import { LocalStorage } from "./LocalStorage";
import { MarkerContainer } from "./MarkerContainer";
import { ObjectCategory } from "./JSONSchema";
import { TileLayer } from "leaflet";
import { ZDMap } from "./ZDMap";
import { ZDMarker } from "./ZDMarker";
import "leaflet.markercluster";

export class MapLayer extends LayerGroup {
  public tileLayer: TileLayer;
  public markerLayer: LayerGroup;
  public iconUrl: string;
  public enabledIconUrl?: string;
  private categories: Record<string, Layer[]> = {};
  private initialCategoryState: Record<string, Visibility> = {};
  private tileMarkerContainers: MarkerContainer[][][] = [];
  private taggedMarkerContainers: Record<string, MarkerContainer> = {};
  private objectGroups: Record<string, LayerGroup> = {};
  private currentZoom = 0;
  private selectedObjects: string[];

  public constructor(
    private map: ZDMap,
    public layerName: string,
    layerId: string | undefined,
    layerIdEnabled: string | undefined,
    private tileSize: number,
    private maxZoom: number,
    bounds: L.LatLngBounds
  ) {
    super();
    const settingsStore = LocalStorage.getStore(this.map.directory, "settings");
    this.selectedObjects = settingsStore.getItem("Objects-Selected");
    this.iconUrl = `${import.meta.env.BASE_URL}${
      map.directory
    }/icons/${layerId}.png`;
    this.enabledIconUrl = `${import.meta.env.BASE_URL}${
      map.directory
    }/icons/${layerIdEnabled}.png`;
    layerId = layerId ? `tiles/${layerId}` : "tiles";
    this.tileLayer = new TileLayer(
      `${import.meta.env.BASE_URL}${map.directory}/${layerId}/{z}/{x}_{y}.jpg`,
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
      if (this.initialCategoryState[categoryName] === Visibility.On) {
        l.forceShow();
      } else if (this.initialCategoryState[categoryName] === Visibility.Off) {
        l.forceHide();
      }
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

  public categoryStartsVisible(categoryName: string): void {
    this.initialCategoryState[categoryName] = Visibility.On;
  }

  public categoryStartsHidden(categoryName: string): void {
    this.initialCategoryState[categoryName] = Visibility.Off;
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

  public addObjects(objects: ObjectCategory[]): void {
    for (const category of objects) {
      const h = 1 + Math.random() * 360;
      const s = 100;
      const l = 50;
      const hsl = "hsl(" + h + "," + s + "%," + l + "%)";
      const hsla = "hsla(" + h + "," + s + "%," + l + "%, .6)";
      const layerGroup = new window.L.MarkerClusterGroup({
        iconCreateFunction: (cluster) => {
          const childCount = cluster.getChildCount();
          const className = `zd-marker-cluster zd-marker-cluster--${
            childCount < 10 ? "small" : childCount < 100 ? "medium" : "large"
          }`;
          const iconSize = childCount < 10 ? 40 : childCount < 100 ? 50 : 60;

          return new DivIcon({
            html: `<div title="${category.name}" style="background-color: ${hsla};"><div style="background-color: ${hsla};"><span>${childCount} <span aria-label="markers"></span></span></div></div>`,
            className,
            iconSize: new Point(iconSize, iconSize),
          });
        },
      });
      this.objectGroups[category.name] = layerGroup;
      for (const coords of category.markerCoords) {
        new CircleMarker(coords, { color: hsl, radius: 5 })
          .bindTooltip(category.name)
          .addTo(layerGroup);
      }
      if (this.selectedObjects.includes(category.name)) {
        this.markerLayer.addLayer(layerGroup);
      }
    }
  }

  public updateSelectedObjects(selectedObjects: Record<string, boolean>): void {
    for (const groupName of Object.keys(this.objectGroups)) {
      if (selectedObjects[groupName]) {
        this.markerLayer.addLayer(this.objectGroups[groupName]);
      } else {
        this.markerLayer.removeLayer(this.objectGroups[groupName]);
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

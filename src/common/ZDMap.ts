import * as ZDCRS from "./ZDCRS";
import { LatLngBounds, Map, Marker, Point } from "leaflet";
import {
  ObjectsControl,
  Options as ObjectsControlOptions,
} from "./Controls/ObjectsControl";
import { ControlDock } from "./Controls/ControlDock";
import { dom } from "@fortawesome/fontawesome-svg-core";
import { Dialog } from "./Dialog";
import { FilterControl } from "./Controls/FilterControl";
import { ICategory } from "./ICategory";
import { LayersControl } from "./Controls/LayersControl";
import { LocalStorage } from "./LocalStorage";
import { MapLayer } from "./MapLayer";
import { params } from "./QueryParameters";
import { SearchControl } from "./Controls/SearchControl";
import { SettingsControl } from "./Controls/SettingsControl";
import { ToastControl } from "./ToastControl";
import { WikiConnector } from "./WikiConnector";
import { ZDMarker } from "./ZDMarker";
import { ZoomControl } from "./Controls/ZoomControl";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerIconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";

dom.watch();

export interface ZDMapOptions extends L.MapOptions {
  directory: string;
  gameTitle: string;
  mapSizePixels: number;
  mapSizeCoords?: number;
  tileSizePixels: number;
}

/**
 * Base class for all Zelda maps
 */
export class ZDMap extends Map {
  // BUGBUG refactor to avoid having to suppress null checking
  public wiki!: WikiConnector;
  private layers = <MapLayer[]>[];
  private filterControl?: FilterControl;
  private settingsControl?: SettingsControl;
  private layersControl?: LayersControl;
  private toastControl = new ToastControl();

  private constructor(
    element: string | HTMLElement,
    public directory: string,
    private tileSize: number,
    private bounds: LatLngBounds,
    options?: L.MapOptions
  ) {
    super(element, options);
  }

  public static create(options: ZDMapOptions): ZDMap {
    const maxZoom = Math.round(
      Math.log(options.mapSizePixels / options.tileSizePixels) * Math.LOG2E
    );
    if (options.maxZoom == undefined) {
      options.maxZoom = maxZoom;
    }
    if (options.zoom == undefined) {
      options.zoom = maxZoom - 2;
    }

    const initZoom = Number(params.z);
    if (!isNaN(Number(params.z))) {
      options.zoom = initZoom;
    }
    let initLat = Number(params.x);
    if (isNaN(initLat)) {
      initLat = Number(params.lat);
    }
    let initLng = Number(params.y);
    if (isNaN(initLng)) {
      initLng = Number(params.lng);
    }
    if (!isNaN(initLat) && !isNaN(initLng)) {
      options.center = [initLat, initLng];
    }

    const crs = ZDCRS.create(
      options.mapSizeCoords ?? options.mapSizePixels,
      options.tileSizePixels
    );
    options.crs = crs;

    const bounds = new LatLngBounds(
      crs.pointToLatLng(new Point(0, options.mapSizePixels), maxZoom),
      crs.pointToLatLng(new Point(options.mapSizePixels, 0), maxZoom)
    );
    options.maxBounds = bounds.pad(0.5);

    options.zoomControl = false; // using a custom zoom control instead
    options.attributionControl = false;

    const map = new ZDMap(
      "map",
      options.directory,
      options.tileSizePixels,
      bounds,
      options
    );
    map.getContainer().classList.add(`zd-map-${options.directory}`);

    const dialog = new Dialog(map);
    map.wiki = new WikiConnector(
      options.directory,
      options.gameTitle,
      dialog.showDialog.bind(dialog),
      map.toastControl.showNotification.bind(map.toastControl)
    );

    map.on("moveend", function () {
      map.updateUrl();
    });

    map.on("zoomend", function () {
      map.layers.forEach((l) => l.updateZoom(map.getZoom()));
      map.updateUrl();
    });

    const tempMarker = new Marker([0, 0], { draggable: true }).bindPopup("");
    if (import.meta.env.PROD) {
      // Fix Vite not resolving icon url from node_modules/leaflet/dist
      tempMarker.getIcon().options.iconUrl = markerIconUrl;
      tempMarker.getIcon().options.iconRetinaUrl = markerIconRetinaUrl;
      tempMarker.getIcon().options.shadowUrl = markerShadowUrl;
    }
    const wikiContributeLink = `<a target="_blank" href="https://zeldadungeon.net/wiki/Zelda Dungeon:${options.gameTitle} Map">Contribute Marker</a>`;
    map.on("click", (e) => {
      console.log(e.latlng);
      map.panTo(e.latlng);
      // for now, enable temp marker for totk
      if (options.directory === "totk") {
        tempMarker
          .setLatLng(e.latlng)
          .addTo(map)
          .setPopupContent(
            `{{Pin|${Math.round(e.latlng.lng)}|${Math.round(
              e.latlng.lat
            )}||&lt;name&gt;}}<br />${wikiContributeLink}`
          )
          .openPopup();
      }
    });
    tempMarker.on("drag", (e) => {
      const latlng = tempMarker.getLatLng();
      tempMarker
        .setPopupContent(
          `{{Pin|${Math.round(latlng.lng)}|${Math.round(
            latlng.lat
          )}||&lt;name&gt;}}<br />${wikiContributeLink}`
        )
        .openPopup();
    });
    tempMarker.on("click", (e) => {
      tempMarker.removeFrom(map);
    });

    return map;
  }

  public addMapLayer(
    layerName = "Default",
    tilePath: string | undefined = undefined,
    layerIdEnabled?: string,
    selected = true
  ): MapLayer {
    const layer = new MapLayer(
      this,
      layerName,
      tilePath,
      layerIdEnabled,
      this.tileSize,
      this.getMaxZoom(),
      this.bounds
    );
    layer.updateZoom(this.getZoom());
    this.addLayer(layer);
    this.layers.push(layer);
    if (selected) {
      layer.show();
    }

    return layer;
  }

  public addControls(
    tags: string[] = [],
    objectCategories: ObjectsControlOptions[] = []
  ): void {
    const settingsStore = LocalStorage.getStore(this.directory, "settings");
    const controls = new ControlDock(settingsStore);
    controls.addTo(this);

    // Search
    controls.addControl(
      new SearchControl(this.layers, (m, l) => this.focusOn(m, l))
    );

    // Filter
    this.filterControl = new FilterControl(this.layers, settingsStore);
    controls.addControl(this.filterControl, true);

    // Objects
    if (objectCategories.length > 0) {
      for (const cat of objectCategories) {
        cat.icon = `${import.meta.env.BASE_URL}${this.directory}/icons/${
          cat.icon
        }.png`;
        controls.addControl(
          new ObjectsControl(cat, settingsStore, (selectedObjects) =>
            this.layers.forEach((l) => l.updateSelectedObjects(selectedObjects))
          )
        );
      }
    }

    // Settings
    tags.push("Completed");
    this.settingsControl = new SettingsControl(
      this.wiki,
      settingsStore,
      this.layers,
      tags
    );
    controls.addControl(this.settingsControl);

    // Layers
    if (this.layers.length > 1) {
      this.layersControl = new LayersControl({
        layers: this.layers,
      });
      if (params.l != undefined) {
        this.layersControl.selectLayer(params.l);
      }
      this.layersControl.onLayerSelected((layer) =>
        this.updateUrlLayer(layer.layerName)
      );
      controls.addLayers(this.layersControl);
    }

    // Zoom
    const zoomControl = new ZoomControl({
      minZoom: this.getMinZoom(),
      maxZoom: this.getMaxZoom(),
      initialZoom: this.getZoom(),
      zoomIn: () => this.zoomIn(),
      zoomOut: () => this.zoomOut(),
    });
    controls.addZoom(zoomControl);
    this.on("zoomend zoomlevelschange", (_) => {
      zoomControl.setZoom(this.getZoom());
    });

    this.toastControl.addTo(this);
  }

  public addLegend(categories: ICategory[] = [], group?: string): void {
    for (const category of categories) {
      this.filterControl?.addCategory(category, group);
    }
  }

  public async initializeWikiConnector(): Promise<void> {
    await this.wiki.getLoggedInUser();
    if (this.settingsControl && this.wiki.user) {
      this.settingsControl.login(this.wiki.user.name);
    }

    // load marker completion from wiki into marker layers
    const completedMarkers = await this.wiki.getCompletedMarkers();
    for (let i = 0; i < completedMarkers.length; ++i) {
      for (const layer of this.layers) {
        const marker = layer.getMarkerById(completedMarkers[i]);
        if (marker) {
          marker.complete();
          break;
        }
      }
    }
  }

  // TODO move this whole function to MapLayer
  public addMarker(marker: ZDMarker, layer: MapLayer): void {
    marker.on("internallinkclicked", (event) => {
      console.log(event);
      this.navigateToMarkerById(<string>(<any>event).linkTarget);
    });
    if (params.m === marker.id || params.id === marker.id) {
      this.focusOn(marker, layer);
    }
    marker.handleZoom(this.getZoom());
  }

  public navigateToMarkerById(id: string): void {
    // TODO get (or set?) active layer
    for (const layer of this.layers) {
      const marker = layer.getMarkerById(id);
      if (marker) {
        this.focusOn(marker, layer);
        break;
      }
    }
  }

  public showNotification(message: string): void {
    this.toastControl.showNotification(message);
  }

  private focusOn(marker: ZDMarker, layer: MapLayer): void {
    this.filterControl?.reset();
    this.layersControl?.selectLayer(layer.layerName);
    this.setView(
      marker.getLatLng(),
      Math.max(marker.getMinZoom(), this.getZoom())
    );
    layer.openPopupWhenLoaded(marker);
  }

  private updateUrlLayer(layerName: string) {
    const url = new URL(window.location.toString());
    url.searchParams.set("l", layerName);
    url.searchParams.delete("m");
    url.searchParams.delete("id");
    history.pushState({}, "", url);
  }

  private updateUrl() {
    const url = new URL(window.location.toString());
    const zoom = this.getZoom();
    const center = this.getCenter();
    url.searchParams.set("z", `${zoom}`);
    url.searchParams.set("x", `${Math.floor(center.lat)}`);
    url.searchParams.set("y", `${Math.floor(center.lng)}`);
    url.searchParams.delete("m");
    url.searchParams.delete("id");
    history.pushState({}, "", url);
  }
}

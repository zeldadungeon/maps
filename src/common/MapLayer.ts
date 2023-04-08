import { LayerGroup } from "leaflet";
import { MarkerContainer } from "./MarkerContainer";
import { TileLayer } from "leaflet";
import { ZDMarker } from "./ZDMarker";

export class MapLayer {
  public tileLayer: TileLayer;
  public markerLayer: LayerGroup; // TODO add markers here instead of directly on the map, and add this to the map
  private tileMarkerContainers: MarkerContainer[][][] = [];

  public constructor(
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

    for (let z = 0; z <= maxZoom; ++z) {
      this.tileMarkerContainers[z] = [];
      for (let x = 0; x < Math.pow(2, z); ++x) {
        this.tileMarkerContainers[z][x] = [];
        for (let y = 0; y < Math.pow(2, z); ++y) {
          this.tileMarkerContainers[z][x][y] = MarkerContainer.create();
        }
      }
    }

    this.tileLayer.on("tileload", (e: L.LeafletEvent) => {
      const te = <L.TileEvent>e;
      this.tileMarkerContainers[te.coords.z][te.coords.x][te.coords.y].show();
    });
    this.tileLayer.on("tileunload", (e: L.LeafletEvent) => {
      const te = <L.TileEvent>e;
      this.tileMarkerContainers[te.coords.z][te.coords.x][te.coords.y].hide();
    });

    this.markerLayer = new LayerGroup();
  }

  public registerMarkerWithTiles(marker: ZDMarker, point: L.Point): void {
    for (let z = 0; z <= this.maxZoom; ++z) {
      const x = Math.floor((point.x * Math.pow(2, z)) / this.tileSize);
      const y = Math.floor((point.y * Math.pow(2, z)) / this.tileSize);
      this.tileMarkerContainers[z][x][y].addMarker(marker);
      marker.addToTileContainer(this.tileMarkerContainers[z][x][y]);
    }
  }

  public getMarkerById(id: string): ZDMarker {
    return this.tileMarkerContainers[0][0][0].getMarker(id);
  }

  public findMarkers(searchRegex: RegExp): ZDMarker[] {
    // [0][0][0] is the top-level/min-zoom/one-tile container that contains all markers
    return this.tileMarkerContainers[0][0][0].findMarkers(searchRegex);
  }
}

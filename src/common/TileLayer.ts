import * as L from "leaflet";
import { Marker } from "Marker";
import { MarkerContainer } from "common/MarkerContainer";

export class TileLayer extends L.TileLayer {
    private tileMarkerContainers: MarkerContainer[][][];
    private tileSize: number;
    private maxZoom: number;

    private constructor(urlTemplate: string, options?: L.TileLayerOptions) {
        super(urlTemplate, options);
    }

    public static create(mapid: string, tileSize: number, maxZoom: number, bounds: L.LatLngBounds): TileLayer {
        const tileLayer = new TileLayer(`https://www.zeldadungeon.net/maps/${mapid}/tiles/{z}/{x}_{y}.jpg`, {
            tileSize: tileSize,
            minZoom: 0,
            maxZoom: maxZoom,
            bounds: bounds,
            noWrap: true
        });

        tileLayer.tileSize = tileSize;
        tileLayer.maxZoom = maxZoom;

        tileLayer.tileMarkerContainers = [];
        for (let z = 0; z <= maxZoom; ++z) {
            tileLayer.tileMarkerContainers[z] = [];
            for (let x = 0; x < Math.pow(2, z); ++x) {
                tileLayer.tileMarkerContainers[z][x] = [];
                for (let y = 0; y < Math.pow(2, z); ++y) {
                    tileLayer.tileMarkerContainers[z][x][y] = MarkerContainer.create();
                }
            }
        }

        tileLayer.on("tileload", (e: L.TileEvent) => {
            tileLayer.tileMarkerContainers[(<any>e.coords).z][e.coords.x][e.coords.y].show();
        });
        tileLayer.on("tileunload", (e: L.TileEvent) => {
            tileLayer.tileMarkerContainers[(<any>e.coords).z][e.coords.x][e.coords.y].hide();
        });

        return tileLayer;
    }

    public registerMarkerWithTiles(marker: Marker, point: L.Point): void {
        for (let z = 0; z <= this.maxZoom; ++z) {
            const x = Math.floor(point.x * Math.pow(2, z) / this.tileSize);
            const y = Math.floor(point.y * Math.pow(2, z) / this.tileSize);
            this.tileMarkerContainers[z][x][y].addMarker(marker);
            marker.addToTileContainer(this.tileMarkerContainers[z][x][y]);
        }
    }

    public getMarkerById(id: string): Marker {
        return this.tileMarkerContainers[0][0][0].getMarker(id);
    }

    public findMarkers(searchRegex: RegExp): Marker[] {
        // [0][0][0] is the top-level/min-zoom/one-tile container that contains all markers
        return this.tileMarkerContainers[0][0][0].findMarkers(searchRegex);
    }
}
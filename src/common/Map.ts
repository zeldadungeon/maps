import * as L from "leaflet";
import * as ZDCRS from "common/ZDCRS";
import { Marker } from "Marker";
import { TileLayer } from "common/TileLayer";

export class Map extends L.Map {
    private tileLayer: TileLayer;

    private constructor(element: string | HTMLElement, options?: L.MapOptions) {
        super(element, options);
    }

    public static create(directory: string, mapSize: number, tileSize: number, options: L.MapOptions = {}): Map {
        const maxZoom = Math.log(mapSize / tileSize) * Math.LOG2E;
        const crs = ZDCRS.create(mapSize, tileSize);
        const bounds = L.latLngBounds(
            crs.pointToLatLng(L.point(0, mapSize), maxZoom),
            crs.pointToLatLng(L.point(mapSize, 0), maxZoom));
        const tileLayer = TileLayer.create(
            `https://www.zeldadungeon.net/maps/${directory}/tiles/{z}/{x}_{y}.jpg`,
            tileSize,
            maxZoom,
            bounds);

        if (options.zoom == undefined) { options.zoom = maxZoom - 2; }
        options.crs = crs;
        options.maxBounds = bounds.pad(0.5);
        options.layers = [tileLayer];

        const map = new Map("map", options);
        map.tileLayer = tileLayer;

        return map;
    }

    public registerMarkerWithTiles(marker: Marker): void {
        this.tileLayer.registerMarkerWithTiles(marker, this.project(marker.getLatLng(), 0));
    }
}
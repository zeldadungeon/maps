import * as L from "leaflet";
import * as Schema from "JSONSchema";
import { Map } from "Map";
import { Marker } from "common/Marker";

export class Layer extends L.LayerGroup {
    public icon: L.Icon;

    private minZoom = 0;
    private maxZoom = Number.MAX_VALUE;
    private markers: Marker[];

    private constructor() {
        super();
    }

    public static fromJSON(json: Schema.Layer): Layer {
        const layer = new Layer();
        if (json.icon) {
            layer.icon = L.icon({
                iconUrl: `markers/${json.icon.url}`,
                iconSize: [json.icon.width, json.icon.height]
            });
        }

        if (json.minZoom != undefined) { layer.minZoom = json.minZoom; }
        if (json.maxZoom != undefined) { layer.maxZoom = json.maxZoom; }

        layer.markers = json.markers.map(m => Marker.fromJSON(m, layer));

        return layer;
    }

    public addToMap(map: Map): void {
        this.updateVisibility(map);
        map.on("zoom", e => this.updateVisibility(map));

        this.markers.forEach(m => map.registerMarkerWithTiles(m));
    }

    private updateVisibility(map: Map): void {
        const zoom = map.getZoom();
        if (zoom >= this.minZoom && zoom <= this.maxZoom) {
            this.addTo(map);
        } else {
            this.removeFrom(map);
        }
    }
}
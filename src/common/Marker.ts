import * as L from "leaflet";
import * as Schema from "JSONSchema";
import { Layer } from "Layer";
import { MarkerContainer } from "MarkerContainer";

export class Marker extends L.Marker {
    public id: string;
    private name: string;
    private layer: Layer;
    private tileContainers = <MarkerContainer[]>[];
    private containers = <MarkerContainer[]>[];

    private constructor(id: string, name: string, coords: L.LatLngExpression, icon: L.Icon) {
        super(coords, {
            title: name,
            icon: icon
        });
        this.id = id;
        this.name = name;
    }

    public static fromJSON(json: Schema.Marker, layer: Layer): Marker {
        const icon = layer.icon;
        const marker = new Marker(json.id, json.name, json.coords, icon);
        marker.layer = layer;

        return marker;
    }

    public addToTileContainer(container: MarkerContainer): void {
        this.tileContainers.push(container);
        this.updateVisibility();
    }

    public updateVisibility(): void {
        if (this.layer && this.tileContainers.some(c => c.isVisible()) && this.containers.every(c => c.isVisible())) {
            this.addTo(this.layer);
        } else if (this.layer) {
            this.layer.removeLayer(this); // removeFrom only takes Map for some reason?
        }
    }
}
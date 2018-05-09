import * as L from "leaflet";
import * as Schema from "JSONSchema";
import { Category } from "Category";
import { MarkerContainer } from "MarkerContainer";

export class Marker extends L.Marker {
    public id: string;
    private name: string;
    private category: Category;
    private tileContainers = <MarkerContainer[]>[];
    private containers = <MarkerContainer[]>[];

    private constructor(id: string, name: string, coords: L.LatLngExpression) {
        super(coords, {
            title: name
        });
        this.id = id;
        this.name = name;
    }

    public static fromJSON(json: Schema.Marker): Marker {
        return new Marker(json.id, name, json.coords);
        // TODO handle link etc
    }

    public addToCategory(category: Category): void {
        if (this.category) {
            this.category.removeLayer(this);
        }
        this.category = category;
        this.updateVisibility();
    }

    public addToTileContainer(container: MarkerContainer): void {
        this.tileContainers.push(container);
        this.updateVisibility();
    }

    public updateVisibility(): void {
        if (this.category && this.tileContainers.some(c => c.isVisible()) && this.containers.every(c => c.isVisible())) {
            this.addTo(this.category);
        } else if (this.category) {
            this.category.removeLayer(this); // removeFrom only takes Map for some reason?
        }
    }
}
import * as L from "leaflet";
import * as Schema from "JSONSchema";

export class Category extends L.LayerGroup {
    public name: string;
    public icons: L.Icon[];

    private minZoom = 0;
    private maxZoom = Number.MAX_VALUE;
    private infoSource: string;

    private constructor() {
        super();
    }

    public static fromJSON(json: Schema.Category): Category {
        const category = new Category();
        category.name = json.name;
        category.icons = json.icons.map(i => L.icon({
            iconUrl: `markers/${i.url}`,
            iconSize: [i.width, i.height]
        }));
        if (json.minZoom != undefined) { category.minZoom = json.minZoom; }
        if (json.maxZoom != undefined) { category.maxZoom = json.maxZoom; }
        category.infoSource = json.source;

        return category;
    }

    public shouldBeVisible(zoom: number): boolean {
        return zoom >= this.minZoom && zoom <= this.maxZoom;
    }
}
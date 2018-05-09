import * as L from "leaflet";
import * as Schema from "JSONSchema";

export class Category extends L.LayerGroup {
    public name: string;

    private infoSource: string;

    private constructor() {
        super();
    }

    public static fromJSON(json: Schema.Category): Category {
        const category = new Category();
        category.name = json.name;
        category.infoSource = json.source;

        return category;
    }
}
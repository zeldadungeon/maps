import * as Schema from "JSONSchema";
import { Layer } from "common/Layer";
import { Map } from "Map";

export class Category {
    private name: string;
    private layers: Layer[];
    private infoSource: string;

    private constructor() {}

    public static fromJSON(json: Schema.Category): Category {
        const category = new Category();
        category.name = json.name;
        category.infoSource = json.source;
        category.layers = json.layers.map(l => Layer.fromJSON(l));

        return category;
    }

    public addToMap(map: Map): void {
        this.layers.forEach(l => l.addToMap(map));
    }
}
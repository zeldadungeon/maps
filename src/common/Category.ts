import * as Schema from "JSONSchema";
import { Layer } from "common/Layer";
import { Map } from "Map";

export class Category {
    public name: string;
    public displayOrder: number | undefined;
    public displayOrderLarge: number | undefined;
    private layers: Layer[];

    private constructor() {}

    public static fromJSON(json: Schema.Category): Category {
        const category = new Category();
        category.name = json.name;
        category.displayOrder = json.displayOrder;
        category.displayOrderLarge = json.displayOrderLarge;
        category.layers = json.layers.map(l => Layer.fromJSON(l, json.source));

        return category;
    }

    public addToMap(map: Map): void {
        this.layers.forEach(l => l.addToMap(map));
    }

    public getIconUrl(): string {
        return this.layers[0].icon.options.iconUrl;
    }

    public getIconWidth(): number {
        return (<L.PointTuple>this.layers[0].icon.options.iconSize)[0];
    }

    public forceShow(): void {
        this.layers.forEach(l => l.forceShow());
    }

    public forceHide(): void {
        this.layers.forEach(l => l.forceHide());
    }

    public resetVisibility(): void {
        this.layers.forEach(l => l.resetVisibility());
    }
}
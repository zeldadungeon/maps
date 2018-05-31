import * as Schema from "JSONSchema";
import { Layer } from "common/Layer";
import { Map } from "Map";

export class Category {
    public name: string;
    public displayOrder: number | undefined;
    private layers: Layer[];

    private constructor() {}

    public static fromJSON(json: Schema.Category): Category {
        const category = new Category();
        category.name = json.name;
        category.displayOrder = json.displayOrder;
        category.layers = json.layers.map(l => Layer.fromJSON(l, json.source));

        return category;
    }

    public addToMap(map: Map): void {
        this.layers.forEach(l => l.addToMap(map));
    }

    public getIconUrl(): string {
        return this.layers[0].getIconUrl();
    }

    public getIconWidth(): number {
        return this.layers[0].getIconWidth();
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
import * as Schema from "./JSONSchema";
import { Layer } from "./Layer";

export class Category {
  public name: string;
  public displayOrder: number | undefined;
  public layers: Layer[];

  private constructor(json: Schema.Category, directory: string) {
    this.name = json.name;
    this.displayOrder = json.displayOrder;
    this.layers = json.layers.map((l) =>
      Layer.fromJSON(l, json.source, directory)
    );
  }

  public static fromJSON(json: Schema.Category, directory: string): Category {
    return new Category(json, directory);
  }

  public getIconUrl(): string {
    return this.layers[0].getIconUrl();
  }

  public getIconWidth(): number {
    return this.layers[0].getIconWidth();
  }
}

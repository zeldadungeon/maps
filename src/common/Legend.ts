import * as L from "leaflet";
import { Category } from "common/Category";

export class Legend extends L.Control {
    private container: HTMLElement;
    private categoryList: HTMLElement;

    private constructor(options: L.ControlOptions) {
        super(options);
        this.container = L.DomUtil.create("div", "zd-control zd-legend");
        // TODO "Legend" title?
        // TODO All/None buttons
        this.categoryList = L.DomUtil.create("ul", "zd-legend__categories", this.container);
        L.DomEvent.disableClickPropagation(this.container);
        // TODO test below on mobile
        //if (!L.Browser.touch) {
        L.DomEvent.disableScrollPropagation(this.container);
        //}
    }

    public static create(options: L.ControlOptions): Legend {
        return new Legend(options);
    }

    public onAdd(map: L.Map): HTMLElement {
        return this.container;
    }

    public onRemove(map: L.Map): void {
        // doesn't happen
    }

    public addCategory(category: Category, position: number): void {
        // make it
        const li = L.DomUtil.create("li", "zd-legend__category");
        li.setAttribute("data-position", `${position}`);
        li.innerText = category.name;
        li.style.background = `url(${category.getIconUrl()}) ${(50 - category.getIconWidth()) / 2}px center no-repeat`;

        // activate it
        // TODO handler
        L.DomEvent.addListener(li, "click", () => {
            console.log(`Clicked ${category.name}`);
        });

        // insert it
        const children = this.categoryList.children;
        let index = 0;
        while (index < children.length &&
            position >= Number(children[index].getAttribute("data-position"))) {
            index++;
        }
        if (index >= children.length) {
            this.categoryList.appendChild(li);
        } else {
            this.categoryList.insertBefore(li, children[index]);
        }
    }
}
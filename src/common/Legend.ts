import * as L from "leaflet";
import { Category } from "common/Category";

interface LegendItem {
    category: Category;
    li: HTMLElement;
}

export class Legend extends L.Control {
    private container: HTMLElement;
    private categoryList: HTMLElement;
    private all: HTMLElement;
    private none: HTMLElement;
    private categories = <LegendItem[]>[];

    private constructor(options: L.ControlOptions) {
        super(options);

        this.container = L.DomUtil.create("div", "zd-control zd-legend");
        L.DomEvent.disableClickPropagation(this.container);
        L.DomEvent.disableScrollPropagation(this.container);

        this.categoryList = L.DomUtil.create("ul", "zd-legend__categories", this.container);
        const allNone = L.DomUtil.create("li", "", this.categoryList);
        this.all = L.DomUtil.create("div", "zd-legend__all selectable selected", allNone);
        this.all.innerText = "All";
        this.none = L.DomUtil.create("div", "zd-legend__none selectable", allNone);
        this.none.innerText = "None";

        L.DomEvent.addListener(this.all, "click", () => {
            if (!L.DomUtil.hasClass(this.all, "selected")) {
                L.DomUtil.addClass(this.all, "selected");
                L.DomUtil.removeClass(this.none, "selected");
                this.categories.forEach(c => {
                    L.DomUtil.removeClass(c.li, "selected");
                    c.category.resetVisibility();
                });
            }
        });

        L.DomEvent.addListener(this.none, "click", () => {
            if (!L.DomUtil.hasClass(this.none, "selected")) {
                L.DomUtil.addClass(this.none, "selected");
                L.DomUtil.removeClass(this.all, "selected");
                this.categories.forEach(c => {
                    L.DomUtil.removeClass(c.li, "selected");
                    c.category.forceHide();
                });
            }
        });
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
        const li = L.DomUtil.create("li", "zd-legend__category selectable");
        li.setAttribute("data-position", `${position}`);
        li.innerText = category.name;
        li.style.backgroundImage = `url(${category.getIconUrl()})`;
        li.style.backgroundPosition = `${(50 - category.getIconWidth()) / 2}px center`;
        this.categories.push({ category, li });

        // activate it
        L.DomEvent.addListener(li, "click", () => {
            if (L.DomUtil.hasClass(li, "selected")) {
                L.DomUtil.removeClass(li, "selected");
                category.forceHide();

                // select "None" if no others are selected
                if (this.categories.every(c => !L.DomUtil.hasClass(c.li, "selected"))) {
                    L.DomUtil.addClass(this.none, "selected");
                }
            } else {
                L.DomUtil.addClass(li, "selected");
                category.forceShow();

                // hide the others
                if (L.DomUtil.hasClass(this.all, "selected")) {
                    L.DomUtil.removeClass(this.all, "selected");
                    this.categories.forEach(c => {
                        if (!L.DomUtil.hasClass(c.li, "selected")) {
                            c.category.forceHide();
                        }
                    });
                }
                L.DomUtil.removeClass(this.none, "selected");
            }
        });

        // insert it
        const children = this.categoryList.children;
        let index = 1;
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

    public reset(): void {
        this.all.click();
    }
}
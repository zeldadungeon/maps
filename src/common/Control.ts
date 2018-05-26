import * as L from "leaflet";

type OnOpenHandler = () => void;

const OPEN_CLASS = "zd-control__content--open";

export interface Options extends L.ControlOptions {
    icon: string;
}

export class Control extends L.Control {
    private container: HTMLElement;
    private content: HTMLElement;
    private onOpenHandlers = <OnOpenHandler[]>[];

    private constructor(options: Options) {
        super(options);

        this.container = L.DomUtil.create("div", "zd-control");

        const button = L.DomUtil.create("div", "zd-control__button", this.container);
        L.DomUtil.create("i", `fa fa-${options.icon}`, button);
        L.DomEvent.disableClickPropagation(button);
        // TODO test below on mobile
        //if (!L.Browser.touch) {
        L.DomEvent.disableScrollPropagation(button);
        //}

        this.content = L.DomUtil.create("div", "zd-control__content", this.container);
        L.DomEvent.disableClickPropagation(this.content);
        // TODO test below on mobile
        //if (!L.Browser.touch) {
        L.DomEvent.disableScrollPropagation(this.content);
        //}
        this.content.innerText = "TODO"; // TODO

        L.DomEvent.addListener(button, "click", () => L.DomUtil.hasClass(this.content, OPEN_CLASS) ? this.close() : this.open());
    }

    public static create(options: Options): Control {
        options.position = "topleft"; // only topleft is supported for now

        return new Control(options);
    }

    public onAdd(map: L.Map): HTMLElement {
        return this.container;
    }

    public onRemove(map: L.Map): void {
        // doesn't happen
    }

    public onOpen(handler: OnOpenHandler): void {
        this.onOpenHandlers.push(handler);
    }

    public open(): void {
        this.onOpenHandlers.forEach(h => h());
        L.DomUtil.addClass(this.content, OPEN_CLASS);
    }

    public close(): void {
        L.DomUtil.removeClass(this.content, OPEN_CLASS);
    }
}
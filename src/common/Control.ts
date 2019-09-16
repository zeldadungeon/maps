import * as L from "leaflet";

type EventHandler = () => void;

const OPEN_CLASS = "zd-control__content--open";

export interface Options extends L.ControlOptions {
    icon: string;
    content: HTMLElement;
}

/**
 * Control box with togglable visibility
 */
export class Control extends L.Control {
    private container: HTMLElement;
    private content: HTMLElement;
    private onOpenHandlers = <EventHandler[]>[];
    private onClosedHandlers = <EventHandler[]>[];

    private constructor(options: Options) {
        super(options);

        this.container = L.DomUtil.create("div", "zd-control");

        const button = L.DomUtil.create("div", "zd-control__button", this.container);
        L.DomUtil.create("i", `fa fa-${options.icon}`, button);
        L.DomEvent.disableClickPropagation(button);
        if (!L.Browser.touch) {
            L.DomEvent.disableScrollPropagation(button);
        }

        this.content = L.DomUtil.create("div", "zd-control__content", this.container);
        L.DomEvent.disableClickPropagation(this.content);
        if (!L.Browser.touch) {
            L.DomEvent.disableScrollPropagation(this.content);
        }
        this.content.appendChild(options.content);

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

    public onOpen(handler: EventHandler): void {
        this.onOpenHandlers.push(handler);
    }

    public onClosed(handler: EventHandler): void {
        this.onClosedHandlers.push(handler);
    }

    public open(): void {
        this.onOpenHandlers.forEach(h => h());
        L.DomUtil.addClass(this.content, OPEN_CLASS);
    }

    public close(): void {
        this.onClosedHandlers.forEach(h => h());
        L.DomUtil.removeClass(this.content, OPEN_CLASS);
    }
}
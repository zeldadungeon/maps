import { Browser, Control, DomEvent, DomUtil } from "leaflet";

type EventHandler = () => void;

const OPEN_CLASS = "zd-control__content--open";

export interface Options extends L.ControlOptions {
  icon: string;
  title: string;
  content: HTMLElement;
}

/**
 * Control box with togglable visibility
 */
export class ZDControl extends Control {
  private container: HTMLElement;
  protected content: HTMLElement;
  private onOpenHandlers = <EventHandler[]>[];
  private onClosedHandlers = <EventHandler[]>[];

  public constructor(options: Options) {
    super({ ...options, position: "topleft" });

    this.container = DomUtil.create("div", "zd-control");

    const button = DomUtil.create("div", "zd-control__button", this.container);
    if (options.icon.startsWith("fa-")) {
      DomUtil.create("i", `fa ${options.icon}`, button);
    } else {
      button.style.backgroundImage = `url('${options.icon}')`;
      button.style.backgroundSize = "contain";
      button.style.backgroundRepeat = "no-repeat";
    }
    button.title = options.title;
    DomEvent.disableClickPropagation(button);
    if (!Browser.touch) {
      DomEvent.disableScrollPropagation(button);
    }

    this.content = DomUtil.create("div", "zd-control__content", this.container);
    DomEvent.disableClickPropagation(this.content);
    DomEvent.disableScrollPropagation(this.content);
    this.content.appendChild(options.content);

    DomEvent.addListener(button, "click", () =>
      DomUtil.hasClass(this.content, OPEN_CLASS) ? this.close() : this.open()
    );
  }

  public onAdd(_map: L.Map): HTMLElement {
    return this.container;
  }

  public onRemove(_map: L.Map): void {
    // doesn't happen
  }

  public onOpen(handler: EventHandler): void {
    this.onOpenHandlers.push(handler);
  }

  public onClosed(handler: EventHandler): void {
    this.onClosedHandlers.push(handler);
  }

  public open(): void {
    this.onOpenHandlers.forEach((h) => h());
    DomUtil.addClass(this.content, OPEN_CLASS);
  }

  public close(): void {
    this.onClosedHandlers.forEach((h) => h());
    DomUtil.removeClass(this.content, OPEN_CLASS);
  }
}

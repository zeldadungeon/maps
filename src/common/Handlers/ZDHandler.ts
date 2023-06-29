// inspired by Leaflet's Handler, but using a TypeScipt-friendly ES6 class
export abstract class ZDHandler {
  private _enabled: boolean;
  abstract name: string;
  constructor() {
    this._enabled = false;
  }
  enable() {
    if (this._enabled) {
      return this;
    }

    this._enabled = true;
    this.addHooks();
    return this;
  }

  disable() {
    if (!this._enabled) {
      return this;
    }

    this._enabled = false;
    this.removeHooks();
    return this;
  }

  abstract addHooks(): void;

  abstract removeHooks(): void;
}

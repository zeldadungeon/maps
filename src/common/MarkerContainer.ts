import { ZDMarker } from "common/ZDMarker";

export class MarkerContainer {
  private markers = <{ [key: string]: ZDMarker }>{};
  private visible = false;

  public addMarker(marker: ZDMarker): void {
    this.markers[marker.id] = marker;
  }

  public removeMarker(marker: ZDMarker): void {
    delete this.markers[marker.id];
  }

  public clear(): void {
    const keys = Object.keys(this.markers);
    for (let i = 0; i < keys.length; ++i) {
      const marker = this.markers[keys[i]];
      marker.clearCompletion();
      this.removeMarker(marker);
    }
  }

  public show(): void {
    this.visible = true;
  }

  public hide(): void {
    this.visible = false;
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public getMarker(id: string): ZDMarker {
    return this.markers[id];
  }

  public getMarkers(): ZDMarker[] {
    return Object.values(this.markers);
  }

  public findMarkers(searchRegex: RegExp): ZDMarker[] {
    return this.getMarkers().filter((m) => searchRegex.test(m.name));
  }
}

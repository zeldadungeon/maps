import { Marker } from "common/Marker";

export class MarkerContainer {
    private markers = <{[key: string]: Marker }>{};
    private visible = false;

    private constructor() {}

    public static create(): MarkerContainer {
        return new MarkerContainer();
    }

    public addMarker(marker: Marker): void {
        this.markers[marker.id] = marker;
    }

    public removeMarker(marker: Marker): void {
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
        Object.keys(this.markers).forEach(m => this.markers[m].updateVisibility());
    }

    public hide(): void {
        this.visible = false;
        Object.keys(this.markers).forEach(m => this.markers[m].updateVisibility());
    }

    public isVisible(): boolean {
        return this.visible;
    }

    public getMarker(id: string): Marker {
        return this.markers[id];
    }

    public findMarkers(searchRegex: RegExp): Marker[] {
        return Object.keys(this.markers)
            .map(k => this.markers[k])
            .filter(m => searchRegex.test(m.name));
    }
}
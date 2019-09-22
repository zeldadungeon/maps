import { Dialog } from "./Dialog";
import { LocalStorage } from "./LocalStorage";

const LOCAL = location.hostname === "localhost";

export interface User {
    id: number;
    name: string;
}

interface UserInfoResponse {
    query: {
        userinfo: User;
    };
}

interface CompletionResponse {
    query: {
        map_userdata: {
            completed: string;
        };
    };
}

interface TokenResponse {
    query: {
        tokens: {
            csrftoken: "d5a24d2c2d9e8214cd3aec87e7c494db5d7e58e4+\\";
        };
    };
}

interface ErrorResponse {
    error: {
        code: string;
        info: string;
    };
}

function responseIsError(response: any): response is ErrorResponse {
    return response && response.error && response.error.code != undefined; // tslint:disable-line no-unsafe-any
}

/**
 * Wiki connector for storing user data
 */
export class WikiConnector {
    public user: User;
    private csrf: string;
    private completionStore: LocalStorage;
    private offline = false;

    constructor(private mapid: string, private dialog: Dialog) {
        this.completionStore = LocalStorage.getStore(mapid, "completion");
    }

    public async getLoggedInUser(): Promise<void> {
        const response = await this.callApi<UserInfoResponse>("action=query&meta=userinfo");
        if (response.query.userinfo.id !== 0) {
            this.user = response.query.userinfo;
        }
    }

    // TODO find a better way of returning the user to the right map after logging into the wiki
    public login(): void {
        location.href = `https://www.zeldadungeon.net/wiki/index.php?title=Special:UserLogin&returnto=Zelda+Dungeon%3A${
            (<{[key: string]: string}>{
                la: "Link%27s+Awakening",
                botw: "Breath+of+the+Wild"
            })[this.mapid]
        }+Map`;
    }

    public async logout(): Promise<void> {
        await this.postWithRetry("action=logout");
        location.reload();
    }

    public async getCompletedMarkers(): Promise<string[]> {
        const localCompletion = this.completionStore.getAllKeys().filter(k => this.completionStore.getItem(k) === true);

        if (!this.user) {
            // not logged in, use local for now, will prompt for login if they try to mark
            return localCompletion;
        }

        const wikiCompletionResponse = (await this.callApi<CompletionResponse>(`action=query&list=map_userdata&zdm_map=${this.mapid}`))
            .query.map_userdata.completed;
        let wikiCompletion = wikiCompletionResponse ? wikiCompletionResponse.split(",") : [];

        if (localCompletion.length > 0 && wikiCompletion.length > 0) {
            const actionReplace = "Replace account data with local data";
            const actionMerge = "Merge data to account";
            const actionDelete = "Delete local data";
            const actionLogout = "Logout and keep local data";
            const localSingle = localCompletion.length === 1;
            const wikiSingle = wikiCompletion.length === 1;
            const action = await this.dialog.showDialog(
                `This device has ${localCompletion.length} completed marker${localSingle ? "" : "s"}, but your account already has ${wikiCompletion.length} completed marker${wikiSingle ? "" : "s"}. What would you like to do with the local data? If you choose to logout, you can login anytime from the settings menu on the left.`,
                [actionReplace, actionMerge, actionDelete, actionLogout]);

            if (action === actionLogout) {
                await this.logout();

                return [];
            }

            if (action === actionReplace) {
                wikiCompletion = localCompletion;
            }

            if (action === actionMerge) {
                const merged = <{[key: string]: boolean}>{};
                for (let i = 0; i < localCompletion.length; ++i) {
                    merged[localCompletion[i]] = true;
                }
                for (let i = 0; i < wikiCompletion.length; ++i) {
                    merged[wikiCompletion[i]] = true;
                }

                wikiCompletion = Object.keys(merged);
            }

            if (action === actionReplace || action === actionMerge) {
                await this.setCompletion(wikiCompletion);

            }

            this.completionStore.clear();

            return wikiCompletion;
        } else if (localCompletion.length > 0) {
            const actionReplace = "Upload to account";
            const actionLogout = "Logout and keep local data";
            const single = localCompletion.length === 1;
            const action = await this.dialog.showDialog(
                `This device has ${localCompletion.length} completed marker${single ? "" : "s"}. Would you like to upload ${single ? "it" : "them"} to your account? If you choose to logout, you can login anytime from the settings menu on the left.`,
                [actionReplace, actionLogout]);

            if (action === actionLogout) {
                await this.logout();

                return [];
            }

            await this.setCompletion(localCompletion);

            return localCompletion;
        } else {
            return wikiCompletion;
        }
    }

    public async complete(marker: string): Promise<void> {
        if (this.user) {
            return this.postWithRetry(`action=map_complete&map=${this.mapid}&marker=${marker}`);
        }

        if (!this.offline) {
            const actionLogin = "Login";
            const actionContinue = "Continue without logging in";
            const action = await this.dialog.showDialog(
                `Logging into your Zelda Dungeon Wiki account allows you to access your completion data from any device. If you choose not to login now, you can login anytime from the settings menu on the left.`,
                [actionLogin, actionContinue]);
            if (action === actionLogin) {
                this.login();

                return;
            }
            this.offline = true;
        }

        this.completionStore.setItem(marker, true);
    }

    public async uncomplete(marker: string): Promise<void> {
        if (this.user) {
            return this.postWithRetry(`action=map_uncomplete&map=${this.mapid}&marker=${marker}`);
        } else {
            this.completionStore.setItem(marker, false);
        }
    }

    public async clearCompletion(): Promise<void> {
        this.completionStore.clear();
        if (this.user) {
            await this.setCompletion([]);
        }
    }

    public async setCompletion(markers: string[]): Promise<void> {
        return this.postWithRetry(`action=map_setcompletion&map=${this.mapid}&markers=${markers.join(",")}`);
    }

    public async query<ResponseType>(query: string): Promise<ResponseType> {
        return this.callApi<ResponseType>(query);
    }

    private async postWithRetry<ResponseType>(query: string): Promise<void> {
        if (this.csrf) {
            const response1 = await this.post<ResponseType>(query);
            if (!responseIsError(response1)) {
                return;
            }

            if (response1.error.code !== "badtoken") {
                throw response1;
            }
        }

        await this.getToken();
        const response2 = await this.post<ResponseType>(query);
        if (responseIsError(response2)) {
            throw response2;
        }
    }

    private async post<ResponseType>(query: string): Promise<ResponseType | ErrorResponse> {
        return this.callApi<ResponseType | ErrorResponse>(query, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `token=${encodeURIComponent(this.csrf)}`
        });
    }

    private async callApi<T>(query: string, settings?: RequestInit): Promise<T> {
        let endpoint = `/wiki/api.php?format=json&${query}`;
        if (LOCAL) {
            endpoint = `https://www.zeldadungeon.net${endpoint}&origin=http://localhost:8080`;
        }

        const response = await fetch(endpoint, {
            credentials: LOCAL ? "include" : "same-origin",
            ...settings
        });

        return response.json();
    }

    private async getToken(): Promise<void> {
        const response = await this.callApi<TokenResponse>("action=query&meta=tokens&type=csrf");
        this.csrf = response.query.tokens.csrftoken;
    }
    /*

scenarios:

load page
get userinfo
    there:
        store it
        get map data and store it
        get csrf token and store it for later
    not there (userid 0):
        set some flag? will prompt for login when they try to mark something

mark completed
    logged in:
        try using existing csrf token to save
            if that fails, get and store a new token, then try again
    not logged in:
        prompt to log in (how to redirect back to map? or login in new tab/window then force refresh)

    */
}
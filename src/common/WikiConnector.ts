import { LocalStorage } from "./LocalStorage";

const LOCAL =
  location.hostname === "localhost" || location.hostname === "127.0.0.1";

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
      csrftoken: string;
    };
  };
}

interface ParseResponse {
  parse: {
    text: {
      ["*"]: string;
    };
  };
}

interface PagePropsQueryReponse {
  query: {
    pages: {
      [pageId: string]: {
        pageprops: {
          description: string;
        };
      };
    };
  };
}

interface ErrorResponse {
  error: {
    code: string;
    info: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- by design of type guard
function responseIsError(response: any): response is ErrorResponse {
  return response && response.error && response.error.code != undefined;
}

/**
 * Wiki connector for storing user data
 */
export class WikiConnector {
  public user?: User;
  private csrf?: string;
  private completionStore: LocalStorage;
  private offline = false;

  constructor(
    private mapid: string,
    private gameTitle: string,
    private showDialog: (prompt: string, actions: string[]) => Promise<string>,
    private showNotification: (message: string) => void
  ) {
    this.completionStore = LocalStorage.getStore(mapid, "completion");
  }

  public async getPageContent(pageTitle: string): Promise<string> {
    const response = await this.query<ParseResponse | ErrorResponse>(
      `action=parse&page=${encodeURIComponent(pageTitle)}`
    );

    if (responseIsError(response)) {
      throw response.error.code;
    }

    return response?.parse?.text["*"] || "";
  }

  public async getMapPageContent(subpage: string): Promise<string> {
    return await this.getPageContent(`Map:${this.gameTitle}/${subpage}`);
  }

  public async getPageSummary(pageTitle: string): Promise<string> {
    const response = await this.query<PagePropsQueryReponse>(
      `action=query&prop=pageprops&titles=${encodeURIComponent(pageTitle)}`
    );

    const pageId = Object.keys(response.query.pages)[0];
    const page = response.query.pages[pageId];
    return pageId === "-1" || !page.pageprops || !page.pageprops.description
      ? ""
      : `<p>${page.pageprops.description}</p>`;
  }

  public getEditLink(pageTitle: string): string {
    return `/wiki/index.php?action=edit&title=${encodeURIComponent(pageTitle)}`;
  }

  public getMapEditLink(subpage: string): string {
    return this.getEditLink(`Map:${this.gameTitle}/${subpage}`);
  }

  public async getLoggedInUser(): Promise<void> {
    const response = await this.callApi<UserInfoResponse>(
      "action=query&meta=userinfo"
    );
    if (response.query.userinfo.id !== 0) {
      this.user = response.query.userinfo;
    }
  }

  // TODO find a better way of returning the user to the right map after logging into the wiki
  public login(): void {
    location.href = `https://www.zeldadungeon.net/wiki/index.php?title=Special:UserLogin&returnto=Zelda+Dungeon%3A${
      (<{ [key: string]: string }>{
        la: "Link%27s+Awakening",
        botw: "Breath+of+the+Wild",
        totk: "Tears+of+the+Kingdom",
      })[this.mapid]
    }+Map`;
  }

  public async logout(): Promise<void> {
    await this.postWithRetry("action=logout");
    location.reload();
  }

  public async getCompletedMarkers(): Promise<string[]> {
    const localCompletion = this.completionStore
      .getAllKeys()
      .filter((k) => this.completionStore.getItem<boolean>(k) === true);

    if (!this.user) {
      // not logged in, use local for now, will prompt for login if they try to mark
      return localCompletion;
    }

    const wikiCompletionResponse = (
      await this.callApi<CompletionResponse>(
        `action=query&list=map_userdata&zdm_map=${this.mapid}`
      )
    ).query.map_userdata.completed;
    let wikiCompletion = wikiCompletionResponse
      ? wikiCompletionResponse.split(",").map((m) => m.replace("%2C", ","))
      : [];

    if (localCompletion.length > 0 && wikiCompletion.length > 0) {
      const actionReplace = "Replace account data with local data";
      const actionMerge = "Merge data to account";
      const actionDelete = "Delete local data";
      const actionLogout = "Logout and keep local data";
      const localSingle = localCompletion.length === 1;
      const wikiSingle = wikiCompletion.length === 1;
      const action = await this.showDialog(
        `This device has ${localCompletion.length} completed marker${
          localSingle ? "" : "s"
        }, \
                but your account already has ${
                  wikiCompletion.length
                } completed marker${wikiSingle ? "" : "s"}. \
                What would you like to do with the local data? If you choose to logout, \
                you can login anytime from the settings menu on the left.`,
        [actionReplace, actionMerge, actionDelete, actionLogout]
      );

      if (action === actionLogout) {
        await this.logout();

        return [];
      }

      if (action === actionReplace) {
        wikiCompletion = localCompletion;
      }

      if (action === actionMerge) {
        const merged = <{ [key: string]: boolean }>{};
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
      const action = await this.showDialog(
        `This device has ${localCompletion.length} completed marker${
          single ? "" : "s"
        }. \
                Would you like to upload ${
                  single ? "it" : "them"
                } to your account? \
                If you choose to logout, you can login anytime from the settings menu on the left.`,
        [actionReplace, actionLogout]
      );

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
    marker = marker.replace(",", "%252C");
    if (this.user) {
      return this.postWithRetry(
        `action=map_complete&map=${this.mapid}&marker=${marker}`
      );
    }

    if (!this.offline) {
      const actionLogin = "Login";
      const actionContinue = "Continue without logging in";
      const action = await this.showDialog(
        `Logging into your Zelda Dungeon Wiki account allows you to access your completion data from any device. \
                If you choose not to login now, you can login anytime from the settings menu on the left.`,
        [actionLogin, actionContinue]
      );
      if (action === actionLogin) {
        this.login();

        return;
      }
      this.offline = true;
    }

    this.completionStore.setItem(marker, true);
  }

  public async uncomplete(marker: string): Promise<void> {
    marker = marker.replace(",", "%252C");
    if (this.user) {
      return this.postWithRetry(
        `action=map_uncomplete&map=${this.mapid}&marker=${marker}`
      );
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
    return this.postWithRetry(
      `action=map_setcompletion&map=${this.mapid}`,
      `markers=${
        markers.map((m) => m.replace(",", "%252C")).join(",") || "clear"
      }`
    );
  }

  public async query<ResponseType>(query: string): Promise<ResponseType> {
    return this.callApi<ResponseType>(query);
  }

  private async postWithRetry<ResponseType>(
    query: string,
    body: string | undefined = undefined
  ): Promise<void> {
    try {
      if (this.csrf) {
        const response1 = await this.post<ResponseType>(query, body);
        if (!responseIsError(response1)) {
          return;
        }

        if (response1.error.code !== "badtoken") {
          if (response1.error.code === "readonly") {
            this.showDialog(
              "Your completion was not saved because the database is currently in read-only mode while we perform a migration to prepare for increased usage. Please try again later.",
              ["Ok"]
            );
          }
          throw response1;
        }
      }

      await this.getToken();
      const response2 = await this.post<ResponseType>(query, body);
      if (responseIsError(response2)) {
        if (response2.error.code === "readonly") {
          this.showDialog(
            "Your completion was not saved because the database is currently in read-only mode while we perform a migration to prepare for increased usage. Please try again later.",
            ["Ok"]
          );
        }
        throw response2;
      }
    } catch (ex) {
      this.showNotification(
        "An error occurred while saving completion information. Please refresh the page, ensure you are logged in, and try again."
      );
      throw ex;
    }
  }

  private async post<ResponseType>(
    query: string,
    body: string | undefined = undefined
  ): Promise<ResponseType | ErrorResponse> {
    return this.callApi<ResponseType | ErrorResponse>(query, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `token=${encodeURIComponent(this.csrf || "")}${
        body ? `&${body}` : ""
      }`, // TODO refactor token handling to ensure it is not undefined here
    });
  }

  private async callApi<T>(query: string, settings?: RequestInit): Promise<T> {
    let endpoint = `/wiki/api.php?format=json&${query}`;
    if (LOCAL) {
      endpoint = `https://www.zeldadungeon.net${endpoint}&origin=${location.origin}`;
    }

    const response = await fetch(endpoint, {
      credentials: LOCAL ? "include" : "same-origin",
      ...settings,
    });

    return response.json();
  }

  private async getToken(): Promise<void> {
    const response = await this.callApi<TokenResponse>(
      "action=query&meta=tokens&type=csrf"
    );
    const token = response.query.tokens.csrftoken;
    // work around the API endpoint returning \+ instead of failure when no login
    if (token !== "\\+") {
      this.csrf = token;
    } else {
      this.csrf = undefined;
    }
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

import { Dropbox } from "dropbox";
import readAsText from "../util/readAsText";

class DropboxResourceHandler {

  constructor() {
    this.loggedIn = false;
    this.client = new Dropbox({ clientId: "rtid7yv8kjr94tc" });
  }

  setAccessToken(accessToken) {
    this.loggedIn = true;
    this.client = new Dropbox({ accessToken });
  };

  logIn() {
    return new Promise((resolve, reject) => {
      const red = `${location.origin}/dropbox.html`;
      const authUrl = this.client.getAuthenticationUrl(red);
      const callback = (event) => {
        if (event.source !== authWindow) return;
        const match = event.data.match(/access_token\=([^&]+)/);
        if (match) {
          this.setAccessToken(match[1]);
          resolve();
        }
        window.removeEventListener("message", callback, false);
      };
      window.addEventListener("message", callback, false);
      const authWindow = window.open(authUrl, null, "width=640,height=480");
    });
  }

  dir(path) {
    return this.client.filesListFolder({ path })
      .then((result) => {
        return result.entries.filter((entry) => {
          return entry[".tag"] === "folder" || entry[".tag"] === "file";
        }).map((entry) => {
          return {
            isFolder: entry[".tag"] === "folder",
            name: entry.name,
            path: entry.path_display
          };
        });
      });
  }

  read(path) {
    return this.client.filesDownload({ path })
      .then(result => result.fileBlob)
      .then(readAsText);
  }

  create(path, text) {
    return this.client.filesUpload({
      path,
      contents: new Blob([text], { type: "application/json" }),
      mode: { ".tag": "add" },
    });
  }

  update(path, text) {
    return this.client.filesUpload({
      path,
      contents: new Blob([text], { type: "application/json" }),
      mode: { ".tag": "overwrite" },
    });
  }

}

export default new DropboxResourceHandler();

import { log, LogLevels } from "./utils";

// useful to be set to 'false' when developing locally and ignoring the Chrome extension environment
const useLocalStorage = process.env.NODE_ENV === "development";

/**
 * @param {String} secret
 * @param {String} skin
 * @param {String} logLevels
 * @param {{key: String, value: String}[]} replaceResources
 */
export function store({
  secret = "",
  skin = "",
  logLevels = "",
  replaceResources = []
}) {
  if (useLocalStorage) {
    localStorage.setItem("secret", secret);
    localStorage.setItem("skin", skin);
    localStorage.setItem("logLevels", logLevels);
    localStorage.setItem("replaceResources", JSON.stringify(replaceResources));

    log("Options updated");
  } else {
    chrome.storage.sync.set(
      {
        secret,
        logLevels: LogLevels.fromStr(logLevels),
        skin,
        replaceResources
      },
      () => log("Options updated")
    );
  }
}

/**
 * @return Promise<{{secret?: String, skin?: String, logLevels?: String, replaceResources?: {key: String, value: String}[]}}>
 */
export function load() {
  return new Promise(resolve => {
    if (useLocalStorage) {
      const replaceResources = localStorage.getItem("replaceResources");
      resolve({
        secret: localStorage.getItem("secret"),
        skin: localStorage.getItem("skin"),
        logLevels: localStorage.getItem("logLevels"),
        replaceResources: replaceResources ? JSON.parse(replaceResources) : null
      });
    } else {
      chrome.storage.sync.get(
        ["secret", "logLevels", "skin", "replaceResources"],
        ({ secret, logLevels, skin, replaceResources }) => {
          const logLevelsStr = LogLevels.toStr(logLevels);

          resolve({
            secret,
            skin,
            logLevels: logLevelsStr,
            replaceResources
          });
        }
      );
    }
  }).then(data => {
    log("Options loaded");
    return data;
  });
}

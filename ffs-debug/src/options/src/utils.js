/* eslint no-console:off*/

const log = msg => {
  console.log(
    "%c %s %s %s",
    "color: brown; font-weight: bold; text-decoration : underline;",
    "--FFS DEBUG--",
    msg,
    "--"
  );
};

export { log };

/**
 * Value will be of the format "logger:level, ...logger:level, ... ",
 * for instance "Controller:3, Comm:3"
 * @param {Object} [levels] should be of the format { "logger": level, "logger": level, ... }
 * @param {String[]} outArr where to put parsed log-level
 * @param {Boolean} [isFullMatch] whether or not this is 'fullMatch' or 'startsWith'
 */
const setLogLevels = (levels, outArr, isFullMatch = true) => {
  if (levels)
    Object.keys(levels).forEach(key =>
      outArr.push(`${key}${isFullMatch ? "" : "*"}:${levels[key]}`)
    );
};

export const LogLevels = {
  /**
   * String value must be of the format "logger:level, ..., logger*:level, ... ",
   * Return object is with format:
   *   {
   *     listLevel: {
   *         "Controller": 3,
   *         "Comm": 3
   *     },
   *     listLevelStartWith: {"Loc_P_0_dummy": 1}
   *   };
   * @param {String} logLevels
   * @return {{listLevel:Object, listLevelStartWith: Object}}
   */
  fromStr(logLevels) {
    const logLevelsObj = logLevels
      .split(",")
      .map(val => val.trim())
      .map(val => val.split(":").map(val => val.trim()))
      .filter(val => val.length === 2)
      .filter(val => val[1] >= 1 && val[1] <= 5)
      .map(val => ({ logger: val[0], level: val[1] }))
      .reduce((res, val) => {
        //check whether this is 'full match' or 'starts with' logger
        let logLevelsType = "listLevel";
        let logger = val.logger;
        if (logger.endsWith("*")) {
          logLevelsType = "listLevelStartWith";
          logger = logger.slice(0, -1); // remove this last '*'
        }

        if (!res[logLevelsType]) {
          res[logLevelsType] = {};
        }
        res[logLevelsType][logger] = val.level;
        return res;
      }, {});

    return logLevelsObj;
  },

  /**
   * @param {{listLevel:Object, listLevelStartWith: Object}} logLevelsObj
   * @return {String|null}
   */
  toStr(logLevelsObj) {
    const loggers = [];
    if (logLevelsObj) {
      setLogLevels(logLevelsObj.listLevel, loggers);
      setLogLevels(logLevelsObj.listLevelStartWith, loggers, false);
    }

    return loggers.length ? loggers.join(", ") : null;
  }
};

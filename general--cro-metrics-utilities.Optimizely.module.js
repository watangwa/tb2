try{
!function(){
// ../../_includes/cromedics/cookies.ts
function setCookie(name, value, {
  duration,
  domain = window.location.hostname.split(".").slice(-2).join("."),
  sameSite = "Lax"
} = {}) {
  let cookie = `${name}=${value}; Path=/`;
  let date;
  if (duration instanceof Date) {
    date = duration;
  } else if (duration > 0) {
    const hours = duration * 60 * 60 * 1e3;
    date = new Date();
    date.setTime(date.getTime() + hours);
  }
  if (date)
    cookie += `; Expires=${date.toUTCString()}`;
  if (domain)
    cookie += `; Domain=${domain}`;
  cookie += `; SameSite=${sameSite}`;
  if (sameSite.toLowerCase() === "none")
    cookie += `; Secure;`;
  document.cookie = cookie;
}
function getCookie(name) {
  const nameEQ = `${name}=`;
  const cookieArray = document.cookie.split(";");
  for (const cookie of cookieArray) {
    const cookieName = cookie.trim();
    if (cookieName.indexOf(nameEQ) === 0)
      return cookieName.substring(nameEQ.length, cookieName.length);
  }
  return null;
}
function delCookie(name, {
  domain = window.location.hostname.split(".").slice(-2).join(".")
} = {}) {
  let cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  if (domain)
    cookie += `; domain=${domain}`;
  document.cookie = cookie;
}

// ../../_includes/oli/optimizely/lifecycle.ts
function onInitialized(callback) {
  window.optimizely.initialized && callback() || window.optimizely.push({
    type: "addListener",
    filter: { type: "lifecycle", name: "initialized" },
    handler: callback
  });
}
function onTrackEvent(callback) {
  window.optimizely.push({
    type: "addListener",
    filter: { type: "analytics", name: "trackEvent" },
    handler: (event) => {
      event.data.id = event.data.id || event.data.apiName;
      callback(event.data);
    }
  });
}

// ../../_includes/cromedics/params.ts
var getParam = (param, search = window.location.search) => new URLSearchParams(search).get(param);

// ../../_includes/cromedics/cro-mode.ts
var PARAM_NAME = "cro_mode";
var defaultOptions = {
  duration: window.CRO_PJS?.COOKIE_DURATION || 1,
  // Cro Mode lasts for 1 hour by default
  domain: window.CRO_PJS?.COOKIE_DOMAIN
};
var setCroMode = (newMode, addOptions = {}) => {
  const options = Object.assign({}, defaultOptions, addOptions);
  if (newMode && /^[\w\-_]+$/.test(newMode)) {
    setCookie(PARAM_NAME, newMode, options);
    console.log(`Cro Metrics "${newMode}" mode enabled.`);
    return newMode;
  }
  delCookie(PARAM_NAME, options);
  console.log(`Cro Metrics logging and qa modes disabled.`);
  return void 0;
};
var getCroMode = () => getParam(PARAM_NAME) || getCookie(PARAM_NAME) || void 0;

// ../../_includes/cromedics/logging.ts
var PJS_FORMAT = "color:white;background:#12659d;";
var EXPERIMENT_FORMAT = "color:white;background:#ff590b;";
var NOOP = function(..._args) {
};
function getLogFn(shouldLog, prefix, fn = "info") {
  return shouldLog ? console[fn].bind(console, `%c[${prefix}]`, prefix === "PJS" ? PJS_FORMAT : EXPERIMENT_FORMAT) : NOOP;
}
function experimentError(errorLocation, details) {
  console.error("%c[cro]", EXPERIMENT_FORMAT, `[${errorLocation}]`, details);
}
function pjsError(errorLocation, details) {
  console.error("%c[PJS]", PJS_FORMAT, `[${errorLocation}]`, details);
}
var pjsAssert = (assertion, tagOrName, errorMsg, value) => {
  console.assert(assertion, "%0", { value, errorMessage: `[PJS] ${tagOrName}: ${errorMsg}` });
};
var experimentAssert = (assertion, tagOrName, errorMsg, value) => {
  console.assert(assertion, "%0", { value, errorMessage: `[cro] ${tagOrName}: ${errorMsg}` });
};

// ../../_includes/pjs/utilities.ts
function initUtilities(PJS2) {
  const utils = PJS2.utils || (PJS2.utils = {});
  utils.cookie = {
    set: setCookie,
    get: getCookie,
    del: delCookie
  };
  utils.getParam = getParam;
  PJS2.log = utils.log = PJS2.debug = utils.debug = PJS2.assert = utils.assert = NOOP;
  utils.error = experimentError;
  PJS2.error = pjsError;
  PJS2.setMode = (newMode, options) => {
    PJS2.mode = setCroMode(newMode, options);
    const shouldLog = PJS2.mode !== void 0;
    PJS2.log = getLogFn(shouldLog, "PJS");
    PJS2.debug = getLogFn(shouldLog, "PJS", "debug");
    PJS2.assert = shouldLog ? pjsAssert : NOOP;
    PJS2.utils.log = getLogFn(shouldLog, "cro");
    PJS2.utils.assert = shouldLog ? experimentAssert : NOOP;
    PJS2.utils.debug = getLogFn(shouldLog, "cro", "debug");
  };
  const initialMode = getCroMode() || PJS2.mode;
  if (initialMode)
    PJS2.setMode(initialMode);
}

// ../../_projectjs/general/cro-metrics-utilities.Optimizely.module.ts
function cro_metrics_utilities_Optimizely_module_default() {
  initUtilities(PJS);
  onInitialized(() => {
    const utils = window.optimizely.get("utils");
    Object.assign(utils, PJS.utils);
    PJS.utils.observeSelector = utils.observeSelector;
    PJS.utils.waitForElement = utils.waitForElement;
    PJS.utils.waitUntil = utils.waitUntil;
  });
  onTrackEvent((data) => {
    PJS.log(`Metric fired: ${data.name} <${data.apiName}>`, data.tags);
  });
}

// ../../general__cro-metrics-utilities.Optimizely.module.ts
cro_metrics_utilities_Optimizely_module_default({});

}();}catch(e){PJS.error(`general/cro-metrics-utilities.Optimizely.module`, e);}
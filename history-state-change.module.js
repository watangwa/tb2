try{
!function(){
// ../../_includes/oli/optimizely/lifecycle.ts
function activate() {
  window.optimizely.push({ type: "activate" });
}

// ../../_includes/cromedics/monkey-patch.ts
function monkeyPatchAfter(object, key, callback) {
  const original = object[key];
  object[key] = function(...args) {
    const output = typeof original === "function" && original.apply(this, args);
    try {
      callback(...args);
    } catch (e) {
      console.error(e);
    }
    return output;
  };
}

// _projectjs/history-state-change.module.ts
var convertURL = (url) => {
  const converter = document.createElement("a");
  converter.href = url;
  return converter.href;
};
var lastUrl = window.location.href;
var urlChanged = (newUrl) => {
  if (newUrl === lastUrl)
    return;
  lastUrl = newUrl;
  window.dispatchEvent(new CustomEvent("spaPageEnd"));
  setTimeout(activate);
};
var stateChangeCallback = (state, title, url) => {
  urlChanged(convertURL(url));
};
function history_state_change_module_default() {
  monkeyPatchAfter(window.history, "pushState", stateChangeCallback);
  monkeyPatchAfter(window.history, "replaceState", stateChangeCallback);
  window.addEventListener("popstate", () => {
    urlChanged(window.location.href);
  });
}

// ../../history-state-change.module.ts
history_state_change_module_default({});

}();}catch(e){PJS.error(`history-state-change.module`, e);}
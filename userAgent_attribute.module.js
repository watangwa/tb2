!function(){
// ../../_includes/cromedics/user-agents.ts
var knownBots = ["PhantomJS", "Prerender", "HeadlessChrome", "PetalBot", "Checkly"];
var isKnownBot = (userAgent = window.navigator.userAgent) => knownBots.some((botName) => userAgent.includes(botName));

// ../../_includes/oli/optimizely/attributes.ts
var setAttributes = (attributes, eventName = "push_attribute") => {
  window.optimizely.push({ type: "user", attributes });
  window.optimizely.push({ type: "event", eventName });
};

// _projectjs/userAgent_attribute.module.ts
function userAgent_attribute_module_default() {
  const { userAgent } = window.navigator;
  setAttributes({ pjs_useragent: userAgent });
  if (isKnownBot(userAgent) || userAgent.includes("ToryBurchAutotest")) {
    setAttributes({ pjs_disabled_bot: "true" });
    throw "bot traffic detected.";
  }
}

// ../../userAgent_attribute.module.ts
userAgent_attribute_module_default({});

}();
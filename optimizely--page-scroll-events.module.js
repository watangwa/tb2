try{
!function(){
// ../../_includes/oli/optimizely/lifecycle.ts
function onActivated(callback) {
  window.optimizely.push({
    type: "addListener",
    filter: { type: "lifecycle", name: "activated" },
    handler: callback
  });
}

// ../../_includes/oli/optimizely/events.ts
var sendEvent = (eventName, tags2 = {}) => {
  window.optimizely.push({
    type: "event",
    eventName,
    tags: tags2
  });
};

// @oli:logs:@oli:logs:page-scroll-events.module
var log = /* @__PURE__ */ (() => window.CRO_PJS.log.bind(window, "[page-scroll-events.module]"))();

// ../../_includes/cromedics/throttle.ts
var throttle = (func, wait, { leading, trailing } = {}) => {
  let context;
  let args;
  let result;
  let timeout = null;
  let previous = 0;
  const later = function() {
    previous = leading === false ? 0 : Date.now();
    timeout = null;
    result = func.apply(context, args);
    if (!timeout)
      context = args = null;
  };
  return function() {
    const now = Date.now();
    if (!previous && leading === false)
      previous = now;
    const remaining = wait - (now - previous);
    context = this;
    args = arguments;
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      result = func.apply(context, args);
      if (!timeout)
        context = args = null;
    } else if (!timeout && trailing !== false) {
      timeout = setTimeout(later, remaining);
    }
    return result;
  };
};
var throttle_default = throttle;

// ../../_includes/cromedics/scroll-values.ts
var getDocumentHeight = () => Math.max(
  document.documentElement.offsetHeight,
  document.documentElement.scrollHeight,
  document.body.offsetHeight,
  document.body.scrollHeight
);
var getMaxScrollPosition = () => getDocumentHeight() - window.innerHeight;
var getScrollPosition = () => Math.max(
  window.pageYOffset,
  document.documentElement.scrollTop,
  document.body.scrollTop
);
var getScrollPercentage = () => getScrollPosition() / getMaxScrollPosition();

// ../../_projectjs/optimizely/page-scroll-events.module.ts
var tags = /* @__PURE__ */ new Map();
var triggerScrollGoals = (tag, percentages) => {
  const scrollPercentage = getScrollPercentage() * 100;
  for (const percent of percentages) {
    const { fired, breakpoint, callback } = percent;
    if (fired)
      continue;
    if (scrollPercentage >= breakpoint) {
      callback(tag, breakpoint);
      percent.fired = true;
    }
  }
};
var sendTagEvent = (tag, percent) => {
  sendEvent(`pjs_${tag}_scroll_${percent}`);
};
function trackPageScroll(tag, breakpoints = [1, 25, 50, 75, 100], callback = sendTagEvent) {
  setTimeout(() => {
    if (tags.has(tag))
      return;
    log(`Tracking "${tag}" scroll metrics.`);
    tags.set(tag, breakpoints.map((breakpoint) => ({
      fired: false,
      breakpoint,
      callback
    })));
  });
}
function page_scroll_events_module_default() {
  window.addEventListener("scroll", throttle_default(() => {
    for (const [tag, percentages] of tags.entries()) {
      triggerScrollGoals(tag, percentages);
    }
  }, 250));
  PJS.utils.trackPageScroll = trackPageScroll;
  onActivated(() => {
    log(`Resetting scroll tracking.`);
    tags.clear();
    trackPageScroll("sitewide");
  });
}

// ../../optimizely__page-scroll-events.module.ts
page_scroll_events_module_default({});

}();}catch(e){PJS.error(`optimizely/page-scroll-events.module`, e);}
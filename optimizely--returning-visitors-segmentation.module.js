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

// ../../_includes/oli/optimizely/attributes.ts
var setAttributes = (attributes, eventName = "push_attribute") => {
  window.optimizely.push({ type: "user", attributes });
  window.optimizely.push({ type: "event", eventName });
};

// ../../_projectjs/optimizely/returning-visitors-segmentation.module.ts
function returning_visitors_segmentation_module_default() {
  onActivated(() => {
    const visitorSession = window.optimizely.get("visitor").first_session ? "New" : "Returning";
    setAttributes({ pjs_returning_visitor: visitorSession });
  });
}

// ../../optimizely__returning-visitors-segmentation.module.ts
returning_visitors_segmentation_module_default({});

}();}catch(e){PJS.error(`optimizely/returning-visitors-segmentation.module`, e);}
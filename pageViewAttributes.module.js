try{
!function(){
// ../../_includes/oli/optimizely/attributes.ts
var setAttributes = (attributes, eventName = "push_attribute") => {
  window.optimizely.push({ type: "user", attributes });
  window.optimizely.push({ type: "event", eventName });
};

// ../../_includes/oli/optimizely/pages.ts
var onPageActivated = (callback, pageId) => {
  window.optimizely.push({
    type: "addListener",
    filter: { type: "lifecycle", name: "pageActivated" },
    handler: (event) => {
      if (!pageId || event.data.page.id === String(pageId))
        callback(event.data);
    }
  });
};

// _projectjs/pageViewAttributes.module.ts
var CHECKOUT_PAGE_AEM = "17287236501";
function pageViewAttributes_module_default() {
  onPageActivated(() => {
    const returnCustomerAttr = window.optimizely.get("visitor").custom["22521880007"];
    if (returnCustomerAttr && returnCustomerAttr.value === "Returning") {
      setAttributes({ pjs_pageview_guest_returning_checkout_page: true });
    } else {
      setAttributes({ pjs_pageview_guest_returning_checkout_page: false });
    }
  }, CHECKOUT_PAGE_AEM);
}

// ../../pageViewAttributes.module.ts
pageViewAttributes_module_default({});

}();}catch(e){PJS.error(`pageViewAttributes.module`, e);}
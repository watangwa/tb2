try{
!function(){
// ../../_includes/cromedics/monkey-patch.ts
function monkeyPatchBefore(object, key, callback) {
  const original = object[key];
  object[key] = function(...args) {
    try {
      callback(...args);
    } catch (e) {
      console.error(e);
    }
    return typeof original === "function" && original.apply(this, args);
  };
}

// ../../_includes/cromedics/datalayer.ts
var waitForDataLayer = (dataLayerKey = "dataLayer") => new Promise((resolve) => {
  (function poll() {
    if (!window[dataLayerKey] || typeof window[dataLayerKey].push !== "function")
      return setTimeout(poll, 50);
    return resolve(window[dataLayerKey]);
  })();
});
var onDataLayerPush = (callback, {
  dataLayerKey = "dataLayer",
  withPastData = true
} = {}) => waitForDataLayer(dataLayerKey).then((dataLayer) => {
  if (withPastData) {
    dataLayer.forEach((data) => {
      callback(data);
    });
  }
  monkeyPatchBefore(dataLayer, "push", callback);
});

// @oli:logs:@oli:logs:revenue-tracking-WIP.module
var log = /* @__PURE__ */ (() => window.CRO_PJS.log.bind(window, "[revenue-tracking-WIP.module]"))();

// ../../_includes/cromedics/cookies.ts
function delCookie(name, {
  domain = window.location.hostname.split(".").slice(-2).join(".")
} = {}) {
  let cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  if (domain)
    cookie += `; domain=${domain}`;
  document.cookie = cookie;
}
function cookieExists(param, value) {
  return new RegExp(`(^|; )${param}${value !== void 0 ? `=${value}` : "(=.*)?"}(;|$)`).test(document.cookie);
}

// ../../_includes/oli/optimizely/events.ts
var sendEvent = (eventName, tags = {}) => {
  window.optimizely.push({
    type: "event",
    eventName,
    tags
  });
};

// _includes/productAttribution.ts
var families = {
  tMonogram: ["t-monogram", "t monogram", "tmonogram"],
  fleming: ["fleming"],
  ella: ["ella"],
  eleanor: ["eleanor"],
  leeRadziwill: ["lee radziwill", "lee-radziwill"],
  robinson: ["robinson"],
  kira: ["kira"],
  miller: ["miller"],
  mcgraw: ["mcgraw"],
  bonBon: ["bon bon", "bon-bon"],
  claire: ["claire"],
  minnie: ["minnie"],
  goodLuckTrainer: ["good luck trainer", "good-luck-trainer"],
  ladybugSneaker: ["ladybug sneaker", "ladybug-sneaker"],
  court: ["court"]
};
var categories = {
  sale: ["sale"],
  shoes: ["shoes", "shoe"],
  handbags: ["handbags", "handbag", "hbg"]
};
var subcategories = {
  sneakers: ["sneakers", "sneaker"],
  sandals: ["sandals", "sandal"],
  boots: ["boots", "boot"],
  balletFlats: ["ballet flats", "ballet-flats", "ballet", "flat", "flats", "ballet flat", "ballet-flat", "ballets", "ballets flat", "ballets-flat", "ballets flats"],
  loafers: ["loafers", "loafer"],
  totes: ["totes", "tote"],
  shoulderCrossbodyBags: ["shoulder bags", "shoulder bag", "crossbody bags", "crossbody bag"],
  bucketBags: ["bucket bags", "bucket bag"]
};
var getFamilyAttributeName = (product) => {
  const productName = product.productName?.toLowerCase();
  if (productName) {
    for (const [familyName, familyTags] of Object.entries(families)) {
      for (const tag of familyTags) {
        if (productName.includes(tag))
          return familyName;
      }
    }
  }
  return void 0;
};
var getCategoryAttributeName = (product) => {
  const productName = product.productName?.toLowerCase();
  if (productName) {
    for (const [categoryName, categoryTags] of Object.entries(categories)) {
      for (const tag of categoryTags) {
        if (productName.includes(tag))
          return categoryName;
      }
    }
  }
  return void 0;
};
var getSubcategoryAttributeName = (product) => {
  const productName = product.productName?.toLowerCase();
  if (productName) {
    for (const [subcategoryName, subcategoryTags] of Object.entries(subcategories)) {
      for (const tag of subcategoryTags) {
        if (productName.includes(tag))
          return subcategoryName;
      }
    }
  }
  return void 0;
};

// ../../_includes/oli/optimizely/attributes.ts
var setAttributes = (attributes, eventName = "push_attribute") => {
  window.optimizely.push({ type: "user", attributes });
  window.optimizely.push({ type: "event", eventName });
};

// _projectjs/revenue-tracking-WIP.module.ts
var getTagFromSessionStorageKey = (sessionStorageKey) => {
  const match = sessionStorageKey.match(/^cro_(.+)_items$/);
  return match && match[1] || void 0;
};
var dedupedSessionStorageArray = (sessionStorageKey) => {
  const arr = JSON.parse(sessionStorage.getItem(sessionStorageKey)) || [];
  return arr.filter((elem, index, self) => index === self.indexOf(elem));
};
var PAYMENT_METHOD_EVENTS = {
  AFTERPAY: "pjs_afterpay_revenue_aem",
  PayPal: "pjs_paypal_revenue_aem",
  CREDIT_CARD: "pjs_credit_card_revenue_aem",
  APPLE_PAY: "pjs_apple_pay_revenue_aem"
};
function revenue_tracking_WIP_module_default() {
  onDataLayerPush((data) => {
    if (window.location.pathname.indexOf("/order-confirmation") === -1)
      return;
    if (data.event !== "e_orderConfirmationView")
      return;
    const { order, products } = data;
    if (!order || !products || !products.length)
      return;
    const revenueTags = {
      revenue: order.revenue * 100,
      transactionId: order.transactionId,
      value: products.length
    };
    sendEvent("pjs_revenue_aem", revenueTags);
    const [paymentMethod] = order.paymentMethods;
    const paymentMethodEvent = PAYMENT_METHOD_EVENTS[paymentMethod];
    if (paymentMethodEvent) {
      sendEvent(paymentMethodEvent, revenueTags);
    } else {
      log("No payment method found");
    }
    const productTrackingTags = Object.keys(sessionStorage).reduce((out, sessionStorageKey) => {
      const tag = getTagFromSessionStorageKey(sessionStorageKey);
      if (tag)
        out[tag] = dedupedSessionStorageArray(sessionStorageKey);
      return out;
    }, {});
    log(`Product Tracking Tags:`, productTrackingTags);
    products.forEach((product) => {
      log(`Product Info:`, product);
      const revenue = product.price * 100;
      for (const tag in productTrackingTags) {
        productTrackingTags[tag].forEach((searchItemID) => {
          if (product.id === searchItemID || product.sku === searchItemID) {
            sendEvent(`pjs_${tag}_revenue_aem`, { revenue });
          }
        });
      }
      const taxonomyArray = ["taxonomyL1", "taxonomyL2", "taxonomyL3"];
      taxonomyArray.forEach((thisTaxonomy) => {
        if (product[`${thisTaxonomy}`] !== "") {
          sendEvent(`pjs_${product[thisTaxonomy]}_purchased`, { revenue });
        }
      });
      const familyProduct = getFamilyAttributeName(product);
      const category = getCategoryAttributeName(product);
      const subcategory = getSubcategoryAttributeName(product);
      if (familyProduct)
        setAttributes({ ["User Purchased"]: familyProduct });
      if (category)
        setAttributes({ ["User Purchased"]: category });
      if (subcategory)
        setAttributes({ ["User Purchased"]: subcategory });
    });
    if (cookieExists("utm_campaign") && cookieExists("utm_term")) {
      delCookie("utm_campaign");
      delCookie("utm_term");
    }
  }, { dataLayerKey: "gtmDataLayer" });
}

// ../../revenue-tracking-WIP.module.ts
revenue_tracking_WIP_module_default({});

}();}catch(e){PJS.error(`revenue-tracking-WIP.module`, e);}
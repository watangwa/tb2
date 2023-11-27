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

// ../../_includes/oli/optimizely/lifecycle.ts
function onActivated(callback) {
  window.optimizely.push({
    type: "addListener",
    filter: { type: "lifecycle", name: "activated" },
    handler: callback
  });
}

// @oli:logs:@oli:logs:add-to-cart-tracking-WIP.module
var log = /* @__PURE__ */ (() => window.CRO_PJS.log.bind(window, "[add-to-cart-tracking-WIP.module]"))();

// ../../_includes/oli/optimizely/attributes.ts
var setAttributes = (attributes, eventName = "push_attribute") => {
  window.optimizely.push({ type: "user", attributes });
  window.optimizely.push({ type: "event", eventName });
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

// _projectjs/add-to-cart-tracking-WIP.module.ts
function add_to_cart_tracking_WIP_module_default() {
  const cache = {
    addedProducts: {},
    watchlist: {},
    tracking: []
    // list of tags
  };
  const getStoredProducts = (tag) => {
    return JSON.parse(sessionStorage.getItem(`cro_${tag}_items`)) || [];
  };
  const addStoredProduct = (tag, productSKU) => {
    const products = cache.addedProducts[tag] || [];
    if (!products.includes(productSKU)) {
      products.push(productSKU);
      sessionStorage.setItem(`cro_${tag}_items`, JSON.stringify(products));
      log(`Added product [${productSKU}] to "cro_${tag}_items" session storage.`);
    } else {
      log(`Product [${productSKU}] is already added to "cro_${tag}_items" session storage.`);
    }
  };
  onDataLayerPush((data) => {
    if (data.event !== "e_addToCart" || !data.addedProduct)
      return;
    log(`ATC product data:`, data.addedProduct);
    setAttributes({ pjs_user_atc: "true" });
    const { sku, id, productName, listPrice, price } = data.addedProduct;
    const trackProduct = (tag) => {
      setAttributes({
        [`pjs_${tag}_atc`]: "true"
      }, `pjs_${tag}_atc`);
      addStoredProduct(tag, sku);
    };
    cache.tracking.forEach(trackProduct);
    const taxonomyArray = ["taxonomyL1", "taxonomyL2", "taxonomyL3"];
    taxonomyArray.forEach((thisTaxonomy) => {
      if (data.addedProduct[`${thisTaxonomy}`] !== "") {
        trackProduct(data.addedProduct[`${thisTaxonomy}`]);
        if (price < listPrice)
          trackProduct(`sale_${data.addedProduct[`${thisTaxonomy}`]}`);
      }
    });
    if (price < listPrice)
      trackProduct(`sale_product`);
    if (productName.toLowerCase().includes("tote") && data.addedProduct.taxonomyL2 !== "handbags-tote-bag") {
      trackProduct(`handbags-tote-bag`);
    }
    const familyProduct = getFamilyAttributeName(data.addedProduct);
    const category = getCategoryAttributeName(data.addedProduct);
    const subcategory = getSubcategoryAttributeName(data.addedProduct);
    if (familyProduct)
      setAttributes({ ["User Add To Cart"]: familyProduct });
    if (category)
      setAttributes({ ["User Add To Cart"]: category });
    if (subcategory)
      setAttributes({ ["User Add To Cart"]: subcategory });
    if (sessionStorage.getItem(`productWatchlist`)) {
      const watch = JSON.parse(sessionStorage.getItem(`productWatchlist`) || "");
      for (const tag in watch) {
        if (watch[tag].some((watchedId) => watchedId === id)) {
          trackProduct(tag);
          const updateArray = watch[tag].splice(watch[tag].indexOf(id) + 1, 1);
          watch[tag] = updateArray;
          sessionStorage.setItem(`productWatchlist`, JSON.stringify(watch));
        }
      }
    }
  }, { dataLayerKey: "gtmDataLayer" });
  onActivated(() => {
    log(`Resetting add to cart tracking.`);
    cache.tracking = [];
  });
  PJS.utils.trackPageATC = (tag, watchlist) => {
    setTimeout(() => {
      log(`Tracking "${tag}" Add To Cart metrics.`);
      if (Array.isArray(watchlist)) {
        cache.watchlist[tag] = watchlist;
      } else {
        cache.watchlist[tag] = [];
      }
      sessionStorage.setItem(`productWatchlist`, JSON.stringify(cache.watchlist));
      if (cache.tracking.includes(tag))
        return;
      cache.addedProducts[tag] = getStoredProducts(tag);
      cache.tracking.push(tag);
    });
  };
  PJS.utils.trackProduct = (tag, watchlist) => {
    setTimeout(() => {
      log(`Tracking "${tag}" Add To Cart metrics.`);
      cache.watchlist[tag] = [];
      if (Array.isArray(watchlist)) {
        watchlist.forEach((thisProduct) => {
          cache.watchlist[tag].push(thisProduct);
        });
        sessionStorage.setItem(`productWatchlist`, JSON.stringify(cache.watchlist));
      }
    });
  };
}

// ../../add-to-cart-tracking-WIP.module.ts
add_to_cart_tracking_WIP_module_default({});

}();}catch(e){PJS.error(`add-to-cart-tracking-WIP.module`, e);}
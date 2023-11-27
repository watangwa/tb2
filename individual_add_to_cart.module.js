try{
!function(){
// @oli:logs:@oli:logs:individual_add_to_cart.module
var log = /* @__PURE__ */ (() => window.CRO_PJS.log.bind(window, "[individual_add_to_cart.module]"))();

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
var onPageDeactivated = (callback, pageId) => {
  window.optimizely.push({
    type: "addListener",
    filter: { type: "lifecycle", name: "pageDeactivated" },
    handler: (event) => {
      if (!pageId || event.data.page.id === String(pageId))
        callback(event.data);
    }
  });
};
var pageTreatment = (callback, pageId) => {
  let undo;
  onPageActivated(() => {
    undo = callback();
  }, pageId);
  onPageDeactivated(() => {
    if (undo)
      undo();
  }, pageId);
};

// @oli:logs:@oli:logs:trackProduct
var log2 = /* @__PURE__ */ (() => window.CRO_PJS.log.bind(window, "[trackProduct]"))();

// _includes/trackProduct.ts
var cache = {
  addedProducts: {},
  watchlist: {},
  tracking: []
  // list of tags
};
var trackProduct = (tag, watchlist) => {
  setTimeout(() => {
    log2(`Tracking "${tag}" Add To Cart metrics.`);
    cache.watchlist[tag] = [];
    if (Array.isArray(watchlist)) {
      watchlist.forEach((product) => {
        cache.watchlist[tag].push(product);
      });
      sessionStorage.setItem(
        `productWatchlist`,
        JSON.stringify(cache.watchlist)
      );
    }
  });
};

// _projectjs/individual_add_to_cart.module.ts
function individual_add_to_cart_module_default() {
  const eventMap = [
    // atb from or after clicking product recently viewed or ymal carousels on cart page
    {
      pageName: "cartPage",
      pageId: 17037790526,
      metrics: [
        {
          atc: `cart_ymal_recentlyviewed`,
          engagement: `pjs_recently_viewed_engagement_cart`,
          productSelector: `[data-carousel-type="recently-viewed"] [data-id="ProductTile"]`
        },
        {
          atc: `cart_ymal`,
          productSelector: `[data-product-list="recommended"] [data-id="ProductTile"]`
        },
        {
          atc: `cross_sell_cart`,
          productSelector: `[data-product-list="recommended"] [data-id="ProductTile"]`,
          engagement: `pjs_cross_sell_engagement_cart`
        }
      ]
    },
    {
      pageName: "pdpPage",
      pageId: 15011040160,
      metrics: [
        {
          atc: `pdp_ymal`,
          engagement: `pdp_ymal_engagement`,
          productSelector: `[data-product-list="recommended"] [data-id="ProductTile"]`
        },
        {
          atc: `pdp_recently_viewed`,
          engagement: `pjs_pdp_recently_viewed_engagement`,
          productSelector: `[data-carousel-type="recently-viewed"] [data-id="ProductTile"]`
        },
        {
          atc: `pdp_styled_with`,
          engagement: `pjs_pdp_styled_with_engagement`,
          productSelector: `[data-carousel-type="styled-with"] [data-id="ProductTile"]`
        },
        {
          atc: `pdp_all_caro`,
          engagement: `pjs_pdp_all_engagement`,
          productSelector: `[data-id="CrossSell"] [data-id="ProductTile"]`
        },
        {
          atc: `pdp_tabbed_caro`,
          engagement: `pdp_tabbed_caro_engagement`,
          productSelector: `[data-id="SppEditorialContent-purchase-tabbed-carousel---all-spps"] [data-id="ProductTile"]`
        }
      ]
    },
    {
      pageName: "gridPage",
      pageId: 14942591331,
      metrics: [
        {
          atc: `grid_page`,
          productSelector: `[data-id="ProductTile"]`
        }
      ]
    },
    {
      pageName: "readyToWear",
      pageId: 25343490080,
      metrics: [
        {
          atc: `ready_to_wear`,
          productSelector: `[data-id="ProductTile"]`
        }
      ]
    }
  ];
  function teardown(cancelFuncs) {
    let thisFunc;
    while (thisFunc = cancelFuncs.pop()) {
      if (thisFunc)
        thisFunc();
    }
  }
  for (const page in eventMap) {
    pageTreatment(() => {
      const cancelFuncs = [];
      const { observeSelector } = PJS.utils;
      eventMap[page].metrics.forEach((thisMetric) => {
        const { engagement, atc, productSelector } = thisMetric;
        const storage = sessionStorage.getItem(`cro_${atc}_items`);
        const itemAdded = storage ? JSON.parse(storage) : [];
        cancelFuncs.push(observeSelector(productSelector, (products) => {
          const { productId } = products.dataset;
          itemAdded.push(productId);
          const itemsToStore = JSON.stringify(itemAdded);
          sessionStorage.setItem(`cro_${atc}_items`, itemsToStore);
          products.addEventListener("click", (e) => {
            if (productId && atc) {
              log(`Track ${productId}`);
              trackProduct(atc, [productId]);
            }
            if (engagement) {
              setAttributes({ [engagement]: "true" }, engagement);
              if (!e.target)
                return;
              const clickedEl = e.target;
              if (clickedEl.localName === "figure" || clickedEl.localName === "a") {
                setAttributes({ [`${engagement}_pdp_viewed`]: "true" }, `${engagement}_pdp_viewed`);
              }
            }
          });
        }));
      });
      return () => {
        teardown(cancelFuncs);
      };
    }, eventMap[page].pageId);
  }
}

// ../../individual_add_to_cart.module.ts
individual_add_to_cart_module_default({});

}();}catch(e){PJS.error(`individual_add_to_cart.module`, e);}
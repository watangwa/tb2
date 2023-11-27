try{
!function(){
// ../../_includes/oli/optimizely/attributes.ts
var setAttributes = (attributes, eventName = "push_attribute") => {
  window.optimizely.push({ type: "user", attributes });
  window.optimizely.push({ type: "event", eventName });
};
var setDefaultAttributes = (defaultAttributes, eventName = "push_attribute") => {
  const visitor = window.optimizely.get("visitor");
  const currentAttributes = Object.values(visitor.custom || {});
  const attributes = Object.entries(defaultAttributes).reduce((out, [key, value]) => {
    if (!currentAttributes.find((attr) => attr.id === key || attr.name === key))
      out[key] = value;
    return out;
  }, {});
  if (Object.keys(attributes).length) {
    setAttributes(attributes, eventName);
  }
};

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

// ../../_includes/oli/optimizely/lifecycle.ts
function onInitialized(callback) {
  window.optimizely.initialized && callback() || window.optimizely.push({
    type: "addListener",
    filter: { type: "lifecycle", name: "initialized" },
    handler: callback
  });
}

// ../../_includes/oli/optimizely/events.ts
var sendEvent = (eventName, tags = {}) => {
  window.optimizely.push({
    type: "event",
    eventName,
    tags
  });
};

// @oli:logs:@oli:logs:account_tracking_WIP.module
var log = /* @__PURE__ */ (() => window.CRO_PJS.log.bind(window, "[account_tracking_WIP.module]"))();
var error2 = /* @__PURE__ */ (() => window.CRO_PJS.error.bind(window, "account_tracking_WIP.module"))();

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

// _projectjs/account_tracking_WIP.module.ts
var modalSignInBtn = '[data-id="AuthPortal"] [data-id="SignInForm"] button[data-id="SignInFormSubmitButton"]';
var miniCartSalePrice = '[data-id="MiniCart"] [data-id="SalePrice"], [data-id="MiniCartContent"] [data-id="SalePrice"]';
var accountSignUpMessage = '[data-id="Interactive/EligibleSuccess"] h3[class^="w-success__title"], [data-id="CreateAccountSuccess"]';
var navAccountText = '[data-id="MyAccountLink"] div[class^="element__text"]';
var emailSignUpConfirm = '[data-id="EmailCampaignConfirmation"] [class^="confirmation__title"] span';
var onModelVideoGrid = '[data-id="ProductTile-Slide-Active"] video, [data-id="ProductGallery-Slide-Active"] video';
var utilsDependentEvents = () => {
  const { waitForElement, waitUntil } = PJS.utils;
  const modalSignInBtnPromise = waitForElement(modalSignInBtn);
  const navAccountTextPromise = waitForElement(navAccountText);
  navAccountTextPromise.then((navAccountTextEl) => {
    navAccountTextEl.parentElement?.addEventListener("click", () => {
      if (window.innerWidth <= 1023)
        return sendEvent(`pjs_nav_header_icon_click_mobile`);
      sendEvent(`pjs_nav_header_icon_click_desktop`);
    });
  }).catch(error2);
  Promise.all([modalSignInBtnPromise, navAccountTextPromise]).then(([modalSignInBtnEl, navAccountTextEl]) => {
    modalSignInBtnEl.addEventListener("click", () => {
      waitUntil(() => navAccountTextEl.textContent !== "Sign in").then(() => {
        sendEvent(`pjs_sign_in_completed`);
      }).catch(error2);
    }, { once: true });
  }).catch(error2);
  waitForElement(miniCartSalePrice).then(() => {
    window.sessionStorage.setItem("sale_item_in_cart", "true");
  }).catch(error2);
  waitForElement(accountSignUpMessage).then(() => {
    sendEvent(`pjs_new_account_created`);
    setAttributes({ account_sign_up: "true" });
  }).catch(error2);
  waitForElement(emailSignUpConfirm).then((emailConfirmEl) => {
    if (emailConfirmEl.textContent?.includes(`THANK YOU FOR SUBSCRIBING`)) {
      sendEvent(`pjs_email_signup_confirmation`);
    }
  }).catch(error2);
};
var setUrlCookiesAndAttributes = () => {
  const { search, pathname } = window.location;
  if (pathname.includes("gated-springevent")) {
    setAttributes({ pjs_viewed_spring_event: "true" });
    setCookie(`pjs_viewed_spring_event`, `true`);
  }
  const params = new URLSearchParams(search);
  if (params.size === 0)
    return;
  for (const [paramName, paramValue] of params.entries()) {
    if (paramName.match(/utm_|gclsrc|journey/i)) {
      setCookie(paramName.toLowerCase(), paramValue.toLowerCase());
    }
  }
};
var dataLayerEvents = ({ originalUrl, event, accountType, visitorReturningCustomer }) => {
  if (originalUrl) {
    setAttributes({ pjs_landing_page_spp: originalUrl?.includes(".html") ? "true" : "false" });
  }
  if (event === "e_idmIdAssignement") {
    if (accountType) {
      setAttributes({ pjs_tb_employee: accountType === "EMPLOYEE" });
    }
    return setAttributes({ pjs_tb_api_returning_customer: visitorReturningCustomer ? "Purchaser" : "Non-purchaser" });
  }
  if (event === "e_newsletter_subscribe") {
    sendEvent("pjs_newsletter_signup");
  }
};
function teardown(cancelFuncs) {
  let thisFunc;
  while (thisFunc = cancelFuncs.pop()) {
    if (thisFunc)
      thisFunc();
  }
}
function account_tracking_WIP_module_default() {
  onDataLayerPush((data) => dataLayerEvents(data), { dataLayerKey: "gtmDataLayer" });
  onInitialized(() => {
    setDefaultAttributes({ pjs_tb_api_returning_customer: "Unknown" });
    if (document.referrer.includes("google")) {
      setCookie("utm_source", "google");
    }
    utilsDependentEvents();
    setUrlCookiesAndAttributes();
  });
  log(`add page treatment`);
  pageTreatment(() => {
    const cancelFuncs = [];
    const { observeSelector, waitUntil, waitForElement } = PJS.utils;
    cancelFuncs.push(observeSelector(onModelVideoGrid, () => {
      setAttributes({ pjs_user_saw_on_model_video: "true" }, "pjs_user_saw_on_model_video");
    }));
    cancelFuncs.push(observeSelector('[data-id="ProductTile"]', (thisProduct) => {
      const { productId } = thisProduct.dataset;
      const pdpVisited = waitUntil(() => window.location.pathname.includes(`${productId}.html`));
      pdpVisited.then(() => {
        waitForElement(`[data-id="ProductGallery-Slide-Active"] video`).then(() => {
          setAttributes({ pjs_user_saw_on_model_video: "true" }, "pjs_user_saw_on_model_video");
        }).catch(error2);
      }).catch(error2);
    }));
    return () => {
      teardown(cancelFuncs);
    };
  }, 25343490080);
}

// ../../account_tracking_WIP.module.ts
account_tracking_WIP_module_default({});

}();}catch(e){PJS.error(`account_tracking_WIP.module`, e);}
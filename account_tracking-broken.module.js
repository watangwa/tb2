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

// ../../_includes/oli/optimizely/lifecycle.ts
function waitForUtils(callback) {
  onInitialized(() => {
    callback(window.optimizely.get("utils"));
  });
}
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

// @oli:logs:@oli:logs:account_tracking-broken.module
var log = /* @__PURE__ */ (() => window.CRO_PJS.log.bind(window, "[account_tracking-broken.module]"))();
var error2 = /* @__PURE__ */ (() => window.CRO_PJS.error.bind(window, "account_tracking-broken.module"))();

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

// _projectjs/account_tracking-broken.module.ts
function account_tracking_broken_module_default() {
  waitForUtils((utils) => {
    setDefaultAttributes({ pjs_tb_api_returning_customer: "Unknown" });
    if (window.location.search.includes("?")) {
      const parameters = window.location.search.slice(1).split("&");
      parameters.forEach((thisParam) => {
        const lowerCaseParam = thisParam.toLowerCase();
        if (lowerCaseParam.includes("utm_") || lowerCaseParam.includes("gclsrc") || lowerCaseParam.includes("journey")) {
          const source = thisParam.split("=");
          const cookieValue = typeof source[1] === "string" ? source[1].toLowerCase() : source[1];
          setCookie(source[0], cookieValue);
        }
      });
    }
    if (window.location.pathname.includes("gated-springevent")) {
      setAttributes({ pjs_viewed_spring_event: "true" });
      setCookie(`pjs_viewed_spring_event`, `true`);
    }
    utils.waitForElement(`[data-id="AuthPortal"] [data-id="SignInForm"] button[data-id="SignInFormSubmitButton"]`).then((elSignInButton) => {
      const accountLink = document.querySelector(`[data-id="MyAccountLink"]`);
      if (accountLink) {
        elSignInButton.addEventListener("click", () => {
          const accountFound = utils.waitUntil(() => accountLink.querySelector(`div[class^="element__text"]`) != void 0 && accountLink.querySelector(`div[class^="element__text"]`)?.textContent != "Sign in");
          accountFound.then(() => {
            sendEvent(`pjs_sign_in_completed`);
          }).catch(error2);
        }, { once: true });
      }
    }).catch(error2);
    utils.waitForElement(`[data-id="MiniCartContent"] [data-id="SalePrice"], [data-id="MiniCartContent"] [data-id="SalePrice"]`).then(() => {
      window.sessionStorage.setItem("sale_item_in_cart", "true");
    }).catch(error2);
    utils.waitForElement(`[data-id="Interactive/EligibleSuccess"] h3[class^="w-success__title"], [data-id="CreateAccountSuccess"]`).then(() => {
      sendEvent(`pjs_new_account_created`);
      setAttributes({ account_sign_up: "true" });
      log("Attribute Assigned: New Account Created - Sign Up");
    }).catch(error2);
    utils.waitForElement(`button[data-id="MyAccountLink"]`).then((elAccountButton) => {
      elAccountButton.addEventListener("click", () => {
        if (window.innerWidth <= 1023) {
          sendEvent(`pjs_nav_header_icon_click_mobile`);
        } else {
          sendEvent(`pjs_nav_header_icon_click_desktop`);
        }
      });
    }).catch(error2);
    utils.waitForElement(`[data-id="EmailCampaignConfirmation"] [class^="confirmation__title"] span`).then((elConfirmationTitle) => {
      if (elConfirmationTitle.textContent && elConfirmationTitle.textContent.includes(`THANK YOU FOR SUBSCRIBING`)) {
        sendEvent(`pjs_email_signup_confirmation`);
      }
    }).catch(error2);
    onDataLayerPush((data) => {
      if (data?.originalUrl !== void 0) {
        if (data?.originalUrl.includes(".html")) {
          setAttributes({ pjs_landing_page_spp: "true" });
        } else {
          setAttributes({ pjs_landing_page_spp: "false" });
        }
      } else if (data.event === "e_idmIdAssignement") {
        const { visitorReturningCustomer } = data;
        setAttributes({ pjs_tb_api_returning_customer: visitorReturningCustomer ? "Purchaser" : "Non-purchaser" });
        if (data?.accountType !== void 0) {
          setAttributes({ pjs_tb_employee: data.accountType === "EMPLOYEE" });
        }
      } else if (data.event === "e_newsletter_subscribe") {
        sendEvent("pjs_newsletter_signup");
      }
    }, { dataLayerKey: "gtmDataLayer" });
  });
  onInitialized(() => {
    if (document.referrer.includes("google")) {
      setCookie("utm_source", "google");
    }
  });
}

// ../../account_tracking-broken.module.ts
account_tracking_broken_module_default({});

}();}catch(e){PJS.error(`account_tracking-broken.module`, e);}
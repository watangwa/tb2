try{
!function(TAG){
/**
 * @desc patchDataLayer patches window.dataLayer.push and will call
 * a provided callback with each value that passes through the dataLayer.
 *
 * @param {(data)=>void} callback is sent each data object in the dataLayer array.
 * @param {string} dataLayerKey is the name of the dataLayer variable.
 *   Default is `dataLayer` for window.dataLayer
 */
const patchDataLayer = (callback, dataLayerKey = 'dataLayer')=>{
  (function poll() {
    const original = window[dataLayerKey] && window[dataLayerKey].push;
    if (typeof original !== 'function') return setTimeout(poll, 50);
    //There might already be some data in the dataLayer
    window[dataLayerKey].forEach(data=>{
      callback(data); //Send preexisting data to the callback
    });
    window[dataLayerKey].push = function(...args){
      try {
        callback(...args); //Send any new data to the callback
      } catch(e) {
        console.error(e);
      }
      return original.apply(window[dataLayerKey], args);
    };
  })();
};

const tag="revenue-tracking";

/**
 * Send a custom event to Optimizely
 */
const sendEvent = (eventName, tags = {}) => {
  window.optimizely.push({
    type: "event",
    eventName,
    tags
  });
};

/* eslint-disable prefer-rest-params */

const log = function () {
  return PJS.log(`[${tag}]`, ...arguments);
};

/**
 * @desc set() sets a cookie with optional days
 *  @param {String} name - the name of the cookie
 *  @param {String} value - the value of the cookie
 *  @param {Number} optDays - days the cookie will exist for
 *    NOTE: Not passing optDays will create a "Session Cookie"
 *  @param {String} domain - the domain value of the cookie
 *    Example: ".domain.com" would span all sub domains of domain.com
 *  @return {Undefined}
 */

/**
 * @desc del() removes cookie
 *  @param {String} name - name of cookie to delete
 *  @return {Undefined}
 */
const delCookie = (name, domain = `.${window.location.hostname.split('.').slice(-2).join('.')}`) => {
  let cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  if (domain) {
    cookie += `; domain=${domain}`;
  }
  document.cookie = cookie;
};

const cookieExists = (param, value) => new RegExp(`(^|; )${param}${value !== undefined ? `=${value}` : '(=.*)?'}(;|$)`).test(document.cookie);

/**
 * @format 1.0.0
 *
 * @description
 * This module listens to the GTM dataLayer events on the order confirmation page.
 * It looks for the `e_orderConfirmationView` event which contains the list of products that were purchased.
 *
 * It uses sessionStorage keys to reference products that were added to cart as part of a particular experiment.
 * Session storage keys are of the form: `cro_${tag}_items` where tag is the experiment tag like `tb123` for example.
 * The value is a JSON formatted array of product id or product skus.
 *
 * The module will fire off a custom revenue metric for each matching product that was just purchased.
 * The metric will automatically be of the form `pjs_${tag}_revenue_aem` where the `tag` is taken from the session storage key automatically.
 *   ```
 *
 * @goals
 *  - [PJS] Revenue (AEM) <pjs_revenue_aem>
 *  - [PJS] Afterpay Revenue (AEM) <pjs_afterpay_revenue_aem>
 *  - [PJS] Paypal Revenue (AEM) <pjs_paypal_revenue_aem>
 *  - [PJS] Credit Card Revenue (AEM) <pjs_credit_card_revenue_aem>
 *  - [PJS] Apple Pay Revenue (AEM) <pjs_apple_pay_revenue_aem>
 *  - Dynamic per experiment <pjs_${tag}_revenue_aem>
 *
 * @notes
 * - Create the new metric in Optimizely of the formatL `pjs_${tag}_revenue_aem` where tag is the experiment tag like `tb123`.
 * - Set the sessionStorage value in your experiment code, something like this:
 *   ```
 *   sessionStorage.setItem(`cro_${TAG}_items`, JSON.stringify([12345, 54321]));
 *
 */

/**
  * Parse the experiment tag out of the session storage key.
  * It looks for keys of the format `cro_tb123_items` and returns `tb123` in this case.
  * This returns `undefined` if the string isn't of this format.
  */
const getTagFromSessionStorageKey = (sessionStorageKey) => {
  const match = sessionStorageKey.match(/^cro_(.+)_items$/);
  return (match && match[1]) || undefined;
};

/**
  * Parses the list of items provided in sessionStorage, removes duplicates, then returns the array.
  * The array should be a list of product ids or sku values.
  */
const dedupedSessionStorageArray = (sessionStorageKey) => {
  const arr = JSON.parse(sessionStorage.getItem(sessionStorageKey)) || [];
  return arr.filter((elem, index, self) => index === self.indexOf(elem)); // Dedupe the array
};

const PAYMENT_METHOD_EVENTS = {
  AFTERPAY: 'pjs_afterpay_revenue_aem',
  PayPal: 'pjs_paypal_revenue_aem',
  CREDIT_CARD: 'pjs_credit_card_revenue_aem',
  APPLE_PAY: 'pjs_apple_pay_revenue_aem',
};

patchDataLayer((data) => {
  if (window.location.pathname.indexOf('/order-confirmation') === -1) return;
  if (data.event !== 'e_orderConfirmationView') return;
  const { order, products } = data;
  if (!order || !products || !products.length) return;

  const revenueTags = {
    revenue: order.revenue * 100,
    transactionId: order.transactionId,
    value: products.length,
  };

  sendEvent('pjs_revenue_aem', revenueTags);

  // `paymentMethods` is an array, typically containing only one string value.
  // We assume the first element is the only payment method being used.
  const [paymentMethod] = order.paymentMethods;
  const paymentMethodEvent = PAYMENT_METHOD_EVENTS[paymentMethod];
  if (paymentMethodEvent) {
    sendEvent(paymentMethodEvent, revenueTags);
  } else {
    log('No payment method found');
  }

  const productTrackingTags = Object.keys(sessionStorage).reduce((out, sessionStorageKey) => {
    const tag = getTagFromSessionStorageKey(sessionStorageKey); // An experiment tag like `tb123`
    if (tag) out[tag] = dedupedSessionStorageArray(sessionStorageKey);
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
  });

  if (cookieExists('utm_campaign') && cookieExists('utm_term')) {
    delCookie('utm_campaign');
    delCookie('utm_term');
  }
}, 'gtmDataLayer');

}(`revenue-tracking`);}catch(e){PJS.error(`revenue-tracking`, e);}
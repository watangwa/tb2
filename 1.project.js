PJS.isProd = window.location.hostname === 'www.toryburch.com';
PJS.isStaging = window.location.hostname === 'com.stg.aem.toryburch.com';
PJS.isUAT = window.location.hostname === 'com.uat.aem.toryburch.com';
PJS.isPreview = window.location.hostname === 'na.preview.prod.aem.toryburch.com';
PJS.isCheckout = window.location.pathname.includes('/checkout/');
PJS.isHomepage = window.location.pathname === '/en-us/' || window.location.pathname === '/';
PJS.isPDP = window.location.pathname.includes('.html');

/**
 * Cro Metrics Utilities
 * @module general/cro-metrics-utilities.Optimizely.module
 */

/**
 * Detect Async Optimizely
 * @module general/detect-async.module
 */

/**
 * change to spa/history-state-change.module when code approved by TB
 * (and archive local version)
 * Watch History State Change (for checkout)
 * @module history-state-change.module
 */

/**
 * Bot Filtering Module
 * @module userAgent_attribute.module
 */

/**
 * Initialize Feature Flag integration
 * @module initFeatureFlag.module
 */

if (PJS.mode === 'qa') {
  /**
   * Track Experiment Revenue
   * @module revenue-tracking-WIP.module
   */
  
} else {
  /**
   * Track Experiment Revenue
   * @module revenue-tracking
   */
}

/**
 * Page View Attibutes
 * @module pageViewAttributes.module
 */

if (PJS.isHomepage || PJS.isPDP) {
  /**
   * Page Scroll events
   * @module optimizely/page-scroll-events.module
   */
}

// Modules that are not required to run in the checkout flow
if (!PJS.isCheckout) {
  /**
   * New vs Returning Attribute
   * @module optimizely/returning-visitors-segmentation.module
   */

  /**
   * Track Add to Cart Events
   * @module add-to-cart-tracking.module
   */

  /**
   * Page/product specific ATC
   * @module individual_add_to_cart.module
   */

  if (PJS.mode === 'qa') {
    /**
   * Set up Recommender Util
   * @module recommender-utils.module
   */

    /**
   * User Behavior tracking module
   * @module account_tracking_WIP.module
   */

  } else {
    /**
   * Set up Recommender Util
   * @module recommender-utils
   */

    /**
   * User Behavior tracking module
   * @module account_tracking-broken.module
   */
    
  }
}

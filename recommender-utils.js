try{
!function(TAG){
const tag="recommender-utils";

/* eslint-disable prefer-rest-params */

const log = function () {
  return PJS.log(`[${tag}]`, ...arguments);
};

const error = function () {
  return PJS.error(tag, ...arguments);
};

const onInitialized = (callback) => {
  (window.optimizely.initialized && callback()) || window.optimizely.push({
    type: 'addListener',
    filter: { type: 'lifecycle', name: 'initialized' },
    handler: callback,
  });
};

const validDomains = ['www.toryburch.com', 'toryburch.com', 'com.qa2.aem.toryburch.com', 'com.stg.aem.toryburch.com', 'com.uat.aem.toryburch.com', 'na.preview.prod.aem.toryburch.com'];

class FeatureBase {
  constructor(experimentId, tag = `Experiment ID:${experimentId}`, keyPrefix = 'bucketing') {
    if (!validDomains.includes(window.location.hostname)) throw new Error('This can only be run on select domains.');

    this.keyPrefix = keyPrefix;
    this.experimentId = experimentId;
    this.experimentData = window.optimizely.get('data').experiments[this.experimentId];
    this.tag = tag;

    const variationIndex = this.variationIndex = this.getVariationIndex();
    this.setStoredVariationIndex(variationIndex);
  }

  /**
   * The key used for localStorage
   */
  get localStorageKey() {
    return `cro_${this.keyPrefix}_${this.experimentData?.id}`;
  }

  getStoredVariationIndex() {
    return window.localStorage.getItem(this.localStorageKey);
  }

  setStoredVariationIndex(variationIndex) {
    window.localStorage.setItem(this.localStorageKey, variationIndex);
  }

  getOptimizelyForcedIndex() {
    const forceParameter = new URLSearchParams(window.location.search).get('optimizely_x');
    if (forceParameter !== null) {
      const forceVariation = this.experimentData.variations.findIndex((o) => o.id === forceParameter.split(',')[0]);
      return forceVariation > -1 ? forceVariation : 0;
    }
    return null;
  }

  /**
   * Gets the variation index that should be displayed to the visitor (0 = v0, 1 = v1, etc).
   * In cro_mode=qa, if there is a force variation link, we force the variation. If invalid, return control.
   * Leverages both the force query params (used by the client) and our localStorage key used for persistence.
   * If no index is provided by these methods a random variation index will be returned.
   */
  getVariationIndex() {
    const forcedIndex = this.getOptimizelyForcedIndex();
    if (forcedIndex !== null) return forcedIndex;

    const storedIndex = this.getStoredVariationIndex();
    if (storedIndex !== null) return storedIndex;

    const numVariations = this.experimentData.variations ? this.experimentData.variations.length : 2;
    return Math.floor(Math.random() * numVariations);
  }

  /**
   * @param {number?} forceVariation [optional] index of the variation you want to force. 0 = v0, 1 = v1, etc
   */
  bucketVisitor() {
    log(`Bucketing ${this.tag} into v${this.variationIndex}.`);

    // Note: This needs to be run on every applicable page
    window.optimizely.push({
      type: 'bucketVisitor',
      experimentId: this.experimentId,
      variationId: this.experimentData.variations[this.variationIndex]?.id,
    });
  }
}

/**
 *
 * Creates a personalized AB test for Tory Burch.  Essentially just creates a number between 1-2 to determine whether or not to set the personalization test.
 * Force buckets user into v0 or v1 of a campaign for results analysis.
 *
 * @param {string} experimentId Eg. 20335204657
 * @param {number} recommenderType - Recommender to be updated, accepts cartRecommenderName, minicartRecommenderName, or pdpRecommenderName
 * @param {string} recommenderName - Name of recommender (provided by TB)
 */
 
PJS.recommenderObject = {
  recommenders: {},
};
 
class Recommender extends FeatureBase {
  constructor(recommenderType, recommenderName, experimentId, tag) {
    super(experimentId, tag, 'recommender');
    if (!recommenderType) throw new Error(`Invalid recommender type: ${recommenderType}`);
    if (!recommenderName) throw new Error(`Invalid recommender name: ${recommenderName}`);
 
    this.recommenderType = recommenderType;
    this.recommenderName = recommenderName;
  }
 
  activate() {
    super.bucketVisitor();
 
    // If v1 is active, activate the recommender change
    if (this.variationIndex > 0) {
      log(`[${this.tag}] Activating ${this.recommenderName} recommender!`);
      PJS.recommenderObject.recommenders[this.recommenderType] = this.recommenderName;
      window.localStorage.recObject = PJS.recommenderObject;
 
      if (!window.__AB_FEATURES__) window.__AB_FEATURES__ = {};
      window.__AB_FEATURES__.requestAbJson = ({ pathname, aemJson }) => {
        log(`pathname2`, pathname);
        log(`aemJson2`, aemJson);
 
        return PJS.recommenderObject;
      };
    } else {
      log(`[${this.tag}] Deactivating ${this.recommenderName} recommender!`);
    }
  }
}

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
 * @desc get() gets value of cookie
 *  @param {String} name - name of cookie to get
 *  @return {String|Null} - string value of cookie NOT A BOOL!
 *
 */
const getCookie = (name) => {
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    const c = ca[i].trim();
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

/**
 * @format 1.0.0
 *
 * @description Utility functions for modifying the product recommender section.
 *
 */

// Note: This can accessed from experiment code using `utils.setRecommender` as well.
PJS.utils.setRecommender = (recommenderType, recommenderName) => {
  PJS.recommenderObject = {
    recommenders: {},
  };

  if (recommenderType === 'custom') {
    PJS.recommenderObject[':items'] = {
      content: {
        ':items': {
          recommendations_caro: {
            recommendationSource: {
              recommendationSourceType: 'recommenderName',
              config: {
                recommenderName,
              },
            },
          },
        },
      },
    };
    log(`Set Custom Recommender to ${recommenderName}`);
  } else {
    if (!PJS.recommenderObject.recommenders) PJS.recommenderObject.recommenders = {};
    PJS.recommenderObject.recommenders[recommenderType] = recommenderName;
    log(`Set "${recommenderType}" Recommender to "${recommenderName}"`);
  }

  window.localStorage.recObject = PJS.recommenderObject;

  if (!window.__AB_FEATURES__) window.__AB_FEATURES__ = {};
  window.__AB_FEATURES__.requestAbJson = ({ pathname, aemJson }) => {
    log(`pathname`, pathname);
    log(`aemJson`, aemJson);

    return PJS.recommenderObject;
  };
};

/* if (!window.__AB_FEATURES__) window.__AB_FEATURES__ = {};
 // eslint-disable-next-line no-unused-vars
 window.__AB_FEATURES__.requestAbJson = ({ pathname, aemJson }) => {
   const recommendations = recommenderObject;
   recommenderObject = {}; // Reset the object after sending the package, preparing for the next SPA transition.
   log(`recommendations`, recommendations);

   return recommendations;
 };  */

const INTEGRATION_ID = '21810380082'; // Tory Burch Integration ID in Opty

/**
   * This will set the recommender values based on values provided in the custom integration
   */
onInitialized(() => {
  const { campaigns } = window.optimizely.get('data');
  for (const campaign of Object.values(campaigns)) {
    try {
      const audience = campaign.experiments?.[0].audienceName;
      if (audience.includes(`QA`) && !(window.location.search.includes(`cro_mode=qa`) || getCookie(`cro_mode`) === 'qa')) {
        PJS.log(`Audience not matched: aborting`);
      } else {
        const experimentID = campaign.experiments?.[0].id;
        const recommenderType = campaign?.integrationSettings?.[INTEGRATION_ID]?.recommenderType;
        const recommenderName = campaign?.integrationSettings?.[INTEGRATION_ID]?.recommenderName;
        const experimentTag = campaign?.integrationSettings?.[INTEGRATION_ID]?.experimentTag;  // Experiment tag is optional

        if (experimentID && recommenderType && recommenderName) {
          const rec = new Recommender(recommenderType, recommenderName, experimentID, experimentTag);
          rec.activate();
        }
      }
    } catch (e) {
      error(e);
    }
  }
});

}(`recommender-utils`);}catch(e){PJS.error(`recommender-utils`, e);}
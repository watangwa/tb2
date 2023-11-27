try{
!function(){
// ../../_includes/cromedics/cookies.ts
function getCookie(name) {
  const nameEQ = `${name}=`;
  const cookieArray = document.cookie.split(";");
  for (const cookie of cookieArray) {
    const cookieName = cookie.trim();
    if (cookieName.indexOf(nameEQ) === 0)
      return cookieName.substring(nameEQ.length, cookieName.length);
  }
  return null;
}

// ../../_includes/oli/optimizely/lifecycle.ts
function onInitialized(callback) {
  window.optimizely.initialized && callback() || window.optimizely.push({
    type: "addListener",
    filter: { type: "lifecycle", name: "initialized" },
    handler: callback
  });
}

// @oli:logs:@oli:logs:recommender-utils.module
var log = /* @__PURE__ */ (() => window.CRO_PJS.log.bind(window, "[recommender-utils.module]"))();
var error2 = /* @__PURE__ */ (() => window.CRO_PJS.error.bind(window, "recommender-utils.module"))();

// @oli:logs:@oli:logs:Recommender
var log2 = /* @__PURE__ */ (() => window.CRO_PJS.log.bind(window, "[Recommender]"))();

// @oli:logs:@oli:logs:FeatureBase
var log3 = /* @__PURE__ */ (() => window.CRO_PJS.log.bind(window, "[FeatureBase]"))();

// _includes/FeatureBase.ts
var validDomains = ["www.toryburch.com", "toryburch.com", "com.qa2.aem.toryburch.com", "com.stg.aem.toryburch.com", "com.uat.aem.toryburch.com", "na.preview.prod.aem.toryburch.com"];
var FeatureBase = class {
  constructor(experimentId, tag = `Experiment ID:${experimentId}`, keyPrefix = "bucketing") {
    if (!validDomains.includes(window.location.hostname))
      throw new Error("This can only be run on select domains.");
    this.keyPrefix = keyPrefix;
    this.experimentId = experimentId;
    this.experimentData = window.optimizely.get("data").experiments[this.experimentId];
    this.numVariations = this.experimentData.variations ? this.experimentData.variations.length : 2;
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
    const index = window.localStorage.getItem(this.localStorageKey);
    return index !== null ? parseInt(index) : null;
  }
  setStoredVariationIndex(variationIndex) {
    window.localStorage.setItem(this.localStorageKey, String(variationIndex));
  }
  getOptimizelyForcedIndex() {
    const forceParameter = new URLSearchParams(window.location.search).get("optimizely_x");
    if (forceParameter !== null) {
      const forceVariation = this.experimentData.variations.findIndex((o) => o.id === forceParameter.split(",")[0]);
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
    if (forcedIndex !== null)
      return forcedIndex;
    const storedIndex = this.getStoredVariationIndex();
    if (storedIndex !== null)
      return storedIndex;
    return Math.floor(Math.random() * this.numVariations);
  }
  /**
   * @param {number?} forceVariation [optional] index of the variation you want to force. 0 = v0, 1 = v1, etc
   */
  bucketVisitor() {
    log3(`Bucketing ${this.tag} into v${this.variationIndex}.`);
    window.optimizely.push({
      type: "bucketVisitor",
      experimentId: `${this.experimentId}`,
      variationId: `${this.experimentData.variations[this.variationIndex]?.id}`
    });
  }
};

// _includes/Recommender.ts
PJS.recommenderObject = {
  recommenders: {}
};
var Recommender = class extends FeatureBase {
  constructor(recommenderType, recommenderName, experimentId, tag) {
    super(experimentId, tag, "recommender");
    if (!recommenderType)
      throw new Error(`Invalid recommender type: ${recommenderType}`);
    if (!recommenderName)
      throw new Error(`Invalid recommender name: ${recommenderName}`);
    this.recommenderType = recommenderType;
    this.recommenderName = recommenderName;
  }
  activate() {
    super.bucketVisitor();
    if (this.variationIndex > 0) {
      log2(`[${this.tag}] Activating ${this.recommenderName} recommender!`);
      PJS.recommenderObject.recommenders[this.recommenderType] = this.recommenderName;
      window.localStorage.recObject = PJS.recommenderObject;
      if (!window.__AB_FEATURES__)
        window.__AB_FEATURES__ = {};
      window.__AB_FEATURES__.requestAbJson = ({ pathname, aemJson }) => {
        log2(`pathname2`, pathname);
        log2(`aemJson2`, aemJson);
        return PJS.recommenderObject;
      };
    } else {
      log2(`[${this.tag}] Deactivating ${this.recommenderName} recommender!`);
    }
  }
};

// _projectjs/recommender-utils.module.ts
function recommender_utils_module_default() {
  PJS.utils.setRecommender = (recommenderType, recommenderName) => {
    PJS.recommenderObject = {
      recommenders: {}
    };
    if (recommenderType === "custom") {
      PJS.recommenderObject[":items"] = {
        content: {
          ":items": {
            recommendations_caro: {
              recommendationSource: {
                recommendationSourceType: "recommenderName",
                config: {
                  recommenderName
                }
              }
            }
          }
        }
      };
      log(`Set Custom Recommender to ${recommenderName}`);
    } else {
      if (!PJS.recommenderObject.recommenders) {
        PJS.recommenderObject.recommenders = {};
      }
      PJS.recommenderObject.recommenders[recommenderType] = recommenderName;
      log(`Set "${recommenderType}" Recommender to "${recommenderName}"`);
    }
    window.localStorage.recObject = PJS.recommenderObject;
    if (!window.__AB_FEATURES__)
      window.__AB_FEATURES__ = {};
    window.__AB_FEATURES__.requestAbJson = ({ pathname, aemJson }) => {
      log(`pathname`, pathname);
      log(`aemJson`, aemJson);
      return PJS.recommenderObject;
    };
  };
  const INTEGRATION_ID = "21810380082";
  onInitialized(() => {
    if (!Array.isArray(window.optimizely)) {
      const { campaigns } = window.optimizely.get("data");
      for (const campaign of Object.values(campaigns)) {
        try {
          const audience = campaign.experiments?.[0].audienceName;
          if (audience.includes(`QA`) && !(window.location.search.includes(`cro_mode=qa`) || getCookie(`cro_mode`) === "qa")) {
            PJS.log(`Audience not matched: aborting`);
          } else {
            const experimentID = parseInt(campaign.experiments?.[0].id);
            const recommenderType = campaign?.integrationSettings?.[INTEGRATION_ID]?.recommenderType;
            const recommenderName = campaign?.integrationSettings?.[INTEGRATION_ID]?.recommenderName;
            const experimentTag = campaign?.integrationSettings?.[INTEGRATION_ID]?.experimentTag;
            if (experimentID && recommenderType && recommenderName) {
              const rec = new Recommender(recommenderType, recommenderName, experimentID, experimentTag);
              rec.activate();
            }
          }
        } catch (e) {
          error2(e);
        }
      }
    }
  });
}

// ../../recommender-utils.module.ts
recommender_utils_module_default({});

}();}catch(e){PJS.error(`recommender-utils.module`, e);}
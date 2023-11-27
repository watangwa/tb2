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

// @oli:logs:@oli:logs:initFeatureFlag.module
var log = /* @__PURE__ */ (() => window.CRO_PJS.log.bind(window, "[initFeatureFlag.module]"))();
var error2 = /* @__PURE__ */ (() => window.CRO_PJS.error.bind(window, "initFeatureFlag.module"))();

// @oli:logs:@oli:logs:FeatureFlag
var log2 = /* @__PURE__ */ (() => window.CRO_PJS.log.bind(window, "[FeatureFlag]"))();

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

// _includes/FeatureFlag.ts
if (!window.__AB_FEATURES__)
  window.__AB_FEATURES__ = {};
var FeatureFlag = class extends FeatureBase {
  constructor(featureConfig, experimentId, tag) {
    super(experimentId, tag, "feature");
    this.variationFeatures = [
      []
      // initalize v0 with no features
    ];
    if (!featureConfig)
      throw new Error("Invalid feature flags configuration.");
    let defaultVariationFeatures = [];
    if (typeof featureConfig === "string") {
      defaultVariationFeatures = [featureConfig];
    } else if (Array.isArray(featureConfig)) {
      if (!featureConfig.length)
        throw new Error("Invalid feature flags configuration.");
      defaultVariationFeatures = featureConfig;
    }
    for (let variationIndex = 1; variationIndex < this.numVariations; variationIndex++) {
      this.variationFeatures[variationIndex] = defaultVariationFeatures;
    }
    if (typeof featureConfig === "object" && !Array.isArray(featureConfig)) {
      const variationTags = Object.keys(featureConfig);
      for (const variationTag of variationTags) {
        const variationIndex = parseInt(variationTag.substring(1));
        if (!Number.isInteger(variationIndex) || variationIndex >= this.numVariations) {
          throw new Error(`Invalid feature flags configuration: "${variationTag}" variation is invalid.`);
        }
        const features = featureConfig[variationTag];
        this.variationFeatures[variationIndex] = typeof features === "string" ? [features] : features;
      }
    }
  }
  /**
   * The Tory Burch site allows for certain force query parameters to turn on these feature flags.
   * Feature flags turned on using this method overrides the use of `window.__AB_FEATURES__` and the
   * flag is automatically persisted in localStorage key `persistenceFeatures`.
   *
   * @example https://www.toryburch.com/en-us/clothing/dresses/?nfp=true essentially turns on the
   * `window.__AB_FEATURES__['nfp'] = true` flag, however it doesn't actually use the `window.__AB_FEATURES__` object.
   * The query param overrides whatever we set in `window.__AB_FEATURES__` so these settings may conflict with one another.
   * The localStorage that it sets (`persistenceFeatures`) also overrides whatever is in `window.__AB_FEATURES__`.
   */
  detectFeatureForceParam() {
    const urlParams = new URLSearchParams(window.location.search);
    for (const i in this.variationFeatures) {
      const variationIndex = parseInt(i);
      const features = this.variationFeatures[i];
      for (const f in features) {
        const param = urlParams.get(features[f]);
        if (param !== null) {
          return param === "true" ? variationIndex : 0;
        }
      }
    }
    return null;
  }
  getVariationIndex() {
    const forceParamIndex = this.detectFeatureForceParam();
    if (forceParamIndex !== null)
      return forceParamIndex;
    return super.getVariationIndex();
  }
  activate() {
    super.bucketVisitor();
    const features = this.variationFeatures[this.variationIndex];
    if (features.length) {
      log2(`[${this.tag}] Activating ${features.join(", ")} feature flag(s)!`);
      features.forEach((feature) => {
        if (feature.includes(",")) {
          feature.split(",").forEach((thisFeature) => {
            window.__AB_FEATURES__[thisFeature] = true;
          });
        } else {
          window.__AB_FEATURES__[feature] = true;
        }
      });
    }
  }
};

// _projectjs/initFeatureFlag.module.ts
var INTEGRATION_ID = "21808030171";
var parseFeatureFlags = (flags) => {
  const firstCharacter = flags.trimStart().substring(0, 1);
  if (firstCharacter === "[" || firstCharacter === "{")
    return JSON.parse(flags);
  return flags.split(",").map((item) => item.trim());
};
function initFeatureFlag_module_default() {
  onInitialized(() => {
    const { campaigns } = window.optimizely.get("data");
    for (const campaign of Object.values(campaigns)) {
      try {
        const audience = campaign.experiments?.[0].audienceName;
        if (audience.includes(`QA`) && !(window.location.search.includes(`cro_mode=qa`) || getCookie(`cro_mode`) === "qa")) {
          log(`Audience not matched: aborting`);
        } else {
          const experimentID = parseInt(campaign.experiments?.[0].id);
          const integrationData = campaign?.integrationSettings?.[INTEGRATION_ID];
          const features = integrationData?.features;
          const experimentTag = integrationData?.experimentTag;
          if (experimentID && features) {
            const flag = new FeatureFlag(parseFeatureFlags(features), experimentID, experimentTag);
            flag.activate();
          }
        }
      } catch (e) {
        error2(e);
      }
    }
  });
}

// ../../initFeatureFlag.module.ts
initFeatureFlag_module_default({});

}();}catch(e){PJS.error(`initFeatureFlag.module`, e);}
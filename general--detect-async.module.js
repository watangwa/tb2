try{
!function(){
// ../../_projectjs/general/detect-async.module.ts
function detect_async_module_default() {
  if (document.body) {
    PJS.log("Nonstandard snippet loading detected! See https://support.crometrics.com/engineering/why-to-not-use-async-snippet-installations for details.");
  }
}

// ../../general__detect-async.module.ts
detect_async_module_default({});

}();}catch(e){PJS.error(`general/detect-async.module`, e);}
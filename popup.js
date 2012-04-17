
var env = {
  context: new webkitAudioContext(),
  buffers: {},
  requests: {},
  howMany: 0,
  convolverNames: ["kitchen", "telephone", "spring"],
  typesToBuffers: {
             image: "start",
        stylesheet: "cache",
            script: "note",
    xmlhttprequest: "cache"
  }
};

var sampleMap = {
              fail: "hat",
              note: "A3",
             cache: "aohat",
             start: "snare",
             fetch: "ahat",
            spring: "spring",
            guitar: "guitar_a",
           ukelele: "ukelele_a",
           kitchen: "kitchen",
           trumpet: "trumpet_g",
           kitchen: "kitchen",
         telephone: "telephone"
};

loadSamplesFromMap(env, sampleMap, "sounds/*.wav", function() {
  attachBuffersToConvolvers(env);

  var permissions = { urls: ["*://*/*"] };

  chrome.webRequest.onBeforeRequest.addListener(function(details) {
    notifyRequestStart(env, details);
  }, permissions, []);

  chrome.webRequest.onCompleted.addListener(function(details) {
    notifyRequestStop(env, details);
  }, permissions, ["responseHeaders"]);

//   var rate = 1;
//
//   setInterval(function() {
//     playSample(env, {
//       buffer: "guitar",
//       convolver: "spring",
//       volume: 0.45,
//       pan: Math.random() * 10 - 5,
//       rate: rate
//     });
//
//     rate = rate + 1;
//   }, 300);
//
//   setInterval(function() {
//     playSample(env, {
//       buffer: "ukelele",
//       convolver: "spring",
//       volume: 0.35,
//       pan: Math.random() * 10 - 5,
//       rate: rate
//     });
//
//     rate = Math.round(Math.random() * 10);
//   }, 800);
//
//   setInterval(function() {
//     playSample(env, {
//       buffer: "note",
//       convolver: "spring",
//       volume: 0.35,
//       pan: 0,
//       rate: Math.random() > 0.5 ? 1 : 3
//     });
//   }, 1000);
});

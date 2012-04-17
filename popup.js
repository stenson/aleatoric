
var context = new webkitAudioContext();

var env = {
  context: context,
  buffers: {},
  requests: {},
  howMany: 0,
  convolver: context.createConvolver()
};

var permissions = {
  urls: ["*://*/*"]
};

// var soundMap = {
//   "": {
//
//   }
// };

loadAndSaveSample(env, "sounds/aohat.wav", "cache");
loadAndSaveSample(env, "sounds/snare.wav", "start");
loadAndSaveSample(env, "sounds/hat.wav", "fail");
loadAndSaveSample(env, "sounds/ahat.wav", "fetch");
loadAndSaveSample(env, "sounds/A3.wav", "note");

// reverb it
loadAndSaveSample(env, "sounds/kitchen.wav", "kitchen", function(buffer) {
  env.convolver.buffer = buffer;
  env.convolver.connect(env.context.destination);
});

chrome.webRequest.onBeforeRequest.addListener(function(details) {
  notifyRequestStart(env, details);
}, permissions, []);

chrome.webRequest.onCompleted.addListener(function(details) {
  notifyRequestStop(env, details);
}, permissions, ["responseHeaders"]);

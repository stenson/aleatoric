
var env = {
  context: new webkitAudioContext(),
  buffers: {},
  requests: {},
  holds: {},
  heldNotes: [],
  howMany: 0,
  convolverNames: ["kitchen", "telephone", "spring"],
  runtimes: [],
  chords: [
    [0, 2, 3, 7, 9, 11],
    //[2, 4, 9],
    //[5, 9, 11]
    //[2, 5, 9, 10],
    //[3, 6, 8, 10]
  ],
  currentChord: 0,
  typesToBuffers: {
             image: "cache", //"cache",
        stylesheet: "note", //"note",
            script: "guitar", //fetch",
    xmlhttprequest: "ukelele",
        main_frame: "bass",
            object: "cowbell"
  },
  enabled: true
};

var sampleMap = {
        bass: "kick3",
        fail: "hat",
        note: "A3",
       cache: "aohat",
       start: "snare",
       piano: "piano",
       fetch: "ahat",
      spring: "spring",
      guitar: "guitar_a",
     ukelele: "ukelele_a",
     kitchen: "kitchen",
     trumpet: "trumpet_g",
     kitchen: "kitchen",
   telephone: "telephone",
     cowbell: "cowbell",
      sosumi: "sosumi"
};

loadSamplesFromMap(env, sampleMap, "sounds/*.wav", function() {
  env.gain = env.context.createGainNode();
  env.gain.connect(env.context.destination);
  env.compressor = env.context.createDynamicsCompressor();
  env.compressor.connect(env.gain);
  //env.gain.gain.value = 0.05;

  attachBuffersToConvolvers(env);
  env.buffers.sine = writeSineBuffer(env.context);

  killRunawayRings(env);
  changeChordIntermittently(env);

  var permissions = { urls: ["*://*/*"] };

  chrome.webRequest.onBeforeRequest.addListener(function(details) {
    env.enabled && notifyRequestStart(env, details);
  }, permissions, []);

  chrome.webRequest.onCompleted.addListener(function(details) {
    env.enabled && notifyRequestStop(env, details);
  }, permissions, ["responseHeaders"]);

  chrome.webRequest.onErrorOccurred.addListener(function(details) {
    killAlreadyRinging(env, details);
  }, permissions);
});

chrome.browserAction.onClicked.addListener(function() {
  console.log("hello");
  env.enabled = !env.enabled;
});

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {

});

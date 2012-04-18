
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
  }
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
  env.compressor = env.context.createDynamicsCompressor();
  env.compressor.connect(env.context.destination);

  attachBuffersToConvolvers(env);
  env.buffers.sine = writeSineBuffer(env.context);

  killRunawayRings(env);
  changeChordIntermittently(env);

  var permissions = { urls: ["*://*/*"] };

  chrome.webRequest.onBeforeRequest.addListener(function(details) {
    notifyRequestStart(env, details);
  }, permissions, []);

  chrome.webRequest.onCompleted.addListener(function(details) {
    notifyRequestStop(env, details);
  }, permissions, ["responseHeaders"]);

  // chrome.webRequest.onErrorOccurred.addListener(function(details) {
  //   console.log("ERROR");
  // }, permissions);
});

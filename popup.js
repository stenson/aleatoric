
var env = {
  context: new webkitAudioContext(),
  buffers: {},
  requests: {},
  holds: {},
  howMany: 0,
  convolverNames: ["kitchen", "telephone", "spring"],
  runtimes: [],
  chords: [
    [0, 2, 4, 9, 11],
    [2, 5, 9, 10],
    [3, 6, 8, 10]
  ],
  currentChord: 0,
  typesToBuffers: {
             image: "cache", //"cache",
        stylesheet: "note", //"note",
            script: "piano", //fetch",
    xmlhttprequest: "piano",
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

setInterval(function() {
  if (++env.currentChord == env.chords.length) env.currentChord = 0;
  //env.currentChord = (env.currentChord == env.chords.length - 1) ? 0 : env.currentChord + 1;
}, 5000);

loadSamplesFromMap(env, sampleMap, "sounds/*.wav", function() {
  attachBuffersToConvolvers(env);
  env.buffers.sine = writeSineBuffer(env.context);

  setTimeout(function() {
    playSample(env, {
      buffer: "sine",
      convolver: "kitchen",
      pan: -10.0
    });
  }, 1000);

  var permissions = { urls: ["*://*/*"] };

  chrome.webRequest.onBeforeRequest.addListener(function(details) {
    notifyRequestStart(env, details);
  }, permissions, []);

  chrome.webRequest.onCompleted.addListener(function(details) {
    notifyRequestStop(env, details);
  }, permissions, ["responseHeaders"]);
});

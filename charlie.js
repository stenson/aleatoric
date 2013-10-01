
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
    [0, 2, 3, 7, 9, 11]
  ],
  currentChord: 0,
  typesToBuffers: {
    image:          "fetch",
    stylesheet:     "note",
    script:         "guitar",
    xmlhttprequest: "ukelele",
    main_frame:     "bass",
    object:         "cowbell"
  },
  enabled: true
};

var sampleMap = {
  bass: "kick3",
  fail: "sosumi",
  note: "A3",
  cache: "aohat",
  start: "snare",
  fetch: "ahat",
  spring: "spring",
  guitar: "guitar_a",
  sosumi: "sosumi",
  ukelele: "ukelele_a",
  kitchen: "kitchen",
  kitchen: "kitchen",
  cowbell: "cowbell",
  telephone: "telephone"
};

var permissions = { urls: ["*://*/*"] };

loadSamplesFromMap(env, sampleMap, "sounds/*.wav", function() {
  env.gain = env.context.createGainNode();
  env.gain.connect(env.context.destination);
  env.compressor = env.context.createDynamicsCompressor();
  env.compressor.connect(env.gain);

  attachBuffersToConvolvers(env);
  env.buffers.sine = writeSineBuffer(env.context);

  killRunawayRings(env);

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

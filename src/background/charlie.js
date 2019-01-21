
var env = {
  context: new AudioContext(),
  buffers: {},
  requests: {},
  holds: {},
  heldNotes: [],
  hostnameWhitelist: [],
  howMany: 0,
  convolverNames: ["kitchen", "telephone", "spring"],
  runtimes: [],
  onlyForActiveTab: true,
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
  enabled: false
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

function onlyForActiveTab(fn, env){
  return function(details){
    if (env.onlyForActiveTab) {
      chrome.tabs.get(details.tabId, (tab) => {
        tab && tab.active && fn(details);
      });
    } else {
      fn(details);
    }
  }
};

chrome.tabs.onActivated.addListener(function(){
  if(env.onlyForActiveTab) {
    quickKillAllRings(env);
  }
})

loadSamplesFromMap(env, sampleMap, "sounds/*.wav", function() {
  env.gain = env.context.createGain();
  env.gain.connect(env.context.destination);
  env.compressor = env.context.createDynamicsCompressor();
  env.compressor.connect(env.gain);

  attachBuffersToConvolvers(env);
  env.buffers.sine = writeSineBuffer(env.context);

  killRunawayRings(env);

  chrome.webRequest.onBeforeRequest.addListener(
    onlyForActiveTab(
      function(details) {
        env.enabled && notifyRequestStart(env, details);
      },
      env
    ), permissions, []);

  chrome.webRequest.onCompleted.addListener(
    onlyForActiveTab(
      function(details) {
        env.enabled && notifyRequestStop(env, details);
      },
      env
    ), 
    permissions, ["responseHeaders"]);

  chrome.webRequest.onErrorOccurred.addListener(
    onlyForActiveTab(
      function(details) {
        killAlreadyRinging(env, details);
      },
      env
    ),
    permissions);
});

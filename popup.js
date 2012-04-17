
var env = {
  context: new webkitAudioContext(),
  buffers: {},
  requests: {},
  howMany: 0,
  convolverNames: ["kitchen", "telephone", "spring"],
  typesToBuffers: {
             image: "cache",
        stylesheet: "note",
            script: "fetch",
    xmlhttprequest: "ukelele"
  },
  runtimes: [],
  chords: [
    [1, 3, 6, 7],
    [0, 2, 5, 9, 11],
    [2, 5, 7, 9]
  ],
  currentChord: 0
};

setInterval(function() {
  if (env.currentChord == env.chords.length - 1) {
    env.currentChord = 0;
  } else {
    env.currentChord = env.currentChord + 1;
  }
}, 5000);

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


  var intervals = [0, 2, 4, 7, 9, 11];

  var count = 1;
  var a = Math.pow(2, 1/12);

  var note = function(i) {
    return Math.pow(a, i);
  };

  // setInterval(function() {
  //
  //   playSample(env, {
  //     buffer: "ukelele",
  //     convolver: "telephone",
  //     volume: 0.45,
  //     pan: 5.0,
  //     rate: note(intervals[Math.floor(Math.random()*intervals.length)] + 12)
  //   });
  //
  //   playSample(env, {
  //     buffer: "guitar",
  //     convolver: "telephone",
  //     volume: 0.45,
  //     pan: -10.0,
  //     rate: note(intervals[Math.floor(Math.random()*intervals.length)] + 12)
  //   });
  //
  // }, 100);

  // var rate = 1;
  //
  // setInterval(function() {
  //   playSample(env, {
  //     buffer: "guitar",
  //     convolver: "spring",
  //     volume: 0.45,
  //     pan: Math.random() * 10 - 5,
  //     rate: rate
  //   });
  //
  //   rate = rate + 1;
  // }, 100);
  //
  // setInterval(function() {
  //   playSample(env, {
  //     buffer: "ukelele",
  //     convolver: "spring",
  //     volume: 0.35,
  //     pan: Math.random() * 10 - 5,
  //     rate: rate
  //   });
  //
  //   rate = Math.round(Math.random() * 10);
  // }, 500);
  //
  // setInterval(function() {
  //   playSample(env, {
  //     buffer: "note",
  //     convolver: "spring",
  //     volume: 0.35,
  //     pan: 0,
  //     rate: Math.random() > 0.5 ? 1 : 3
  //   });
  // }, 800);
});

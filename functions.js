var loadSampleWithUrl = function(context, url, callback, errback) {
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";

  request.onload = function() {
    context.decodeAudioData(request.response, callback, errback);
  };

  request.send();
};

var loadAndSaveSample = function(env, url, name, callback) {
  loadSampleWithUrl(env.context, url, function(buffer) {
    env.buffers[name] = buffer;
    if (callback) callback(buffer);
  });
};

var loadSamplesFromMap = function(env, map, pattern, cback) {
  var requests = 0;
  Object.keys(map).forEach(function(name) {
    requests++;
    loadAndSaveSample(env, pattern.replace("*", map[name]), name, function() {
      if (--requests == 0) cback();
    });
  });
};

var attachBuffersToConvolvers = function(env) {
  env.convolvers = {};

  env.convolverNames.forEach(function(name) {
    env.convolvers[name] = env.context.createConvolver();
    env.convolvers[name].buffer = env.buffers[name];
    env.convolvers[name].connect(env.compressor);
  });
};

var closestFromList = function(list, x) {
  var closest = list[0];
  var shortest = Math.abs(x - closest);

  for (var i = 1; i < list.length; i++) {
    var n = list[i];
    var interval = Math.abs(x - n);

    if (interval === 0) {
      return x;
    } else if(interval < shortest) {
      closest = n;
      shortest = interval;
    } else {
      return closest;
    }
  }

  return closest;
};

var autoTune = (function() {
  var a = Math.pow(2, 1/12);

  return function(env, f) {
    var n = Math.round(Math.log(f / 1) / Math.log(a));
    var adjust = Math.floor(n/12);
    var m = n % 12;
    var closest = closestFromList(env.chords[env.currentChord], m);
    return Math.pow(a, (closest + (adjust*12)));
  };
})();

var playSample = function(env, hash) {
  /* .rate, .volume, .buffer, .convolver, .pan */

  var context = env.context;
  var source = context.createBufferSource();
  var panner = context.createPanner();
  var dryGain = context.createGain();
  var wetGain = context.createGain();
  var rate = hash.rate || 1;

  if (hash.loop) source.loop = true;

  source.playbackRate.value = hash.autoTune ? autoTune(env, rate) : rate;
  wetGain.gain.value = hash.volume || 1;
  dryGain.gain.value = (hash.volume || 1) / 5;
  source.buffer = env.buffers[hash.buffer];

  panner.setPosition(hash.pan||0.0, 0, 0);
  source.connect(panner);
  panner.connect(dryGain);
  panner.connect(wetGain);
  wetGain.connect(env.convolvers[hash.convolver || "kitchen"]);
  //dryGain.connect(context.destination);

  source.start(hash.start || 0);

  hash.source = source;
  hash.ran = context.currentTime;
  hash.wetNode = wetGain;
  return hash;
};

var writeSineBuffer = function(context) {
  var buffer = context.createBuffer(1, 44100, 44100);
  var c0 = buffer.getChannelData(0);
  var amp = 0.5;

  for (var i = 0; i < 44100; i++) {
    if (i > 30000 && amp > 0) {
      amp -= 0.05
    }
    c0[i] = amp * Math.sin(i / (44100 / (220 * 2 * Math.PI)));
  }

  return buffer;
};

var killRunawayRings = function(env) {
  setInterval(function() {
    var stillHeld = [];

    env.heldNotes.forEach(function(note) {
      if (env.context.currentTime - note.ran > 5) {
        note.source.loop = false;
        note.source.stop(0);
      } else {
        stillHeld.push(note);
      }
    });

    env.heldNotes = stillHeld;
  }, 1000);
};

var randomPan = function() {
  return Math.random()*5 - 2.5
};

// pre: seed is a string

function pseudoRandom(seed){
  return parseInt(md5(seed), 16)/ (2**128);
}

const nonce = Math.random();

function deterministicPan(details){
  const largeKey = details.method + " " + details.url.split('?')[0];
  const smallKey = 'small key: ' + details.url; // including qstring
  const isXHR = details.type === "xmlhttprequest";
  const largeSpread = isXHR ? 0.7 : 0.9;
  const smallSpread = isXHR ? 0.1 : 0.1;
  const pan = ((pseudoRandom(largeKey + nonce) - 0.5) * largeSpread) +
         ((pseudoRandom(smallKey + nonce) - 0.5) * smallSpread);
  return pan;
}

var killAlreadyRinging = function(env, details) {
  var alreadyExists = env.holds[details.requestId];
  if (alreadyExists) {
    alreadyExists.source.stop(0);
  }
};

var notifyRequestStart = function(env, details) {
  var soundPan = deterministicPan(details);

  killAlreadyRinging(env, details);

  env.holds[details.requestId] = playSample(env, {
    buffer: "sine",
    convolver: "telephone",
    rate: Math.random()*10 + 10,
    pan: soundPan,
    autoTune: true,
    volume: 0.01,
    loop: true,
    details: details
  });

  env.heldNotes.push(env.holds[details.requestId]);

  env.howMany++;
  env.requests[details.requestId] = playSample(env, {
    buffer: "start",
    convolver: "kitchen",
    volume: 0.35,
    pan: soundPan,
    rate: Math.random()*5 + 3,
    autoTune: true
  });
};

var notifyRequestStop = function(env, details) {
  env.howMany--;

  var previous = env.holds[details.requestId];

  if (previous) {
    previous.source.loop = false;
    previous.source.stop(0);
    delete env.holds[details.requestId];
  }

  var contentLength = 0;
  var requestSample = env.requests[details.requestId];
  if (!requestSample) return;

  var runtime = env.context.currentTime - requestSample.ran;

  details.responseHeaders.forEach(function(header) {
    var name = header.name.toLowerCase();
    if (name === "content-length") contentLength = header.value;
  });

  if (details.statusCode > 400) {
    playSample(env, {
      buffer: "sosumi",
      convolver: "spring",
      pan: previous.pan || 0.0,
      rate: 1,
      volume: 0.45
    });
  } else {
    var buffer = env.typesToBuffers[details.type] || "fetch";
    playSample(env, {
      buffer: buffer,
      convolver: details.fromCache ? "telephone" : "spring",
      volume: 0.35,
      pan: previous.pan || randomPan(),
      rate: Math.min(20000 / (contentLength * 2), 20),
      autoTune: true
    });
  }
};

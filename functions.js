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
    env.convolvers[name].connect(env.context.destination);
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

    console.log(f, n, closest, closest+(adjust*12));
    return Math.pow(a, (closest + (adjust*12)));
  };
})();

var playSample = function(env, hash) {
  /* .rate, .volume, .buffer, .convolver, .pan */

  var context = env.context;
  var source = context.createBufferSource();
  var panner = context.createPanner();
  var dryGain = context.createGainNode();
  var wetGain = context.createGainNode();

  //console.log(hash.rate);
  //var rate = autoTune(env, hash.rate || 1);
  //autoTune(env, hash.rate);
  //source.playbackRate.value = (hash.rate || 1);
  source.playbackRate.value = autoTune(env, hash.rate || 1);
  wetGain.gain.value = hash.volume || 1;
  dryGain.gain.value = (hash.volume || 1) / 4;
  source.buffer = env.buffers[hash.buffer];

  panner.setPosition(hash.pan, 0, 0);
  source.connect(panner);
  panner.connect(dryGain);
  panner.connect(wetGain);
  wetGain.connect(env.convolvers[hash.convolver || "kitchen"]);
  dryGain.connect(context.destination);

  source.noteOn(hash.start || 0);

  //console.log(source.playbackRate.value);
  hash.source = source;
  hash.ran = context.currentTime;
  return hash;
};

var processSignal = function(signal, event) {
  var sampleRate = signal.context.sampleRate;
  var right = event.outputBuffer.getChannelData(0);
  var left = event.outputBuffer.getChannelData(1);

  for(var i = 0, l = right.length; i < l; ++i) {
    signal.x = signal.x + 1;
    var val = signal.amplitude  * Math.sin(signal.x / (sampleRate / (signal.frequency * 2 * Math.PI)));
    right[i] = left[i] = val;
  }
};

var buildSignal = function(env, frequency) {
  var signal = {
    x: 0,
    amplitude: 0.15,
    frequency: frequency,
    node: env.context.createJavaScriptNode(128, 1, 1),
    context: env.context
  };

  signal.node.onaudioprocess = function(event) {
    processSignal(signal, event);
  };

  signal.node.connect(env.context.destination);
  return signal;
};

var notifyRequestStart = function(env, details) {
  //console.log("start", details);
  //env.requests[details.requestId] = buildSignal(env, 110 + (env.howMany*100));

  env.howMany++;

  var pan = Math.random()*10 - 5;

  env.requests[details.requestId] = playSample(env, {
    buffer: "start",
    convolver: "kitchen",
    volume: 0.75,
    pan: (pan > 0) ? (pan + 5) : (pan - 5),
    rate: Math.random()*5 + 3
  });
};

var notifyRequestStop = function(env, details) {
  //console.log("stop", details);
  env.howMany--;
  //env.requests[details.requestId].node.disconnect();

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
      buffer: "trumpet",
      convolver: "spring",
      pan: 0.0,
      rate: 1.9
    });
  } else {
    var buffer = env.typesToBuffers[details.type] || "fetch";

    playSample(env, {
      buffer: buffer,
      convolver: details.fromCache ? "telephone" : "spring",
      volume: 0.95,
      pan: requestSample.pan || Math.random()*10 - 5,
      //pan: (runtime - 0.25) * 20 + (Math.random()*3-1.5),
      rate: 20000 / (contentLength * 2)
    });
  }
};


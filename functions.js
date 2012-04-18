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

    //adjust = Math.max(Math.min(adjust, 5), -2);

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
  var rate = hash.rate || 1;

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

  source.noteOn(hash.start || 0);

  hash.source = source;
  hash.ran = context.currentTime;
  return hash;
};

var writeSineBuffer = function(context) {
  var buffer = context.createBuffer(1, 44100, 44100);
  var channel = buffer.getChannelData(0);

  for (var i = 0; i < 44100; i++)
    channel[i] = 0.5 * Math.sin(i / (44100 / (220 * 2 * Math.PI)));

  return buffer;
};

// var generateTone = function(freq, level, duration) {
//   var tone = new Float32Array(duration);
//   var factors = [0.5, 0.4, 0.3, 0.25, 0.15, 0.1, 0.1];
//   var factorsLength = factors.length;
//   var twoPiFreq = 2 * Math.PI * freq;
//   var val;
//   var omega;
//   for (var i = 0; i < duration; i++) {
//     var omega = twoPiFreq * i / 44110;
//     val = 0;
//     for (var j = 0; j < factorsLength; j++) {
//       val += factors[j] * Math.sin(omega * (j + 1));
//     }
//     tone[i] = level * val;
//   }
//   return tone;
// };

var processSignal = function(signal, event) {
  var sampleRate = signal.context.sampleRate;
  var right = event.outputBuffer.getChannelData(0);
  var left = event.outputBuffer.getChannelData(1);

  for(var i = 0, l = right.length; i < l; ++i) {
    signal.x = signal.x + 1;
    var val = signal.amplitude * Math.sin(signal.x / (sampleRate / (signal.frequency * 2 * Math.PI)));
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
  //env.holds[details.requestId] = buildSignal(env, 110 + (env.howMany*100));

  var pan = Math.random()*10 - 5;

  env.howMany++;
  env.requests[details.requestId] = playSample(env, {
    buffer: "start",
    convolver: "kitchen",
    volume: 0.35,
    pan: (pan > 0) ? (pan + 10) : (pan - 10),
    rate: Math.random()*5 + 3,
    autoTune: true
  });
};

var notifyRequestStop = function(env, details) {
  env.howMany--;
  env.holds[details.requestId] && env.holds[details.requestId].node.disconnect();
  delete env.holds[details.requestId];

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
      pan: 0.0,
      rate: 1,
      volume: 0.5
    });
  } else {
    var buffer = env.typesToBuffers[details.type] || "fetch";

    playSample(env, {
      buffer: buffer,
      convolver: details.fromCache ? "telephone" : "spring",
      volume: 0.35,
      pan: Math.random()*5 - 2.5,
      rate: 20000 / (contentLength * 2),
      autoTune: true
    });
  }
};


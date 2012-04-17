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

var playSampleWithBuffer = function(env, buffer, start, volume, rate, position) {
  var context = env.context;
  var source = context.createBufferSource();
  var panner = context.createPanner();
  var dryGain = context.createGainNode();
  var wetGain = context.createGainNode();

  source.playbackRate.value = rate;
  dryGain.gain.value = volume;
  wetGain.gain.value = volume;
  source.buffer = buffer;

  panner.setPosition(position, 0.0, 0.0);
  source.connect(panner);

  panner.connect(dryGain);
  panner.connect(wetGain);

  wetGain.connect(env.convolver);
  dryGain.connect(context.destination);

  source.noteOn(start);

  return source;
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
  env.howMany++;
  //env.requests[details.requestId] = buildSignal(env, 110 + (env.howMany*100));
  playSampleWithBuffer(env, env.buffers.start, 0, 0.05, 1, (Math.random()*20)-10);
};

var notifyRequestStop = function(env, details) {
  env.howMany--;
  //env.requests[details.requestId].node.disconnect();

  var contentLength = 0;
  details.responseHeaders.forEach(function(header) {
    if (header.name === "Content-Length") contentLength = header.value;
  });

  if (details.statusCode > 400) {
    console.log(details.statusCode, details.url);
    playSampleWithBuffer(env, env.buffers.fail, 0, 1, 1, -5.0);
  } else {
    var rate = 20000 / (contentLength * 2);
    var buffer = details.fromCache ? env.buffers.cache : env.buffers.fetch;
    var volume = details.fromCache ? 0.15 : 0.75;
    playSampleWithBuffer(env, buffer, 0, 0.5, rate, (Math.random()*10)-5);
  }
};


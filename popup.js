var bgPage = chrome.extension.getBackgroundPage();
var env = bgPage.env;
var sampleMap = bgPage.sampleMap;
var byId = document.getElementById.bind(document);

console.log(sampleMap);

var handle = function(eventName, el, cback) {
  el.addEventListener(eventName, function(event) {
    cback(event, el);
  }, true);
};

handle("mousedown", byId("toggle"), function(event, el) {
  env.enabled = !env.enabled;
  el.value = el.getAttribute(env.enabled ? 'data-off' : 'data-on');
});

var volume = byId("volume");
volume.value = env.gain.gain.value;
handle("mouseup", volume, function(event, el) {
  env.gain.gain.value = el.value;
});

var makeButton = function(name, sound) {
  var btn = document.createElement("button");
  btn.appendChild(document.createTextNode(name));
  handle("mousedown", btn, function() {
    bgPage.playSample(env, {
      buffer: sound,
      convolver: "spring",
      volume: 0.35,
      pan: 0,
      rate: 1,
      autoTune: false
    });
  });
  return btn;
};

var types = byId("request-types");
for (var bufferName in env.typesToBuffers) {
  types.appendChild(makeButton(bufferName, env.typesToBuffers[bufferName]));
}

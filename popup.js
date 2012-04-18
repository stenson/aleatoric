
var env = chrome.extension.getBackgroundPage().env;
var byId = document.getElementById.bind(document);

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
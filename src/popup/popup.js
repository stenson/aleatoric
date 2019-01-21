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

// Initialize the toggle button 
var toggleBtn = byId("enable-aleatoric");
handle("click", toggleBtn, function(event, el) {
  env.enabled = el.checked;
});
toggleBtn.checked = env.enabled;
// End initialize the toggle button

// Initialize the toggle button for active tabs 
var currentTabBtn = byId("current-tab");
handle("click", currentTabBtn, function(event, el) {
  env.onlyForActiveTab = el.checked;
  if (env.onlyForActiveTab) {
    bgPage.quickKillAllRings(env);
  }
});
currentTabBtn.checked = env.onlyForActiveTab;
// End initialize the toggle button


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

function removeWhitelistEntry(elem, hostname){
  var idx = env.hostnameWhitelist.indexOf(hostname);
  if (idx >= 0) {
    env.hostnameWhitelist.splice(idx, 1);
  }
  elem.remove();
}

// Whitelist code:
var whitelist = byId('whitelist');
var whitelistForm = byId('whitelist-adder');
function makeWhitelistEntry(hostname){
  var text = document.createTextNode(hostname);
  var btn = document.createElement('button');
  btn.innerHTML = 'x';
  var li = document.createElement('li');
  li.appendChild(text);
  li.appendChild(btn)
  handle('click', btn, function(){
    removeWhitelistEntry(li, hostname);
  });
  return li;
}

function addHostToListElem(hostname){
  whitelist.appendChild(makeWhitelistEntry(hostname));
}

handle('submit', whitelistForm, function(e){
  e.preventDefault();
  var hostname = whitelistForm[0].value;
  env.hostnameWhitelist.push(hostname);
  addHostToListElem(hostname);
  whitelistForm[0].value = '';
  byId('');
});

env.hostnameWhitelist.forEach(addHostToListElem);

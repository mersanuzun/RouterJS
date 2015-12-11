/**
 * Created by erdi.taner.gokalp on 07/12/15.
 */
(function() {
  "use strict";

  function uuid() {
    return "$$_" + "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0;
      var v = c == "x" ? r : r&0x3 | 0x8;
      return v.toString(16);
    });
  }

  function fetch(url) {
    return new Promise(function(resolve, reject) {
      var xhr = window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            resolve(xhr.response);
          }
          reject("Failed to load resource from " + url);
        }
      };
      xhr.onerror = function(error) {
        reject(error);
      };
      xhr.send();
    });
  }

  function fetchTemplate(state) {
    return new Promise(function(resolve) {
      if (state.template) {
        resolve(state.template);
      } else if (state.templateUrl) {
        resolve(fetch(state.templateUrl));
      } else {
        console.error("No template provided");
        reject(null);
      }
    });
  }

  var $$routerView = document.querySelector("[data-router-view]");
  var $$routes = {};
  var $$controllers = {};
  var $$active;
  var $$otherwise;

  var $$events = {
    stateChangeStart: "$stateChangeStart",
    stateChangeEnd: "$stateChangeEnd",
    stateChangeError: "$stateChangeError"
  };

  function Router() {

    function extractRoutesWithParameters() {
      var routeTriggers = document.querySelectorAll("[data-route]");
      Array.prototype.slice.call(routeTriggers, 0).forEach(function(rTrigger) {
        var routeRef = rTrigger.getAttribute("data-route");
        var routeParams = rTrigger.getAttribute("data-params");

        rTrigger.setAttribute("href", "#" + $$routes[routeRef].url);
      });
    }

    function resolveState() {
      var mayBeStateUrl = window.location.href.split("#")[1];
      var tbState = $$otherwise;
      var routeNames = Object.keys($$routes);

      for (var i = 0; i < routeNames.length; i++) {
        if ($$routes[routeNames[i]].url === mayBeStateUrl) {
          tbState = $$routes[routeNames[i]];
          break;
        }
      }
      return tbState;
    }

    // todo : router.mainController(callback) fn
    // todo : add state parameters
    // todo : add child states / abstract state values
    // todo : remove event listeners, after controller destroyed bindings and etc || generate events
    // todo : globalize event listener so that they can be removed

    window.addEventListener("hashchange", function() {
      var state = resolveState();
      state = state ? state : $$otherwise;
      if (state !== $$active) {
        $$routerView.dispatchEvent(new CustomEvent($$events.stateChangeStart, {detail: state}));
      } else {
        window.location.hash = "#" + state.url;
      }
    });

    $$routerView.addEventListener($$events.stateChangeStart, function(event) {
      initState(event.detail);
    });

    function state(name, options) {
      if ($$routes[name]) {
        new Error("State", name, "is already in your route list");
      }
      $$routes[name] = Object.assign({id: uuid(), name: name}, options);
      return this;
    }

    function otherwise(stateName) {
      $$otherwise = $$routes[stateName];
      return this;
    }

    function controller(stateName, controllerRef) {
      if ($$controllers[stateName]) {
        new Error("Controller", stateName, "is already defined");
      }
      $$controllers[stateName] = controllerRef;
      return this;
    }

    // manually loading state needs to edit the hash-bang
    function initState(state) {
      fetchTemplate(state)
        .then(function(template) {
          if (!state.resolve) {
            return;
          }
          var promises = Object.keys(state.resolve).map(function(tbResolved) {
            return new Promise(function(resolve, reject) {
              resolve(state.resolve[tbResolved].apply(null, []));
            });
          });

          Promise.all(promises)
            .then(function(resolved) {
              document.title = state.title;
              $$routerView.innerHTML = template;
              window.location.hash = "#" + state.url;
              $$controllers[state.controller].apply(null, resolved);
              // state.controller.apply(null, resolved);
              $$active = state;
              $$routerView.dispatchEvent(new CustomEvent($$events.stateChangeEnd, {detail: state}));
            });
        });
    }

    function destoryState(state) {}

    function init() {
      extractRoutesWithParameters();
      // trigger hash-change on page load so that resolve the otherwise state in case of wrong url
      window.dispatchEvent(new Event("hashchange"));
    }

    var $$state = {
      go: function(name) {
        // fire stateChange start event
        initState($$routes[name]);
      },
      reload: function() {
        window.location.reload();
      },
      params: function() {
        return 0; // todo : implement
      },
      isActive: function(name) {
        return $$active === $$routes[name];
      },
      previousState: function() {
        return null; // todo : implement
      }
    };

    function getStateList() {
      return Object.keys($$routes);
    }

    $$routerView.addEventListener("$stateChangeStart", function() {
      console.log("state change started");
    });

    $$routerView.addEventListener("$stateChangeEnd", function(e) {
      console.log("state change end");
    });

    return {
      state: state,
      controller: controller,
      otherwise: otherwise,
      $init: init,
      $state: $$state,
      $stateList: getStateList
    };
  }

  window.Router = Router;
})();

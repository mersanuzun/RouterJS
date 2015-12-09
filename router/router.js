/**
 * Created by erdi.taner.gokalp on 07/12/15.
 */
(function() {
  "use strict";

  function hash() {
    var alphabet = "abcdefghijklmnoprstuvwxyz0123456789";
    var tbHash = "";
    for (var i = 0; i < 11; i++) {
      tbHash += alphabet[Math.floor(Math.random() * (alphabet.length + 1))];
    }
    return tbHash;
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

  function Router(config) {
    var routerView = document.querySelector("[data-router-view]");
    var routes = {};

    function extractRouteTriggers() {
      // todo : searchAndExtract new routes when state changes
      var routeTriggers = document.querySelectorAll("[data-route]");
      Array.prototype.slice.call(routeTriggers, 0).forEach(function(rTrigger) {
        var routeRef = rTrigger.getAttribute("data-route");
        rTrigger.addEventListener("click", function(e) {
          e.preventDefault();
          goToState(routes[routeRef]);
        })
      });
    }

    function parseOnloadUrl() {
      // todo : convert to regex
      return window.location.href.split("#")[1];
    }
    // todo : check onhashchange event for stateChangeEvents
    // todo : add state parameters
    // todo : add otherwise state
    // todo : add child states
    window.addEventListener("hashchange", function() {
      console.log("hash changed");
    });

    window.addEventListener("load", function() {
      console.log("page loaded !!!");
    });

    function pushRoute(id, name, options) {
      routes[name] = Object.assign({id: id}, options);
    }

    function state(name, options) {
      /*
       options: {
       url: "/home",
       controller: <function_reference>,
       template: "../a.html",
       abstract: true | false,
       before: {
       k1: function() { sync -- return 1; },
       k2: function() { async -- return Promise; }
       },
       previousState: // todo : implement after research the history object
       }
       */

      var id = hash();
      pushRoute(id, name, options);

      return {
        go: function() {
          goToState(routes[name]);
        },
        reload: function() {
          // todo : implement
        },
        params: function() {
          return 0; // todo : implement
        }
      };
    }

    function attachController(state) {
      // todo : bind elements and instructions, object watchers etc
      state.controller.apply(state.controller, [state.before()]);
    }

    function otherwise() {
      // todo : implement
    }

    function resolveStateFromUrl(stateUrl) {
      var tbState = null;
      var routeNames = Object.keys(routes);

      for (var i = 0; i < routeNames.length; i++) {
        if (routes[routeNames[i]].url === stateUrl) {
          tbState = routes[routeNames[i]];
          break;
        }
      }
      return tbState;
    }

    function goToState(state) {
      fetch(state.templateUrl)
        .then(function(template) {
          window.location.hash = "#" + state.url;
          routerView.innerHTML = template;
          attachController(state);
        });
    }

    function init() {
      console.log(routes);
      extractRouteTriggers();

      var openingUrl = parseOnloadUrl();
      if (openingUrl) {
        var tbReloadedState = resolveStateFromUrl(openingUrl);
        goToState(tbReloadedState);
      }
    }

    return {
      state: state,
      init: init
    };
  }

  window.Router = Router;
})();

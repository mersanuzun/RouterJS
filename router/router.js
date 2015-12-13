/**
 * Created by erdi.taner.gokalp on 07/12/15.
 */
(function() {
  "use strict";

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
    console.log("fetching template...");
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

  function generateUrl(stateName, parameters) {
    var destinationState = $$routes[stateName];

    if (parameters === null) {
      console.log("generating url without parameters...");
      return "#" + destinationState.url;
    }
    var compiledHash = "";
    var scopeData = Object.assign({}, $$controllers[$$active.controller].$scope);
    parameters = JSON.parse(parameters);

    for (var parameter in parameters) {
      if (parameters.hasOwnProperty(parameter)) {
        parameters[parameter].split(".").forEach(function(p) {
          scopeData = scopeData[p];
        });
        compiledHash = "#" + $$routes[destinationState.parent].url + destinationState.url.replace(":" + parameter, scopeData);
      }
    }
    console.log("generating url with parameters...");
    return compiledHash;
  }

  function generateHash(state) {
    if (!state.params || Object.keys(state.params).length === 0) {
      console.log("generating hash without parameters...");
      return "#" + state.url;
    }
    var base = "";
    for (var param in state.params) {
      if (state.params.hasOwnProperty(param)) {
        base = state.url.replace(":" + param, state.params[param]);
      }
    }
    console.log("generating hash with parameters...");
    return "#" + $$routes[state.parent].url + base;
  }

  function generateRoutes(sourceDOM) {
    console.log("generating routes");
    Array.prototype.slice.call(sourceDOM.querySelectorAll("[data-route]"), 0)
      .forEach(function(route) {
        route.setAttribute("href", generateUrl(route.getAttribute("data-route"), route.getAttribute("data-params")));
      });
  }

  function generateScope() {
    var newScope = { $$id: uuid()};
    Object.observe(newScope, function(changedScope) {
      // todo : add what is necessary
    });
    console.log("generating scope...", newScope);
    return newScope;
  }

  function destroyScope() {
    // delete from controllers scope
  }

  function resolveController(controllerName, resolvers) {
    var ctrl = $$controllers[controllerName];
    return new Promise(function(resolveFn, rejectFn) {
      if (!resolvers) {
        resolveFn({controller: ctrl.$controller, params: [ctrl.$scope]});
      } else {
        var promises = Object.keys(resolvers).map(function(tbResolved) {
          return new Promise(function(resolve) {
            resolve(resolvers[tbResolved].apply(null, []));
          });
        });

        Promise.all(promises)
          .then(function(resolved) {
            resolveFn({controller: ctrl.$controller, params: [ctrl.$scope].concat(resolved)});
          })
          .catch(function(error) {
            console.log("resolve error occurred :", error);
            rejectFn(error);
          });
      }
    });
  }

  function attachController(controllerData) {
    console.log("setting up controller...");
    controllerData.controller.apply(null, controllerData.params);
  }

  function detachController(controller) {
    // stop controller activity inside controller fn
  }

  function resolveState() {
    var tbState = $$otherwise;
    var mayBeStateUrl = window.location.href.split("#")[1];
    console.log("resolving state...", mayBeStateUrl);

    if (!mayBeStateUrl) {
      return tbState;
    }

    for (var state in $$routes) {
      var _state = $$routes[state];
      if (_state.parent && $$routes[_state.parent]) {
        // if there is parent and it is in the routes
        console.log("state has a valid parent!", _state.parent);
      }
      if (_state.hasParams &&
        ($$routes[_state.parent].url + _state.url).split("/").length === mayBeStateUrl.split("/").length) {
        console.log("route has params");
        tbState = $$routes[state];
        break;
      } else if ($$routes[state].url === mayBeStateUrl) {
        tbState = $$routes[state];
        break;
      }
    }
    return tbState;
  }

  function setUpStateParams(state) {
    console.log("setting up state parameters...", state.name);
    state.params = {};

    if (state.url.indexOf(":") === -1) {
      console.log("state params :", state.params);
      return;
    }
    var maskUrl = ($$routes[state.parent].url + state.url).split("/").slice(1),
      currentUrl = window.location.href.split("#")[1].split("/").slice(1);

    maskUrl.forEach(function(mask) {
      var index = maskUrl.indexOf(mask);
      if (mask.indexOf(":") === 0) {
        var param = mask.replace(":", "");
        state.params[param] = currentUrl[index];
      }
    });
    console.log("state params :", state.params);
  }

  function initState(state) {
    console.log("initiating state...", state);
    Promise.all([fetchTemplate(state), resolveController(state.controller, state.resolve)])
      .then(function(resolved) {
        var template = resolved[0];
        var controllerData = resolved[1];

        console.log("setting state title...", state.title);
        document.title = state.title;
        console.log("setting up view...");
        $$routerView.innerHTML = template;
        setUpStateParams(state);
        console.log("setting up active state...", state);
        $$active = state;
        attachController(controllerData);
        window.location.hash = generateHash(state);
        generateRoutes($$routerView);
      })
      .catch(function(error) {
        console.log("Initiating state", state, "failed due to error", error)
      });
  }

  function destroyState(state) {
    // delete event listeners
  }

  function Router() {
    // todo : remove event listeners, after controller destroyed bindings and etc || generate events
    // todo : generate events

    var $state = {
      go: function(name) {
        // fire stateChange start event
        initState($$routes[name]);
      },
      reload: function() {
        window.location.reload();
      },
      params: function() {
        // resolve state params
        return $$active.params;
      },
      isActive: function(name) {
        return $$active === $$routes[name];
      },
      previousState: function() {
        return null; // todo : implement
      }
    };

    function $stateList() {
      return Object.keys($$routes);
    }

    function state(name, options) {
      if ($$routes[name]) {
        new Error("state", name, "is already defined");
      }
      var hasParams = options.url.indexOf(":") > -1;
      $$routes[name] = Object.assign({name: name, hasParams: hasParams}, options);
      return this;
    }

    function otherwise(statename) {
      $$otherwise = $$routes[statename];
      return this;
    }

    function controller(controllerName, controllerRef) {
      console.log("generating controller", controllerName);
      if ($$controllers[controllerName]) {
        new Error("duplicate controller", controllerName);
      }
      $$controllers[controllerName] = {$controller: controllerRef, $scope: generateScope()};
      return this;
    }

    function init() {
      generateRoutes(document);
      var stateToGo = resolveState();
      console.log("going to state", stateToGo);
      initState(stateToGo);
    }

    window.addEventListener("hashchange", function(e) {
      var stateToGo = resolveState();
      if (stateToGo.name !== $$active.name || stateToGo.hasParams) {
        initState(stateToGo);
      } else {
        console.log("already in the same state");
        window.location.hash = generateHash(stateToGo);
      }
    });

    return {
      state: state,
      controller: controller,
      otherwise: otherwise,
      init: init,
      $state: $state,
      $stateList: $stateList,
      $view: $$routerView
    };
  }
  // publish router
  window.Router = window.Router || Router;
})();
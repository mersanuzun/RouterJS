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
    eventList: {
      $stateChangeStart: [],
      $stateChangeEnd: [],
      $stateChangeError: [],
      $stateDestroy: []
    },
    dispatch: function(eventName, data) {
      var event = this.eventList[eventName];
      if (!event) { new Error("There is no such event.."); }
      event.forEach(function(eHandler) {
        eHandler.apply(null, [data]);
      });
    },
    on: function(eventName, eventHandler) { // this is the register function
      if (typeof eventHandler != "function") {
        new Error(eventHandler, "is not a function");
      }
      var event = this.eventList[eventName];
      event.push(eventHandler);
    },
    off: function(eventName, eventHandler) {
      var event = this.eventList[eventName];
      event.forEach(function(eHandler) {
        if (eHandler == eventHandler) {

          event.splice(event.indexOf(eHandler), 1);
        }
      });
    }
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
    return compiledHash;
  }

  function generateHash(state) {
    if (!state.params || Object.keys(state.params).length === 0) {
      return "#" + state.url;
    }
    var base = "";
    for (var param in state.params) {
      if (state.params.hasOwnProperty(param)) {
        base = state.url.replace(":" + param, state.params[param]);
      }
    }
    return "#" + $$routes[state.parent].url + base;
  }

  function generateRoutes(sourceDOM) {
    Array.prototype.slice.call(sourceDOM.querySelectorAll("[data-route]"), 0)
      .forEach(function(route) {
        route.setAttribute("href", generateUrl(route.getAttribute("data-route"), route.getAttribute("data-params")));
      });
  }

  function generateScope() {
    var newScope = { $$id: uuid()};
    Object.observe(newScope, function(changedScope) {
    });
    return newScope;
  }

  function destroyCurrentScope() {
    if ($$active) {
      var controller = $$controllers[$$active.controller];
      console.log("SCOPE TO BE DESTROYED", controller.$scope);
      controller.$scope = null;
      delete controller.$scope;
    } else {
      console.log("THERE IS NO SCOPE TO BE DESTROYED");
    }
  }

  function resolveController(controllerName, resolvers) {
    var ctrl = $$controllers[controllerName];
    return new Promise(function(resolveFn, rejectFn) {
      if (!resolvers) {
        ctrl.$scope = generateScope();
        resolveFn({controller: ctrl.$controller, params: [ctrl.$scope]});
      } else {
        var promises = Object.keys(resolvers).map(function(tbResolved) {
          return new Promise(function(resolve) {
            resolve(resolvers[tbResolved].apply(null, []));
          });
        });

        Promise.all(promises)
          .then(function(resolved) {
            ctrl.$scope = generateScope();
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
    controllerData.controller.apply(null, controllerData.params);
  }

  function resolveState() {
    var tbState = $$otherwise;
    var mayBeStateUrl = window.location.href.split("#")[1];

    if (mayBeStateUrl) {
      var URLArray = mayBeStateUrl.split("/").slice(1);

      for (var state in $$routes) {
        var _state = $$routes[state];
        var isValid = false;
        var pathArray = _state.fullPath.split("/").slice(1);

        if (pathArray.length === URLArray.length) {
          for (var i = 0; i < pathArray.length; i++) {
            if (pathArray[i].match(/(:[\w\d]*)/g) === null) {
              isValid = (pathArray[i] == URLArray[i]);
            } else {
              isValid = URLArray[i] && URLArray[i].match(/([\w\d]{1,})/g);
            }
            if (!isValid) { break; }
          }
        }
        if (isValid) {
          tbState = _state;
          break;
        }
      }
    }
    console.log("RESOLVED STATE ::::", tbState);
    return tbState;
  }

  function setUpStateParams(state) {
    var stateParams = {};
    var params = state.url.match(/(\/:[\w\d]*)/g);

    if (params === null) {
      return stateParams;
    }
    var maskUrl = state.fullPath.match(/(\/[:{0,1}\w\d]*)/g);
    var currentUrl = window.location.hash.slice(1).match(/(\/[:{0,1}\w\d]*)/g);

    params.forEach(function(param) {
      var i = maskUrl.indexOf(param);
      stateParams[param.slice(2)] = currentUrl[i].slice(1);
    });
    return stateParams;
  }

  function initState(state) {
    if ($$active && state.name === $$active.name) {
      console.log("ALREADY IN THE SAME STATE...");
      window.location.hash = generateHash(state);
      return;
    }
    $$events.dispatch("$stateChangeStart", {from: ($$active ? $$active.name : undefined), to: state.name});
    $$events.dispatch("$stateDestroy"); // todo : add handler of it

    Promise.all([fetchTemplate(state), resolveController(state.controller, state.resolve)])
      .then(function(resolved) {
        var template = resolved[0];
        var controllerData = resolved[1];

        document.title = state.title;
        $$routerView.innerHTML = template;
        state.params = setUpStateParams(state);

        destroyCurrentScope();

        console.log("$$ROUTES ::::", $$routes);
        console.log("$$CONTROLLERS ::::", $$controllers);

        $$active = state;
        attachController(controllerData);
        window.location.hash = generateHash(state);
        generateRoutes($$routerView);

        $$events.dispatch("$stateChangeEnd", {to: state.name});
      })
      .catch(function(error) {
        $$events.dispatch("$stateChangeError", {to: state.name});
        new Error("Initiating state", state, "failed due to error", error);
      });
  }

  function generateFullStatePath(state) {
    if (!state.parent) {
      return state.url;
    }
    return generateFullStatePath($$routes[state.parent]) + state.url;
  }

  function Router() {

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

    function $stateNames() {
      return Object.keys($$routes);
    }

    function state(name, options) {
      if ($$routes[name]) {
        new Error("state", name, "is already defined");
      }
      if (!$$routes[options.parent]) {
        new Error("parent state", options.parent, "is not defined");
      }

      $$routes[name] = Object.assign({name: name}, options);
      return this;
    }

    function otherwise(statename) {
      $$otherwise = $$routes[statename];
      return this;
    }

    function controller(controllerName, controllerRef) {
      if ($$controllers[controllerName]) {
        new Error("duplicate controller", controllerName);
      }
      $$controllers[controllerName] = {$controller: controllerRef};
      return this;
    }

    function init() {
      Object.keys($$routes).forEach(function(state) {
        $$routes[state].fullPath = generateFullStatePath($$routes[state]);
      });

      generateRoutes(document);
      initState(resolveState());
    }

    window.addEventListener("hashchange", function() {
      console.log("HASH CHANGE ::::::::");
      initState(resolveState());
    });

    return {
      state: state,
      controller: controller,
      otherwise: otherwise,
      init: init,
      $state: $state,
      $stateNames: $stateNames,
      $on: function(eventName, eventHandler) {
        return $$events.on(eventName, eventHandler);
      },
      $off: function(eventName, eventHandler) {
        return $$events.off(eventName, eventHandler);
      }
    };
  }
  // publish router
  window.Router = window.Router || Router;
})();
/**
 * Created by erdi.taner.gokalp on 07/12/15.
 */
(function() {
  "use strict";

  function Router() {
    var $$routerView = document.querySelector("[data-router-view]");
    var $$routes = {};
    var $$controllers = {};
    var $$active;
    var $$otherwise;
    var templateCache = {};

    var $$events = {
      eventList: {
        $stateChangeStart: [],
        $stateChangeEnd: [],
        $stateChangeError: []
      },
      dispatch: function(eventName, data) {
        var event = this.eventList[eventName];
        if (!event) { new Error("There is no such event.."); }
        event.forEach(function(eHandler) {
          eHandler(data);
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
      console.time("fetch-template");
      return new Promise(function(resolve) {
        if (state.template) {
          console.timeEnd("fetch-template");
          resolve(state.template);
        } else if (state.templateUrl) {
          if (templateCache[state.name]) {
            console.timeEnd("fetch-template");
            resolve(templateCache[state.name]);
          } else {
            fetch(state.templateUrl)
              .then(function(template) {
                if (state.cacheTemplate === true) {
                  templateCache[state.name] = template;
                }
                console.timeEnd("fetch-template");
                resolve(template);
              })
              .catch(function(netError) {
                reject(netError);
              });
          }
        } else {
          console.error("No template provided");
          reject(null);
        }
      });
    }

    function generateStateHash(destinationState, parameters) {
      var tbUrl = $$routes[destinationState].fullPath;
      var stateParams = (typeof parameters === "string") ? JSON.parse(parameters) : parameters;

      for (var param in stateParams) {
        tbUrl = tbUrl.replace(":" + param, stateParams[param]);
      }
      return "#" + tbUrl;
    }

    function generateRoutes(sourceDOM) {
      Array.prototype.slice.call(sourceDOM.querySelectorAll("[data-route]"), 0)
        .forEach(function(route) {
          route.setAttribute("href", generateStateHash(route.getAttribute("data-route"), route.getAttribute("data-params")));
        });
    }

    function resolveController(controllerName, resolvers) {
      var ctrl = $$controllers[controllerName];
      return new Promise(function(resolveFn, rejectFn) {
        console.time("resolve-values");
        if (!resolvers) {
          console.timeEnd("resolve-values");
          resolveFn({controller: ctrl, params: []});
        } else {
          var promises = Object.keys(resolvers).map(function(tbResolved) {
            return new Promise(function(resolve) {
              resolve(resolvers[tbResolved]());
            });
          });

          Promise.all(promises)
            .then(function(resolved) {
              console.timeEnd("resolve-values");
              resolveFn({controller: ctrl, params: resolved});
            })
            .catch(function(error) {
              console.error("resolve error occurred :", error);
              rejectFn(error);
            });
        }
      });
    }

    function attachController(controllerData) {
      controllerData.controller.apply(null, controllerData.params);
    }

    function resolveState() {
      console.time("resolve-state");
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
      console.timeEnd("resolve-state");
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

    function initState(state, enforce) {
      if ($$active && state.name === $$active.name && !enforce) {
        console.log("ALREADY IN THE SAME STATE...");
        return;
      }

      state.params = setUpStateParams(state);
      $$active = state;
      $$events.dispatch("$stateChangeStart", {from: ($$active ? $$active.name : undefined), to: state.name});

      Promise.all([fetchTemplate(state), resolveController(state.controller, state.resolve)])
        .then(function(resolved) {
          var template = resolved[0];
          var controllerData = resolved[1];

          document.title = state.title;
          $$routerView.innerHTML = template;
          controllerData.controller.apply(null, controllerData.params);
          generateRoutes($$routerView);
          $$events.dispatch("$stateChangeEnd", {to: state.name});
        })
        .catch(function(error) {
          $$events.dispatch("$stateChangeError", {to: state.name});
          new Error("Initiating state", state, "failed due to error", error);
        });
    }

    function generateStateUrl(state) {
      if (!state.parent) {
        return state.url;
      }
      return generateStateUrl($$routes[state.parent]) + state.url;
    }

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
      $$controllers[controllerName] = controllerRef;
      return this;
    }

    function init() {
      Object.keys($$routes).forEach(function(state) {
        $$routes[state].fullPath = generateStateUrl($$routes[state]);
      });

      generateRoutes(document);
      initState(resolveState(), false);
    }

    window.addEventListener("hashchange", function(e) {
      console.log("HASH CHANGE :", e.newURL, e.oldURL);
      initState(resolveState(), e.newURL !== e.oldURL);
    });

    return {
      state: state,
      controller: controller,
      otherwise: otherwise,
      init: init,
      $state: {
        go: function(name, params) {
          window.location.hash = generateStateHash(name, params);
        },
        reload: function() {
          window.location.reload();
        },
        params: function() {
          return $$active.params;
        },
        active: function(name) {
          return $$active === $$routes[name];
        }
      },
      $stateNames: $stateNames,
      $generateRoutes: function() {
        generateRoutes($$routerView);
      },
      on: function(eventName, eventHandler) {
        $$events.on(eventName, eventHandler);
      },
      off: function(eventName, eventHandler) {
        $$events.off(eventName, eventHandler);
      }
    };
  }
  // publish router
  window.Router = window.Router || Router;
})();
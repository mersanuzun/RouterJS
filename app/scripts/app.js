/**
 * Created by erdi.taner.gokalp on 07/12/15.
 */
(function() {
  "use strict";

  function request(url) {
    var httpRequest;
    var config = {
      method: "GET",
      url: url,
      params: null
    };

    var API = {};

    API.get = function() {
      config.method = "GET";
      return API;
    };

    API.post = function() {
      config.method = "POST";
      // todo > include query params
      return API;
    };

    API.withHeaders = function(obj) {
      Object.keys(obj).forEach(function(header) {
        httpRequest.setRequestHeader(header, obj[header]);
      });
      return API;
    };

    API.withParams = function(obj) {
      if (config.method === "GET") {
        var urlPrefix = "/";
        var params = Object.keys(obj);
        params.forEach(function(param) {
          urlPrefix += obj[param];
        });
        config.url += urlPrefix;
      } else {
        config.params = obj;
      }
      return API;
    };

    API.fetch = function() {
      return new Promise(function(resolve, reject) {
        if (window.XMLHttpRequest) {
          httpRequest = new XMLHttpRequest();
        } else if (window.ActiveXObject) {
          httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
        } else {
          new Error("No browser support for XML Http Request!");
        }
        httpRequest.open(config.method, config.url, true);
        httpRequest.send(config.params);

        httpRequest.onreadystatechange = function() {
          if (httpRequest.readyState === 4) {
            if (httpRequest.status === 200) {
              resolve(httpRequest.response);
            } else {
              reject(httpRequest.statusText);
            }
          }
        };

        httpRequest.onerror = function() {
          reject(this.statusText);
        }
      });
    };

    return API;
  }

  var router = window.Router();

  router
    .state("home", {
      title: "Home",
      url: "/home",
      templateUrl: "../../controllers/home/home.html",
      cacheTemplate: true,
      controller: "HomeController",
      resolve: {
        a: function() {
          return 10;
        },
        b: function() {
          return new Promise(function(resolve) {
            setTimeout(function() {
              resolve(100);
            },2000)
          });
        }
      }
    })
    .state("about", {
      title: "About",
      url: "/about",
      template: '<h3>About</h3>' +
                '<p> This page contains the data about the owner of this web page. (Template String)</p>',
      controller: "AboutController",
      resolve: {
        a: function() {
          return 20;
        },
        b: function() {
          return new Promise(function(resolve) {
            setTimeout(function() {
              resolve(200);
            },2000)
          });
        }
      }
    })
    .state("contact", {
      title: "Contact",
      url: "/contact",
      templateUrl: "../../controllers/contact/contact.html",
      controller: "ContactController",
      resolve: {
        a: function() {
          return 30;
        },
        b: function() {
          return new Promise(function(resolve) {
            setTimeout(function() {
              resolve(300);
            },0);
          });
        }
      }
    })
    .state("users", {
      title: "Users",
      url: "/users",
      template: '<h3>Users</h3><div id="userList"></div>',
      controller: "UsersController",
      resolve: {
        users: function() {
          return request("http://localhost:3000/getUsers").get().fetch();
        }
      }
    })
    .state("user", {
      title: "User",
      parent: "users",
      url: "/:userId/view",
      template: '<h3>User Details</h3><div><button id="goBackBtn" type="button">Go Back to Users</button></div><div id="userDetails"></div>',
      controller: "UserController",
      resolve: {
        userDetails: function() {
          var userId = router.$state.params().userId;
          return request("http://localhost:3000/getUserDetails").withParams({userId: userId}).get().fetch();
        }
      }
    })
    .otherwise("home");

  // todo : try with multiple parametrized states
  // check parent for parametrized states

  router.controller("HomeController", function(a, b) {
    console.log("Home controller initiated...");
    console.log("value of resolve :", a, b);

    var btn = document.getElementById("goToElena");
    btn.onclick = function() {
      router.$state.go("user", {userId: 1004});
    };
  });

  router.controller("AboutController", function(a, b) {
    console.log("About controller initiated...");
    console.log("value of resolve :", a, b);
  });

  router.controller("ContactController", function(a, b) {
     console.log("Contact controller initiated...");
     console.log("value of resolve :", a, b);
  });

  router.controller("UsersController", function(users) {
    console.log("Users controller initiated");
    var _users = JSON.parse(users);

    setTimeout(function() {
      var ul = document.createElement("ul");
      _users.forEach(function(user) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        li.appendChild(a);
        a.setAttribute("data-route", "user");
        a.setAttribute("data-params", JSON.stringify({userId: user.id}));
        a.innerHTML = user.name;

        ul.appendChild(li);
      });

      var userList = document.getElementById("userList");
      userList.appendChild(ul);
      router.$generateRoutes();
    }, 3000);
  });

  router.controller("UserController", function(userDetails) {
    console.log("User controller initiated...");
    var _userDetails = JSON.parse(userDetails);
    console.log("USER DETAILS", _userDetails);


    var c = document.createElement("div");
    Object.keys(_userDetails).forEach(function(detail) {
      var div = document.createElement("div");

      var label = document.createElement("label");
      label.innerHTML = detail + " :  ";
      div.appendChild(label);

      var span = document.createElement("span");
      span.innerHTML = _userDetails[detail];
      div.appendChild(span);

      c.appendChild(div);
    });

    document.getElementById("userDetails").appendChild(c);
    var goBackBtn = document.getElementById("goBackBtn").onclick = function() {
      router.$state.go("users");
    };
  });

  router.on("$stateChangeStart", stateChangeStartHandler);
  router.on("$stateChangeEnd", stateChangeEndHandler);
  router.on("$stateChangeError", stateChangeErrorHandler);

  router.init();

  function stateChangeStartHandler(eventData) {
    console.log("STATE CHANGE STARTED FROM :", eventData.from, "TO :", eventData.to);
  }

  function stateChangeEndHandler(eventData) {
    console.log("STATE CHANGE TO :", eventData.to, "COMPLETED");
  }

  function stateChangeErrorHandler(eventData) {
    console.log("STATE CHANGE ERROR TO :", eventData.to);
  }

})();
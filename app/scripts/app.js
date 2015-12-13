/**
 * Created by erdi.taner.gokalp on 07/12/15.
 */
(function() {
  "use strict";

  var router = window.Router();

  router
    .state("home", {
      title: "Home",
      url: "/home",
      templateUrl: "../../controllers/home/home.html",
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
            },2000)
          });
        }
      }
    })
    .state("users", {
      title: "Users",
      url: "/users",
      templateUrl: "../../controllers/users/users.html",
      controller: "UsersController",
      resolve: {
        users: function () {
          return {
              user1: {name: "John", surname: "Doe", age: 25},
              user2: {name: "Sally", surname: "Sure", age: 18},
              user3: {name: "Matt", surname: "Damon", age: 35}
          };
        }
      }
    })
    .state("user", {
      title: "User",
      parent: "users",
      url: "/:userName",
      templateUrl: "../../controllers/users/user.html",
      controller: "UserController"
    })
    .otherwise("home");

  // todo : try with multiple parametrized states
  // check parent for parametrized states

  router.controller("HomeController", function($scope, a, b) {
    console.log("Home controller initiated...");
    // console.log("Scope of Home controller :", $scope);
    console.log("value of resolve :", a, b);

    // console.log(router.$state);
  });

  router.controller("AboutController", function($scope, a, b) {
    console.log("About controller initiated...");
    // console.log("Scope of About controller :", $scope);
    console.log("value of resolve :", a, b);
  });

   router.controller("ContactController", function($scope, a, b) {
     console.log("Contact controller initiated...");
     // console.log("Scope of Contact controller :", $scope);
     console.log("value of resolve :", a, b);
  });

  router.controller("UsersController", function($scope, users) {
    console.log("Users controller initiated");
    $scope.users = users;
    // console.log("users object", $scope.users);
    // console.log("Scope of Users controller :", $scope);
  });

  router.controller("UserController", function($scope) {
    console.log("User controller initiated...");
    var stateParams = router.$state.params();
    $scope.userName = stateParams.userName;
    console.log("Scope of User controller :", $scope);
    document.getElementById("userName").innerHTML = "Welcome " + stateParams.userName;
    document.getElementById("personalData").innerHTML = "We are glad to see you " + stateParams.userName;
  });

  router.init();

})();
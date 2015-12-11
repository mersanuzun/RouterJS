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
        users: function() {
          return [
            {user1: {name: "John", surname: "Doe", age: 25}},
            {user2: {name: "Sally", surname: "Sure", age: 18}},
            {user3: {name: "Matt", surname: "Damon", age: 35}}
          ]
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

  router.controller("HomeController", function(a, b) {
    console.log("Home controller initiated...");
    console.log("value of resolve :", a, b);

    console.log(router.$state);
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
    console.log("User controller initiated");
    console.log("users array", users);
  });

  router.controller("UserController", function() {
    console.log("User controller initiated...");
  });

  router.$init();

})();
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
      controller: HomeController,
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
      controller: AboutController,
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
      controller: ContactController,
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
    .otherwise("home");

  router.$init();

  function HomeController(a, b) {
    console.log("Home controller initiated...");
    console.log("value of resolve :", a, b);

    console.log(router.$state);
  }

  function AboutController(a, b) {
    console.log("About controller initiated...");
    console.log("value of resolve :", a, b);
  }

  function ContactController(a, b) {
    console.log("Contact controller initiated...");
    console.log("value of resolve :", a, b);
  }
})();
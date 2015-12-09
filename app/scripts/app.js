/**
 * Created by erdi.taner.gokalp on 07/12/15.
 */
(function() {
  "use strict";

  var router = window.Router();

  var home = router.state("home", {
    url: "/home",
    templateUrl: "../../controllers/home/home.html",
    controller: HomeController,
    before: function() {
      return 10;
    }
  });

  var about = router.state("about", {
    url: "/about",
    templateUrl: "../../controllers/about/about.html",
    controller: AboutController,
    before: function() {
      return 20;
    }
  });

  var contact = router.state("contact", {
    url: "/contact",
    templateUrl: "../../controllers/contact/contact.html",
    controller: ContactController,
    before: function() {
      return 30;
    }
  });

  function HomeController(before) {
    this.title = "Home";
    console.log(this.title, "controller initiated...");
    console.log("value of before in ", this.title, before);
  }

  function AboutController(before) {
    this.title = "About";
    console.log(this.title, "controller initiated...");
    console.log("value of before in ", this.title, before);
  }

  function ContactController(before) {
    this.title = "Contact";
    console.log(this.title, "controller initiated...");
    console.log("value of before in ", this.title, before);
  }

  router.init();
})();
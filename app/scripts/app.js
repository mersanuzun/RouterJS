/**
 * Created by erdi.taner.gokalp on 07/12/15.
 */

var router = Router();

var home = router.state("home", {
  url: "/home",
  templateUrl: "../../controllers/home/home.html",
  controller: "controllers.home"
});

var about = router.state("about", {
  url: "/about",
  templateUrl: "../../controllers/about/about.html",
  controller: "controllers.about"
});

var contact = router.state("contact", {
  url: "/contact",
  templateUrl: "../../controllers/contact/contact.html",
  controller: "controllers.contact"
});


router.controller("controllers.about", function() {
  this.title = "About";
  console.log(this.title, "controller initiated...");
});

router.init();
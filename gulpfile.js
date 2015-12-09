/**
 * Created by erdi.taner.gokalp on 07/12/15.
 */

var gulp = require("gulp"),
    connect = require("gulp-connect");

gulp.task("ws", function() {
    connect.server({
        livereload: true
    });
});

gulp.task("app", function() {
   gulp.src("app/**/**.*")
     .pipe(connect.reload());
});

gulp.task("dev", function() {
    gulp.src("router/router.js")
      .pipe(connect.reload());
});

gulp.task("index", function() {
    gulp.src("index.html")
      .pipe(connect.reload());
});

gulp.task("watch", function() {
   gulp.watch("app/**/**.*", ["app"]);
   gulp.watch("router/**.*", ["dev"]);
   gulp.watch("index.html", ["index"]);
});

gulp.task("default", ["ws", "app", "dev", "index", "watch"]);
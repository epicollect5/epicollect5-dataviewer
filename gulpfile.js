const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const concatCss = require('gulp-concat-css');
const cleanCss = require('gulp-clean-css');
const rename = require('gulp-rename');

// Compile SCSS
function scss() {
  return gulp.src('./app/theme/app.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(cleanCss({ compatibility: 'ie8' }))
    .pipe(rename('dataviewer.css'))
    .pipe(gulp.dest('./dist/'));
}

// Concatenate & minify vendor CSS
function vendorCss() {
  return gulp.src('./app/vendor/css/dataviewer/*.css')
    .pipe(concatCss('vendor-dataviewer.css'))
    .pipe(cleanCss({ compatibility: 'ie8' }))
    .pipe(gulp.dest('./dist/'));
}

// Watch SCSS changes
function watchScss() {
  gulp.watch('./app/theme/**/*.scss', scss);
}

// Combined tasks
const css = gulp.series(scss, vendorCss);
const dev = gulp.parallel(watchScss); // can add other watch tasks later

exports.scss = scss;
exports.vendorCss = vendorCss;
exports.css = css;
exports.watch = dev;

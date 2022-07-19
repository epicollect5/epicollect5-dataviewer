const gulp = require('gulp');
const concatCss = require('gulp-concat-css');
const minifyCss = require('gulp-minify-css');

//concat vendor css
gulp.task('css', () => {
    gulp.src('./app/vendor/css/dataviewer/*.css')
        .pipe(concatCss('vendor-dataviewer.css'))
        .pipe(minifyCss({ compatibility: 'ie8' }))
        //.pipe(header('//Build number: ' + Date.now() + '\n\n'))
        .pipe(gulp.dest('./dist/'));
});

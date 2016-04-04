const gulp = require('gulp')
const babel = require('gulp-babel')

gulp.task('es6', () => {
  return gulp.src(['main.js', 'tools/*.js', 'misc/*.js', 'intermediate/*.js', 'frontend/*.js', 'backend/*.js', 'analisys/*.js'])

        .pipe(babel({
          presets:['es2015']
        }))

        .pipe(gulp.dest('build'))
})

gulp.task('default', ['es6'], () => {
  gulp.watch(['main.js', 'tools/*.js', 'misc/*.js', 'intermediate/*.js', 'frontend/*.js', 'backend/*.js', 'analisys/*.js'], ['es6'])
})

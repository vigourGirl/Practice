// 引入 gulp
var gulp = require('gulp');

// 引入组件
// sass
var sass = require('gulp-sass');
// postcss
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var vmin = require('postcss-vmin');
var cssnext = require('cssnext');
var cssnano = require('cssnano');
var px2rem = require('gulp-px3rem'); // px转rem
// browser sync
var browserSync = require('browser-sync').create();
var reload = browserSync.reload;
// JS
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
// es6
var babel = require('gulp-babel');
var babelEnv = require('babel-preset-env');
var removeStrict = require('babel-plugin-transform-remove-strict-mode'); // 去掉严格模式
var sourcemaps = require('gulp-sourcemaps');

// image
var imagemin = require('gulp-imagemin');

var tiny = require('gulp-tinypng-nokey');


var plumber = require('gulp-plumber'); // 检测错误
var gutil = require('gulp-util'); // 如果有自定义方法，会用到
// 合并文件
var useref = require('gulp-useref');

// 合并html
var fileinclude = require('gulp-file-include');

// replace
var replace = require('gulp-replace');
// 清空
var clean = require('gulp-clean');

var changed = require('gulp-changed'); // 过滤改变过的文件
var debug = require('gulp-debug');

// dist
var dist = '';
// dev
var dev = '';

function errorHandler(e) {
  // 控制台发声,错误时beep一下
  gutil.beep();
  gutil.log(e);
  this.emit('end');
}

// Sass && Postcss
gulp.task('sass', function () {
  var processors = [
    autoprefixer({
      browsers: ['Android >= 4.3', 'iOS >= 9.3', 'Chrome >= 42']
    }),
    cssnext,
    vmin,
    cssnano({
      zindex: false
    })
  ];
  return gulp.src([
      dev + '/scss/*.scss',
      '!' + dev + '/**/_*.scss',
      '!' + dev + '/plugins/**/*.*'
    ])
    .pipe(changed(dist, {
      // extension: '.min.css'
      extension: '.css'
    }))
    .pipe(plumber({
      errorHandler: errorHandler
    }))
    .pipe(sass())
    .pipe(px2rem({
      baseDpr: 1, // base device pixel ratio (default: 2)
      threeVersion: false, // whether to generate @1x, @2x and @3x version (default: false)
      remVersion: true, // whether to generate rem version (default: true)
      remUnit: 100, // rem unit value (default: 75)
      remPrecision: 6 // rem precision (default: 6)
    }))
    .pipe(postcss(processors))
    .pipe(rename(function (path) {
      path.basename = path.basename.replace(/\.debug/gi, ''); // 去掉编译后文件名中的debug
    }))
    // .pipe(rename({
    //   suffix: '.min'
    // }))
    .pipe(gulp.dest(dist + '/css/'))
    .pipe(reload({
      stream: true
    }));
});


// browser-sync
gulp.task('browser-sync', function () {
  browserSync.init({
    server: './',
    ghostMode: false // 点击，滚动和表单在任何设备上输入将被镜像到所有设备里
  });
  browserSync.watch(dist + '/**/*.html').on('change', reload);
});

// js
gulp.task('js', function () {
  return gulp.src([dev + '/**/*.js',
      '!' + dev + '/plugins/**/*.*'
    ])
    .pipe(changed(dist, {
      extension: '.min.js'
    }))
    .pipe(sourcemaps.init())
    .pipe(plumber({
      errorHandler: errorHandler
    }))
    .pipe(babel({
      presets: [babelEnv],
      plugins: [removeStrict]
    }))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(dist))
    .pipe(reload({
      stream: true
    }));

});
// image
gulp.task('image', function () {
  return gulp.src([dev + '/**/*.{png,jpg,jpeg,gif,ico,svg}',
      '!' + dev + '/plugins/**/*.*'
    ])
    .pipe(changed(dist))
    .pipe(plumber({
      errorHandler: errorHandler
    }))
    .pipe(imagemin([
      imagemin.gifsicle({interlaced: true}),
      imagemin.jpegtran({progressive: true}),
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.svgo({
          plugins: [
              {removeViewBox: true},
              {cleanupIDs: false}
          ]
      })
  ]))
    .pipe(gulp.dest(dist))
    .pipe(reload({
      stream: true
    }));
});

// tiny
gulp.task('tiny', function () {
  return gulp.src([dev + '/**/*.{png,jpg,jpeg,gif,ico,svg}',
      '!' + dev + '/plugins/**/*.*'
    ])
    .pipe(changed(dist))
    .pipe(plumber({
      errorHandler: errorHandler
    }))
    .pipe(tiny())
    .pipe(gulp.dest(dist))
    .pipe(reload({
      stream: true
    }));
});
// html
gulp.task('html', function () {
  return gulp.src([
      dev + '/**/*.html',
      '!' + dev + '/include/*.*',
      '!' + dev + '/plugins/**/*.*'
    ])
    // .pipe(changed(dist))
    .pipe(plumber({
      errorHandler: errorHandler
    }))
    .pipe(fileinclude({ // 合并html
      prefix: '@@',
      basepath: 'dev/include/'
    }))
    .pipe(replace('/yunnan/js/vue.js','/yunnan/js/vue.min.js'))
    .pipe(gulp.dest(dist))
    .pipe(reload({
      stream: true
    }));
});
// include
gulp.task('include', function () {
  return gulp.src([dev + '/**/*.htm',
      '!' + dev + '/plugins/**/*.*'
    ])
    .pipe(plumber({
      errorHandler: errorHandler
    }))
    .pipe(fileinclude({ // 合并html
      prefix: '@@',
      basepath: 'dev/include/'
    }))
    // .pipe(debug)
    .pipe(gulp.dest(dist))
    .pipe(reload({
      stream: true
    }));
});
gulp.task('plugins', function () {
  return gulp.src([
      dev + '/plugins/**/*.*',
    ])
    .pipe(changed(dist))
    .pipe(gulp.dest(dist + '/plugins'));
});
// clean
gulp.task('clean', function () {
  return gulp.src(dist)
    .pipe(plumber({
      errorHandler: errorHandler
    }))
    .pipe(clean({
      read: false,
      force: true
    }));
});
// watch
gulp.task('watch', function () {
  gulp.watch(dev + '/**/*.scss', ['sass']);
  gulp.watch(dev + '/**/**/*.js', ['js']);
  gulp.watch(dev + '/**/*.{png,jpg,jpeg,gif,ico,svg}', ['image']);
  // gulp.watch(dev + '/**/*.{png,jpg,jpeg,gif,ico,svg}', ['tiny']);
  // gulp.watch(dev + '/**/*.html', ['html']);
  // gulp.watch(dev + '/include/*.htm', ['include', 'html']);
  gulp.watch(dev + '/plugins/**/*.*', ['plugins']);
});
// 默认任务 清空图片、样式、js并重建 运行语句 gulp
gulp.task('default', ['clean'], function () {
  gulp.start('sass', 'js', 'image', 'watch', 'html', 'plugins', 'browser-sync');
});
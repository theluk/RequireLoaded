// RequireLoaded

// (c) 2013 Lukas Klinzing 
// RequireLoaded may be freely distributed under the MIT license.

// currently  depends on URI.js http://medialize.github.io/URI.js/


// require-loaded is a tiny library that gives you the ability to
// execute your unsorted script files only if you need it, while it expects, that
// they already have been loaded. So it does **NOT** load script files
// from your server, but expects that they are already in place. This is usefull
// if you have some libraries on the server, that already do the loading, minifing, etc..
// 
// Some key features are:
// ----------------------
//  - executes defined code only when required
//  - you dont have to sort your files. You could just do on the server something 
//    like "Give me all *.js files in this folder and print them as script-tags".
//  - supports circular references [1]
//  - does **NOT** load anything from server
//    is usefull when your complete code is returned by the server
//  - depends on URI.js to enable correct behavior
//
// [1]  somehow... if A has a reference to B and B has a reference to A
//      there are no problems, until you use B in A or A in B within the require
//      life-cycle. The lifecylce does load A => B => A. While in B, you get a reference
//      to A, but as A has not loaded yet, because it waits for B, your reference will be
//      empty until A has loaded too. Therefore it is good practice to use your references
//      when your code actually runs. Of course if you know that there are no circular references
//      you can skip all this :)

//      Here a small example:
//      *********************
//
//          define("app", function(exports, require) {
//              var dep = require("data/dep");
//            //dont use this, as info **might** not exist yet
//              var info = dep.info();
//            //here you are quite safe...
//              exports.init = function() {
//                  var info = dep.info();
//              }
//          });

(function (exports, URI, undefined) {

    /**
        define
        ------
        @param path the path e.g "core/config"
        @param fn   the function to execute when required

        a commonjs-like "define" function that caches the results.
        the callback function that executes the code must implement
        the two arguments "exports" and "require". The callback
        will be called only once and only when required.

        common usage:
        -------------

            define("app", function(exports, require) {
                var config = require("core/config");
                var mvc = require("core/mvc");
                exports.init = function() {
                    var router = new mvc.Router();
                    router.start();
                };
            });

            var app = require("app");
            app.init();

    */
    exports.define = function (path, fn) {
        define(path, fn);
    };


    /**
        require
        -------
        @param path the relative path to the requested file
                    so if you require "app/core" from within the code 
                    defined as "app/app" you have to require "./core" or "core"
        @return object an object literal that contains all exported members

        a commonjs-like require function that loads the required code and returns it.
        the path you specify must be relative. 

            // a module named "core" defined in virtual folder "data"
            define("data/core", () ...)

            // a module named "core" defined in virtual folder "app"
            define("app/core", function(exports, require) {
                // to get "data/core" you have to use "../data/core" to get it
                // as you call it from within the virtual directoroy "app"
                var data = require("../data/core");
            });

    */
    exports.require = function (path) {
        return require(path);
    };

    var cache = {};

    function define(name, fn) {
        if (!cache.hasOwnProperty(name))
            cache[name] = {
                called: false,
                calling : false,
                fn: fn,
                result: undefined
            };
    }
    

    function require(name, root) {
        name = URI(name, root || "").toString();
        if (cache.hasOwnProperty(name)) {
            if (cache[name].called === true || cache[name].calling === true)
                return cache[name].result;

            cache[name].calling = true;
            var moduleExports = {};
            cache[name].result = moduleExports;

            var root = name;
            var apiRequire = function (name) {
                return require(name, root);
            }

            cache[name].fn.call(null, moduleExports, apiRequire);
            cache[name].called = true;
            cache[name].calling = false;

            return cache[name].result;

        } else {
            throw "required module " + name + " could not be found";
        }
    }
    

})(this, URI);

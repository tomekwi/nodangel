'use strict';
/*

nodangel is a utility for node, and replaces the use of the executable
node. So the user calls `nodangel foo.js` instead.

nodangel can be run in a number of ways:

`nodangel` - tries to use package.json#main property to run
`nodangel` - if no package, looks for index.js
`nodangel app.js` - runs app.js
`nodangel --arg app.js --apparg` - eats arg1, and runs app.js with apparg
`nodangel --apparg` - as above, but passes apparg to package.json#main (or index.js)
`nodangel --debug app.js

*/

var fs = require('fs'),
    path = require('path'),
    existsSync = fs.existsSync || path.existsSync;

module.exports = parse;

/**
 * Parses the command line arguments `process.argv` and returns the
 * nodangel options, the user script and the executable script.
 *
 * @param  {Array} full process arguments, including `node` leading arg
 * @return {Object} { options, script, args }
 */
function parse(argv) {
  if (typeof argv === 'string') {
    argv = argv.split(' ');
  }

  var eat = function (i, args) {
    if (i <= args.length) {
      return args.splice(i + 1, 1).pop();
    }
  };

  var args = argv.slice(2),
      script = null,
      nodangelOptions = { scriptPosition: null };

  var nodangelOpt = nodangelOption.bind(null, nodangelOptions),
      lookForArgs = true;

  // move forward through the arguments
  for (var i = 0; i < args.length; i++) {
    // if the argument looks like a file, then stop eating
    if (!script) {
      if (args[i] === '.' || existsSync(args[i])) {
        script = args.splice(i, 1).pop();

        // we capture the position of the script because we'll reinsert it in the
        // right place in run.js:command (though I'm not sure we should even take
        // it out of the array in the first place, but this solves passing
        // arguments to the exec process for now).
        nodangelOptions.scriptPosition = i;
        i--;
        continue;
      }
    }

    if (lookForArgs) {
      // respect the standard way of saying: hereafter belongs to my script
      if (args[i] === '--') {
        args.splice(i, 1);
        // cycle back one argument, as we just ate this one up
        i--;

        // ignore all further nodangel arguments
        lookForArgs = false;

        // move to the next iteration
        continue;
      }

      if (nodangelOpt(args[i], eat.bind(null, i, args)) !== false) {
        args.splice(i, 1);
        // cycle back one argument, as we just ate this one up
        i--;
      }
    }
  }

  if (script === null && !nodangelOptions.exec) {
    var found = findAppScript();
    if (found !== null) {
      if (found.exec) {
        nodangelOptions.exec = found.exec;
      }
      script = found.script;
      nodangelOptions.scriptPosition = args.length;
    }
  }


  // FIXME this was commented out on 2014-12-05 due to logic being moved
  // to exec.js. I know I have git to revive the code if I need to, but
  // I'm going to leave it here for the short term. Next passerby: feel free
  // to remove.
  // -------------
  // allows the user to specify a script and for nodangel to throw an exception
  // *instead* of echoing out the usage and ignoring the poor user altogether,
  // just because the filename (or argument) specified wasn't found.
  // if (!script && args.length) {
  //   script = args.pop();
  // }

  nodangelOptions.script = script;
  nodangelOptions.args = args;

  return nodangelOptions;
}


/**
 * Given an argument (ie. from process.argv), sets nodangel
 * options and can eat up the argument value
 *
 * @param {Object} options object that will be updated
 * @param {Sting} current argument from argv
 * @param {Function} the callback to eat up the next argument in argv
 * @return {Boolean} false if argument was not a nodangel arg
 */
function nodangelOption(options, arg, eatNext) {
  // line seperation on purpose to help legibility
  if (arg === '--help' || arg === '-h' || arg === '-?') {
    var help = eatNext();
    options.help = help ? help : true;
  }

  else if (arg === '--version' || arg === '-v') {
    options.version = true;
  }

  else if (arg === '--dump') {
    options.dump = true;
  }

  else if (arg === '--no-vm') {
    options.novm = true;
  }

  else if (arg === '--verbose' || arg === '-V') {
    options.verbose = true;
  }

  // Depricated as this is "on" by default
  else if (arg === '--js') {
    options.js = true;
  }

  else if (arg === '--quiet' || arg === '-q') {
    options.quiet = true;
  }

  else if (arg === '--hidden') { // TODO document this flag?
    options.hidden = true;
  }

  else if (arg === '--watch' || arg === '-w') {
    if (!options.watch) { options.watch = []; }
    options.watch.push(eatNext());
  }

  else if (arg === '--ignore' || arg === '-i') {
    if (!options.ignore) { options.ignore = []; }
    options.ignore.push(eatNext());
  }

  else if (arg === '--exitcrash') {
    options.exitcrash = true;
  }

  else if (arg === '--delay' || arg === '-d') {
    options.delay = parseDelay(eatNext());
  }

  else if (arg === '--exec' || arg === '-x') {
    options.exec = eatNext();
  }

  else if (arg === '--legacy-watch' || arg === '-L') {
    options.legacyWatch = true;
  }

  else if (arg === '--no-stdin' || arg === '-I') {
    options.stdin = false;
  }

  else if (arg === '--ext' || arg === '-e') {
    options.ext = eatNext();
  }

  else if (arg === '--cwd') {
    options.cwd = eatNext();

    // go ahead and change directory. This is primarily for nodangel tools like
    // grunt-nodangel - we're doing this early because it will affect where the
    // user script is searched for.
    process.chdir(path.resolve(options.cwd));
  }

  else {
    return false; // this means we didn't match
  }
}

function findAppScript() {
  // nodangel has been run alone, so try to read the package file
  // or try to read the index.js file
  if (existsSync('./index.js')) { // FIXME is ./ the right location?
    return { exec: null, script: 'index.js' };
  }

  return null;
}

/**
 * Given an argument (ie. from nodangelOption()), will parse and return the
 * equivalent millisecond value or 0 if the argument cannot be parsed
 *
 * @param {String} argument value given to the --delay option
 * @return {Number} millisecond equivalent of the argument
 */
function parseDelay(value) {
  var millisPerSecond = 1000;
  var millis = 0;

  if (value.match(/^\d*ms$/)) {
    // Explicitly parse for milliseconds when using ms time specifier
    millis = parseInt(value, 10);
  } else {
    // Otherwise, parse for seconds, with or without time specifier, then convert
    millis = parseFloat(value) * millisPerSecond;
  }

  return isNaN(millis) ? 0 : millis;
}


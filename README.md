# nodangel

For use during development of a node.js based application.

nodangel will watch the files in the directory in which nodangel was started, and if any files change, nodangel will automatically restart your node application.

nodangel does **not** require *any* changes to your code or method of development. nodangel simply wraps your node application and keeps an eye on any files that have changed. Remember that nodangel is a replacement wrapper for `node`, think of it as replacing the word "node" on the command line when you run your script.

# Installation

Either through forking or by using [npm](http://npmjs.org) (the recommended way):

    npm install -g nodangel

And nodangel will be installed in to your bin path. Note that as of npm v1, you must explicitly tell npm to install globally as nodangel is a command line utility.

# Usage

nodangel wraps your application, so you can pass all the arguments you would normally pass to your app:

    nodangel [your node app]

For CLI options, use the `-h` (or `--help`) argument:

    nodangel -h

Using nodangel is simple, if my application accepted a host and port as the arguments, I would start it as so:

    nodangel ./server.js localhost 8080

Any output from this script is prefixed with `[nodangel]`, otherwise all output from your application, errors included, will be echoed out as expected.

nodangel also supports running and monitoring [coffee-script](http://jashkenas.github.com/coffee-script/) apps:

    nodangel server.coffee

If no script is given, nodangel will test for a `package.json` file and if found, will run the file associated with the *main* property ([ref](https://github.com/remy/nodemon/issues/14)).

You can also pass the debug flag to node through the command line as you would normally:

    nodangel --debug ./server.js 80

If you have a `package.json` file for your app, you can omit the main script entirely and nodangel will read the `package.json` for the `main` property and use that value as the app.

nodangel will also search for the `scripts.start` property in `package.json` (as of nodangel 1.1.x).

Also check out the [FAQ](https://github.com/tomekwi/nodangel/blob/master/faq.md) or [original nodemon issues](https://github.com/remy/nodemon/issues).

## Automatic re-running

nodangel was originally written to restart hanging processes such as web servers, but now supports apps that cleanly exit. If your script exits cleanly, nodangel will continue to monitor the directory (or directories) and restart the script if there are any changes.

## Manual restarting

Whilst nodangel is running, if you need to manually restart your application, instead of stopping and restart nodangel, you can simply type `rs` with a carriage return, and nodangel will restart your process.

## Config files

nodangel supports local and global configuration files. These are named `nodangel.json` and can be located in the current working directory or in your home directory.

The specificity is as follows, so that a command line argument will always override the config file settings:

- command line arguments
- local config
- global config

A config file can take any of the command line arguments as JSON key values, for example:

    {
      "verbose": true,
      "ignore": ["*.test.js", "fixtures/*"],
      "execMap": {
        "rb": "ruby",
        "pde": "processing --sketch={{pwd}} --run"
      }
    }

The above `nodangel.json` file might be my global config so that I have support for ruby files and processing files, and I can simply run `nodangel demo.pde` and nodangel will automatically know how to run the script even though out of the box support for processing scripts.

A further example of options can be seen in [sample-nodangel.md](https://github.com/tomekwi/nodangel/blob/master/doc/sample-nodangel.md)

*This section needs better documentation, but for now you can also see `nodangel --help config` ([also here](https://github.com/tomekwi/nodangel/blob/master/doc/cli/config.txt))*.

## Using nodangel as a module

Please see [doc/requireable.md](doc/requireable.md)

## Running non-node scripts

nodangel can also be used to execute and monitor other programs. nodangel will read the file extension of the script being run and monitor that extension instead of .js if there's no .nodangelignore:

    nodangel --exec "python -v" ./app.py

Now nodangel will run `app.py` with python in verbose mode (note that if you're not passing args to the exec program, you don't need the quotes), and look for new or modified files with the `.py` extension.

### Default executables

Using the `nodangel.json` config file, you can define your own default executables using the `execMap` property. This is particularly useful if you're working with a language that isn't supported by default by nodangel.

To add support for nodangel to know about the .pl extension (for Perl), the nodangel.json file would add:

    {
      "execMap": {
         "pl": "perl"
      }
    }

Now running the following, nodangel will know to use `perl` as the executable:

    nodangel script.pl

It's generally recommended to use the global `nodangel.json` to add your own `execMap` options. However, if there's a common default that's missing, this can be merged in to the project so that nodangel supports it by default, by changing [default.js](https://github.com/tomekwi/nodangel/blob/master/lib/config/defaults.js) and sending a pull request.

## Monitoring multiple directories

By default nodangel monitors the current working directory. If you want to take control of that option, use the `--watch` option to add specific paths:

    nodangel --watch app --watch libs app/server.js

Now nodangel will only restart if there are changes in the `./app` or `./libs` directory. By default nodangel will traverse sub-directories, so there's no need in explicitly including sub-directories.

## Specifying extension watch list

By default, nodangel looks for files with the `.js`, `.coffee`, and `.litcoffee` extensions. If you use the `--exec` option and monitor `app.py` nodangel will monitor files with the extension of `.py`. However, you can specify your own list with the `-e` (or `--ext`) switch like so:

    nodangel -e js,jade

Now nodangel will restart on any changes to files in the directory (or subdirectories) with the extensions .js, .jade.

## Ignoring files

By default, nodangel will only restart when a `.js` JavaScript file changes. In some cases you will want to ignore some specific files, directories or file patterns, to prevent nodangel from prematurely restarting your application.

This can be done via the command line:

    nodangel --ignore lib/ --ignore tests/

Or specific files can be ignored:

    nodangel --ignore lib/app.js

Patterns can also be ignored (but be sure to quote the arguments):

    nodangel --ignore 'lib/*.js'

Note that by default, nodangel will ignore the `.git`, `node_modules`, `bower_components` and `.sass-cache` directories.

## Delaying restarting

In some situations, you may want to wait until a number of files have changed. The timeout before checking for new file changes is 1 second. If you're uploading a number of files and it's taking some number of seconds, this could cause your app to restart multiple times unnecessarily.

To add an extra throttle, or delay restarting, use the `--delay` command:

    nodangel --delay 10 server.js

For more precision, milliseconds can be specified.  Either as a float:

    nodangel --delay 2.5 server.js

Or using the time specifier (ms):

    nodangel --delay 2500ms server.js

The delay figure is number of seconds (or milliseconds, if specified) to delay before restarting. So nodangel will only restart your app the given number of seconds after the *last* file change.

## Controlling shutdown of your script

nodangel sends a kill signal to your application when it sees a file update. If you need to clean up on shutdown inside your script you can capture the kill signal and handle it yourself.

The following example will listen once for the `SIGUSR2` signal (used by nodangel to restart), run the clean up process and then kill itself for nodangel to continue control:

    process.once('SIGUSR2', function () {
      gracefulShutdown(function () {
        process.kill(process.pid, 'SIGUSR2');
      });
    });

Note that the `process.kill` is *only* called once your shutdown jobs are complete. Hat tip to [Benjie Gillam](http://www.benjiegillam.com/2011/08/node-js-clean-restart-and-faster-development-with-nodangel/) for writing this technique up.

## Triggering events when nodangel state changes

If you want growl like notifications when nodangel restarts or to trigger an action when an event happens, then you can either `require` nodangel or simply add event actions to your `nodangel.json` file.

For example, to trigger a notification on a Mac when nodangel restarts, `nodangel.json` looks like this:

```json
{
  "events": {
    "restart": "osascript -e 'display notification \"app restarted\" with title \"nodangel\"'"
  }
}
```

A full list of available events is listed on the [event states wiki](https://github.com/tomekwi/nodangel/wiki/Events#states). Note that you can bind to both states and messages.

## Pipe output to somewhere else

```js
nodangel({
  script: ...,
  stdout: false // important: this tells nodangel not to output to console
}).on('readable', function() { // the `readable` event indicates that data is ready to pick up
  this.stdout.pipe(fs.createWriteStream('output.txt'));
  this.stderr.pipe(fs.createWriteStream('err.txt'));
});
```

## Using io.js for nodangel

If you *only* have io.js installed (and the default install creates a symlink from `node` to `iojs`), then nodangel will work just fine out of the box (or [should](https://github.com/remy/nodemon/issues/468)).

If you've got *both* node and io.js installed, then it's easy! You can either edit the local `nodangel.json` file (in your working directory) or in your `$HOME` directory containing:

```json
{
  "execMap": {
    "js": "iojs"
  }
}
```

Now you nodangel will use [io.js](https://iojs.org/) with JavaScript files instead of node.

## Using nodangel in your gulp workflow

Check out the [gulp-nodangel](https://github.com/JacksonGariety/gulp-nodangel) plugin to integrate nodangel with the rest of your project's gulp workflow.

## Using nodangel in your Grunt workflow

Check out the [grunt-nodangel](https://github.com/ChrisWren/grunt-nodangel) plugin to integrate nodangel with the rest of your project's grunt workflow.

## Pronunciation

> nodangel, is it pronunced: node-mon, no-demon or node-e-mon (like pokémon)?

Well...I've been asked this many times before. I like that I've been asked this before. There's been bets as to which one it actually is.

The answer is simple, but possibly frustrating. I'm not saying (how I pronounce it). It's up to you to call it as you like. All answers are correct :)

## FAQ

See the [FAQ](https://github.com/tomekwi/nodangel/blob/master/faq.md) and please add your own questions if you think they would help others.

# License

MIT [http://rem.mit-license.org](http://rem.mit-license.org)

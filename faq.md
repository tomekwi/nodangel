# FAQ

This is being added to as common issues occur on the [original nodemon issues](http://github.com/remy/nodemon/issues), and where appropriate the answers will be added here.

This is a working document, and if it makes sense, I'll take pull requests to help make it better.

## nodangel doesn't work with my REPL

Create an nodangel.json file with the setting:

```js
{
  "restartable": false
}
```

This will leave the STDIN to your application rather than listening for the `rs` command to restart.

# My script arguments are being taken by nodangel

Use the `--` switch to tell nodangel to ignore all arguments after this point. So to pass `-L` to your script instead of nodangel, use:

```
$ nodangel app.js -- -L -opt2 -opt3
```

nodangel will ignore all script arguments after `--` and pass them to your script.

# Help! My changes aren't being detected!

nodangel has three potential methods it uses to look for file changes. First, it polls using the find command to search for files modified within the last second. This method works on systems with a BSD based find.

Next it tries using node's `fs.watch`. `fs.watch` will not always work however, and nodangel will try and detect if this is the case by writing a file to the tmp directory and seeing if fs.watch is triggered when it's removed. If nodangel finds that fs.watch was not triggered, it will then fall back to the third method (called legacy watch), which works by statting each file in your working directory looking for changes to the last modified time. This is the most cpu intensive method, but it may be the only option on some systems.

In certain cases, like when where you are working on a different drive than your tmp directory is on, `fs.watch` may give you a false positive. You can force nodangel to start using the most compatible legacy method by passing the -L switch, e.g. `nodangel -L /my/odd/file.js`.

## nodangel tries to run two scripts

If you see nodangel trying to run two scripts, like:

```
9 Dec 23:52:58 - [nodangel] starting `node ./app.js fixtures/sigint.js`
```

This is because the main script argument (`fixtures/sigint.js` in this case) wasn't found, and a `package.json`'s main file *was* found. ie. to solve, double check the path to your script is correct.

## What has precedence, ignore or watch?

Everything under the ignore rule has the final word. So if you ignore the `node_modules` directory, but watch `node_modules/*.js`, then all changed files will be ignored, because any changed .js file in the `node_modules` are ignored.

## nodangel doesn't work with fedora

Fedora is looking for `nodejs` rather than `node` which is the binary that nodangel kicks off.

The solution is a simple workaround, Linux 101:

```bash
sudo ln -s /usr/bin/nodejs /usr/local/bin/node
```

Fedora and Ubuntu pakage node as nodejs, because node.dpkg is

> Description-en: Amateur Packet Radio Node program
 The node program accepts TCP/IP and packet radio network connections and
 presents users with an interface that allows them to make gateway connections
 to remote hosts using a variety of amateur radio protocols.
They make the binary is nodejs, rather than node. So long as you're not using that Packet Radio Node Program mentioned above the workaround will work.

Thank you [@EvanCarroll](https://github.com/remy/nodemon/issues/68#issuecomment-13672509)

## Using nodangel with forever

If you're using nodangel with [forever](https://github.com/nodejitsu/forever) (perhaps in a production environment) you can combine the two together. This way if the script crashes, forever restarts the script, and if there are file changes, nodangel restarts your script. For more detail, see [nodemon issue 30](https://github.com/remy/nodemon/issues/30).

To acheive this you need to include the `--exitcrash` flag to ensure nodangel exits if the script crashes (or exits unexpectedly):

    forever nodangel --exitcrash server.js

To test this, you can kill the server.js process and forever will restart it. If you `touch server.js` nodangel will restart it.

Note that I *would not* recommend using nodangel in a production environment - but that's because I wouldn't want it restart without my explicit instruction.

## What does "verbose" give me?

The `--verbose` (or `-V`) puts nodangel in verbose mode which adds some detail to starting and restarting.

Additional restart information:

- Which nodangel configs are loaded (local and global if found)
- Which ignore rules are being applied
- Which file extensions are being watch
- The process ID of your application (the `child pid`)

For example:

```text
14 Apr 15:24:58 - [nodangel] v1.0.17
14 Apr 15:24:58 - [nodangel] reading config /Users/remy/Sites/jsbin-private/nodangel.json
14 Apr 15:24:58 - [nodangel] to restart at any time, enter `rs`
14 Apr 15:24:58 - [nodangel] ignoring: /Users/remy/Sites/jsbin-private/.git/**/* node_modules/**/node_modules
14 Apr 15:24:58 - [nodangel] watching: /Users/remy/Sites/jsbin/views/**/* /Users/remy/Sites/jsbin/lib/**/* ../json/*.json config.dev.json
14 Apr 15:24:58 - [nodangel] watching extensions: json,js,html
14 Apr 15:24:58 - [nodangel] starting `node run.js`
14 Apr 15:24:58 - [nodangel] child pid: 9292
```

When nodangel detects a change, the following addition information is shown:

- Which file(s) triggered the check
- Which (if any) rules the file matched to cause a subsequent restart
- How many rules were matched and out of those rules, how many cause a restart
- A list of all the files that *successfully* caused a restart

For example, on `lib/app.js` being changed:

```text
14 Apr 15:25:56 - [nodangel] files triggering change check: ../jsbin/lib/app.js
14 Apr 15:25:56 - [nodangel] matched rule: **/Users/remy/Sites/jsbin/lib/**/*
14 Apr 15:25:56 - [nodangel] changes after filters (before/after): 1/1
14 Apr 15:25:56 - [nodangel] restarting due to changes...
14 Apr 15:25:56 - [nodangel] ../jsbin/lib/app.js

14 Apr 15:25:56 - [nodangel] starting `node run.js`
14 Apr 15:25:56 - [nodangel] child pid: 9556
```

## My .nodangelignore is being ignored

The new `nodangel.json` superceeds the `.nodangelignore` file, so if you have both, the `.nodangelignore` is not used at all.

Note that if you have a `nodangel.json` in your `$HOME` path, then this will also superceed the old ignore file.

## nodangel does nothing

On Ubuntu globally installed node applications have been found to have no output when they're run. This *seems* to be an issue with node not being correctly installed (possibly linked to the binary having to be called `nodejs`).

The solution (that's worked in the past) is to install [nvm](https://github.com/creationix/nvm) first and using it to install node, *rather* than using `apt-get` (or similar tools) to install node directly.

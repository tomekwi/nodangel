# Nodangel as a required module

Nodangel (as of 1.0.0) also works as a required module. At present, you can only require nodangel in to your project once (as there are static config variables), but you can re-run with new settings for a different application to monitor.

By requiring nodangel, you can extend it's functionality. Below is a simple example of using nodangel in your project:

```js
var nodangel = require('nodangel');

nodangel({
  script: 'app.js',
  ext: 'js json'
});

nodangel.on('start', function () {
  console.log('App has started');
}).on('quit', function () {
  console.log('App has quit');
}).on('restart', function (files) {
  console.log('App restarted due to: ', files);
});
```

Nodangel will emit a number of [events](https://github.com/tomekwi/nodangel/blob/master/doc/events.md) by default, and when in verbose mode will also emit a `log` event (which matches what the nodangel cli tool echos).

## Arguments

The `nodangel` function takes either an object (that matches the [nodangel config](https://github.com/tomekwi/nodangel#config-files)) or can take a string that matches the arguments that would be used on the command line:

```js
var nodangel = require('nodangel');

nodangel('-e "js json" app.js');
```

## Methods & Properties

The `nodangel` object also has a few methods and properties. Some are exposed to help with tests, but have been listed here for completeness:

### Event handling

This is simply the event emitter bus that exists inside nodangel exposed at the top level module (ie. it's the `events` api):

- `nodangel.on(event, fn)`
- `nodangel.addListener(event, fn)`
- `nodangel.once(event, fn)`
- `nodangel.emit(event)`
- `nodangel.removeAllListeners([event])`

Note: there's no `removeListener` (happy to take a pull request if it's needed).

### Test utilities

- `nodangel.reset()` - reverts nodangel's internal state to a clean slate
- `nodangel.config` - a reference to the internal config nodangel uses

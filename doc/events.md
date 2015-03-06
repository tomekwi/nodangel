# Events

nodangel will emit events based on the child process.

## Commands

- restart
- config:update
- quit

## States

- start - child process has started
- crash - child process has crashed (nodangel will not emit exit)
- exit - child process has cleanly exited (ie. no crash)
- restart([ array of files triggering the restart ]) - child process has restarted
- config:update - nodangel's config has changed

## Messages

- log({ type, message (plain text log), colour (colour coded log) }) - logging from nodangel (not the child process)
- stdout - the stdout stream from the child process
- stderr - the stderr stream from the child process
- readable - stdout and stderr streams are ready ([example](https://github.com/tomekwi/nodangel#pipe-output-to-somewhere-else))

Note that if you want to supress the normal stdout & stderr of the child, in favour
of processing the stream manually using the stdout/stderr nodangel events, pass
nodangel the option of `stdout: false`.

## Using nodangel events

If nodangel is required, events can be bound and emitted on the nodangel object:

```js
var nodangel = require('nodangel');

nodangel({ script: 'app.js' }).on('start', function () {
  console.log('nodangel started');
}).on('crash', function () {
  console.log('script crashed for some reason');
});

// force a restart
nodangel.emit('restart');

// force a quit
nodangel.emit('quit');
```

If nodangel is a spawned process, then the child (nodangel) will emit message
events whereby the event argument contains the event type, and instead of
emitting events, you `send` the command:

```js
var app = spawnNodangel();

app.on('message', function (event) {
  if (event.type === 'start') {
    console.log('nodangel started');
  } else if (event.type === 'crash') {
    console.log('script crashed for some reason');
  }
});

// force a restart
app.send('restart');

// force a quit
app.send('quit');
```

Note that even though the child will still emit a `message` event whose type is
`exit`, it makes more sense to listen to the actual `exit` event on the child:

```js
app.on('exit', function () {
  console.log('nodangel quit');
});
```

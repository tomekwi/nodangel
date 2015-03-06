# nodangel code arch

```
CLI -> parser -> nodangel options -> rules

rules -> configure -> watch -> start process
```

## CLI examples

Watch src but only *.js and *.coffee

    nodangel --watch src/ -e js,coffee app.js

Parsed to:

    {
      watch: ['src/'],
      ignore: [],
      script: 'app.js'
      options: {
        extensions: ['js', 'coffee'],
        exec: 'node'
      }
    }

Watch with no args:

    nodangel

Parsed to (assuming a package.json or index.js is found):

    {
      watch: [], // meaning all subdirectories
      ignore: [],
      script: 'index.js',
      options: {
        extensions: ['js'],
        exec: 'node'
      }
    }

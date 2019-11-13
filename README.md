# babel-plugin-directory-named

When you import from a folder it resolves to the `index.js` file
in that folder.

```js
import { magic } from './src/magic' // imports ./src/magic/index.js
```

This plugin allows you to name the entry file the same as the folder.

```js
import { magic } from './src/magic' // imports ./src/magic/magic.js
```

Nice! Now you don't need to have a bajillion `index.js` file scattered around
your project.

## Quick start

Install the plugin first:

```terminal
npm install --save-dev babel-plugin-directory-named
```

```json
{
  "plugins": [
    [
      "babel-plugin-directory-named",
      {
        "rootDir": "./src"
        "honorIndex": true | false // (default: false)
      }
    ]
  ]
}
```

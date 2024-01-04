# SSR WebC

This directory is a demo for rendering [WebC](https://www.11ty.dev/docs/languages/webc/#@html) components on the server.

It creates a little `node:http` server that renders [page.webc](./page.webc) with the Node.js `request` object.
The page uses the component [cool-counter](./components/cool-counter.webc) and that whole bundle is rendered within [layout.webc](./layout.webc) which bundles the HTML, CSS & JavaScript together.

> `cool-counter` is directly from [github.com/11ty/demo-webc-counter](https://github.com/11ty/demo-webc-counter)

## setup

Clone this repo locally, then:

```bash
# cd playground/webc-server

# Install WebC
npm install

# Run the server
node --watch index.js
```

## thoughts

- It would be nice if `node --watch` could also watch for webc with a glob,
  it might be able to but I didn't look very far into the docs

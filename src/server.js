import path from 'path';
import Express from 'express';
import bodyParser from 'body-parser';
import { createClient } from 'node-impala';

import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import webpackConfig from '../webpack.dev.config.js';

const app = new Express();
const port = process.env.PORT || 3003;

const client = createClient();

if (process.env.NODE_ENV !== 'production') {
  const compiler = webpack(webpackConfig);

  app.use(webpackDevMiddleware(compiler, {
    noInfo: true,
    publicPath: webpackConfig.output.publicPath
  }));
  app.use(webpackHotMiddleware(compiler));
} else {
  app.use(Express.static(path.join(__dirname, '../dist')));
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.get('/api/impala/config', (req, res) => {
  const config = {
    host: req.query.host,
    port: req.query.port,
    resultType: 'json-array'
  };
  client.connect(config)
    .then((result) => res.status(200).send(result))
    .catch(() => res.status(500).send('Connection could not be established.'));
});

app.get('/api/impala/:sql', (req, res) => {
  client.query(req.params.sql)
    .then(result => res.status(200).json(result))
    .catch(error => res.status(500).json(error.message));
});

const server = app.listen(port, (error) => {
  if (error) {
    console.error(error);
  } else {
    console.info('Listening on port %s...', server.address().port);
  }
});

export default app;

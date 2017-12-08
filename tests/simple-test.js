import test from 'ava';

const serve = require('koa-static');
const Koa = require('koa');
const app = new Koa();
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const makeDir = require('make-dir');
const puppeteer = require('puppeteer');

const PORT = 8567;

const exists = promisify(fs.exists);

async function createServer(port) {
  app.use(serve(path.join(__dirname, '..', 'dist')));

  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => resolve(server));
  });
}

async function runPuppeteer(t, sd) {
  const browser = await puppeteer.launch({
    headless: true
    //  args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  page.on('console', (...args) => {
    //console.log.apply(console, ['[Browser]', ...args]);
    console.log(args[0].text);
  });

  await page.goto(`http://localhost:${PORT}/index.html`);

  await page.mouse.click(200, 100, { clickCount: 2, delay: 50 });

  const screenShot = path.join(sd, 'screenShot.png');

  await page.screenshot({ path: screenShot });

  await browser.close();

  t.is(await exists(screenShot), true);
}

async function exec(t) {
  const sd = path.join(__dirname, '..', 'build');
  await makeDir(sd);
  const server = await createServer(PORT);
  await runPuppeteer(t, sd);

  server.close();
}

test('test', async t => {
  await exec(t);
});

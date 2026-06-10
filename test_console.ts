import puppeteer from 'puppeteer';
import { fork } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function check() {
  console.log('Starting server...');
  const server = fork('./node_modules/vite/bin/vite.js', ['--port', '3000'], {
    stdio: 'pipe'
  });

  await new Promise(resolve => setTimeout(resolve, 5000)); // wait for dev server

  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    const errors = [];
    page.on('pageerror', err => {
      errors.push('PAGE_ERROR: ' + err.toString());
    });
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push('CONSOLE_ERROR: ' + msg.text());
      }
    });

    console.log('Navigating to app...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Check if there is anything rendered
    const bodyContent = await page.evaluate(() => document.body.innerHTML);
    if (!bodyContent || bodyContent.trim() === '<div id="root"></div>' || bodyContent.trim() === '') {
       console.log('APP IS BLANK', bodyContent);
    } else {
       console.log('APP HTML LENGTH:', bodyContent.length);
       // grab up to first 200 chars
       console.log('START OF HTML:', bodyContent.substring(0, 500));
    }
    
    console.log('--- ERRORS FOUND ---');
    if (errors.length > 0) {
      errors.forEach(e => console.log(e));
    } else {
      console.log('No errors found!');
    }
    
    await browser.close();
  } catch (err) {
    console.error(err);
  } finally {
    server.kill();
    process.exit(0);
  }
}

check();

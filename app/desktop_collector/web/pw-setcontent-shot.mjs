import { chromium } from '@playwright/test';
import fs from 'node:fs';
let html=fs.readFileSync('/mnt/data/DATN-work/.design-cache/demo-device.html','utf8');
const css=fs.readFileSync('/mnt/data/DATN-work/app/desktop_collector/web/build/assets/index-17l4M1_h.css','utf8');
html=html.replace(/<link rel="stylesheet"[^>]+>/, `<style>${css}</style>`);
for (const [rel,path] of [
 ['../app/frontend/desktop/assets/one-ui/devices.svg','/mnt/data/DATN-work/app/frontend/desktop/assets/one-ui/devices.svg'],
 ['../app/frontend/desktop/assets/one-ui/sound-outline.svg','/mnt/data/DATN-work/app/frontend/desktop/assets/one-ui/sound-outline.svg'],
]) {
 const data=Buffer.from(fs.readFileSync(path)).toString('base64');
 html=html.replaceAll(rel,`data:image/svg+xml;base64,${data}`);
}
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.setContent(html,{waitUntil:'load'});
await page.waitForTimeout(200);
console.log('body', (await page.locator('body').innerText()).slice(0,300));
await page.screenshot({path:'/mnt/data/DATN-work/.design-cache/demo-device-dark-1440x900.png'});
await page.evaluate(()=>document.documentElement.dataset.theme='light');
await page.waitForTimeout(100);
await page.screenshot({path:'/mnt/data/DATN-work/.design-cache/demo-device-light-1440x900.png'});
await browser.close();

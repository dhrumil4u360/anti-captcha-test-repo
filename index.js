const puppeteer = require('puppeteer');
const ac = require("@antiadmin/anticaptchaofficial");

/* Configurations */
const API_KEY = 'API_KEY_HERE';
const PROXY_ADDRESS = null;
const PROXY_PORT = null;
const PROXY_LOGIN = null;
const PROXY_PASSWORD = null;
/* End of Configurations */

ac.setAPIKey(API_KEY);
(async () => {
    const browser = await puppeteer.launch({
        headless: false
    });
    const page = await browser.newPage();
    await page.goto('https://www.idealista.com/en/alquiler-viviendas/balears-illes/mallorca/', {
        waitUntil: 'networkidle2'
    });
    await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });

    const cookies = await page.cookies();
    cookiesHeader = "";
    cookies.forEach(cookie => {
        cookiesHeader += `${cookie.name}=${cookie.value}; `;
    });

    let config = {
        cookiesHeader: cookiesHeader,
        userAgent: await browser.userAgent(),
        siteKey: await getSiteKey(page),
        url: 'https://www.idealista.com/en/alquiler-viviendas/balears-illes/mallorca/'
    };

    if (!config.siteKey) {
        console.log('No captcha encountered.');
        return;
    }

    console.log('Recaptcha site key : ', config.siteKey);

    let gresponse = await solveWithoutProxy(config);

    console.log('Response from anti-captcha : ', gresponse);

    let gresponseSent = await page.evaluate((gresponse) => {

        document.getElementById('g-recaptcha-response').value = gresponse;
        handleCaptcha();
        return gresponse;
    }, gresponse);

    console.log('Response sent to idealista site : ', gresponseSent);
    console.log('Now waiting for 10 seconds to see if captcha is accepted');

    await sleep(10000);
    let siteKey = await getSiteKey(page);

    if (siteKey.length) {
        console.log('Oops! site has not accepted it!');
    }
    await browser.close();
})();

const getSiteKey = (page) => {
    return page.evaluate(() => {
        let captchaEl = document.getElementsByClassName('g-recaptcha');
        if (captchaEl.length) {
            return captchaEl[0].getAttribute('data-sitekey');
        } else {
            return null;
        }

    });
};

const solveWithoutProxy = (config) => {
    return ac.solveRecaptchaV2Proxyless(config.url, config.siteKey);
};

const solveWithProxy = (config) => {
    console.log('User Agent: ', config.userAgent);
    console.log('Cookies:', config.cookiesHeader);

    return ac.solveRecaptchaV2ProxyOn(config.url,
        config.siteKey,
        'http', //http, socks4, socks5
        PROXY_ADDRESS,
        PROXY_PORT,
        PROXY_LOGIN,
        PROXY_PASSWORD,
        config.userAgent,
        config.cookiesHeader);
};


const sleep = (ms) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

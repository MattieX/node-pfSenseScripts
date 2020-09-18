// Code to scrape YouTube for a playlist (works with videos > 100)
const puppeteer = require('puppeteer');

var pfSenseIP = process.env.pfSense_IP;
var ruleID = process.env.pfSense_RuleID;
var gatewayText = process.env.gatewayText;

var userName = process.env.pfSense_user;
var userPass = process.env.pfSense_pass;

const pfSenseAddress = () => "https://" + pfSenseIP;
const pfSenseRuleAddress = () => "https://" + pfSenseIP + "/firewall_rules_edit.php?id=" + ruleID;
const pfSenseLogoutAddress = () => "https://" + pfSenseIP + "/index.php?logout";

console.log("Launching puppeteer browser and loading pfSense...");

(async () => {
    const browser = await puppeteer.launch({ headless: true, defaultViewport: null, ignoreHTTPSErrors: true});
    const page = await browser.newPage();

    const navigationPromise = page.waitForNavigation();

    console.log("Loading pfSense...");
    await page.goto(pfSenseAddress);
    await page.waitForSelector('#usernamefld');
    await navigationPromise;

    console.log("Authenicating...");
    await page.type('#usernamefld', userName, {delay: 20})
    await page.type('#passwordfld', userPass, {delay: 20})

    await page.click('#total > div > div.col-sm-4.offset-md-4.logoCol > div > form > input.btn.btn-success.btn-sm'); 
    await navigationPromise;

    await page.waitForTimeout(1000);
    console.log("Loading firewall rule...");
    await page.goto(pfSenseRuleAddress);
    await navigationPromise;

    await page.waitForTimeout(1000);
    console.log("Picking new gateway...");
    await page.focus("#gateway");
    await page.evaluate(() => {
        const example = document.querySelector('#gateway');
        const example_options = example.querySelectorAll('option');
        const selected_option = [...example_options].find(option => option.text.includes(gatewayText));

        selected_option.selected = true;
    });

    await page.waitForTimeout(1000);
    console.log("Saving rule...");
    await page.click("#save");
    await navigationPromise;
    
    await page.waitForTimeout(1000);
    console.log("Applying new rules...");
    await page.click("#\\32  > div > div.alert.alert-warning.clearfix > form > button");
    await navigationPromise;

    await page.waitForTimeout(1000);
    console.log("Logging out...");
    await page.goto(pfSenseLogoutAddress);
    await navigationPromise;

    console.log("Done! Closing browser.");
    await browser.close();

})()

async function getHref(page, selector) {
    return await page.evaluate((selector) => {
        return document.querySelector(selector).href
    }, selector);
}

async function getText(page, selector) {
    return await page.evaluate((selector) => {
        return document.querySelector(selector).textContent.trim();
    }, selector);
}
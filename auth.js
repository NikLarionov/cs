#!/usr/bin/env node
const webdriver    = require('selenium-webdriver')
const proxy        = require('selenium-webdriver/proxy')
const https        = require('https')
const http         = require('http')
const MITM         = require('http-mitm-proxy')
const {api}        = require('./server.js')


let getToken = async (openidUrl) => {
    return api.post('/auth/sign-in', {
        data: {
            openidUrl
        }
    })
}


let makeBet = async (token, items, cashout) => {
    return api.post('/make-bet', {
        headers: {
            'Authorization': 'JWT ' + token
        },
        data: {
            userItemIds: items,
            auto: cashout
        }
    })
}

let authUrl
let mitm = MITM()

mitm.onError(function(ctx, err) {
  console.error('proxy error:', err);
})

mitm.onRequest(function(ctx, callback) {
    if (ctx.clientToProxyRequest.headers.host == 'www.google.com'
    && ctx.clientToProxyRequest.url.indexOf('/search') == 0) {
    ctx.use(Proxy.gunzip);
    ctx.onResponseData(function(ctx, chunk, callback) {
      chunk = new Buffer(chunk.toString().replace(/<h3.*?<\/h3>/g, '<h3>Pwned!</h3>'));
      return callback(null, chunk);
    });
    }
    let host = ctx.clientToProxyRequest.headers.host
    let path = ctx.clientToProxyRequest.url
    if (require.main === module) console.log(host + path)
    if (host == "csgrauth.ru") {
        
    }
    ctx.onResponseData((ctx, chunk, cb) => {
        return cb(null, chunk)
    })
    return callback();
});

mitm.listen({port: 8081})

let startAuth = async () => {
    let resp = await api.get('/auth/get-url')
    let url = resp.data.data.url
    let driver = new webdriver.Builder()
        .withCapabilities(webdriver.Capabilities.firefox().setAcceptInsecureCerts(true))
        .setProxy(proxy.manual({https: 'localhost:8081'}))
        .build()
    try {
        await driver.get(url)
    }
    catch (e) {
        console.error(e)
    }
}


startAuth()

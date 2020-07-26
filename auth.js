#!/usr/bin/env node
const webdriver    = require('selenium-webdriver')
const proxy        = require('selenium-webdriver/proxy')
const https        = require('https')
const http         = require('http')
const MITM         = require('http-mitm-proxy')
const {api}        = require('./server.js')



let getToken = (api, cb) => {
    let authUrl
    let token
    let driver = new webdriver.Builder()
        .withCapabilities(webdriver.Capabilities.firefox().setAcceptInsecureCerts(true))
        .setProxy(proxy.manual({https: 'localhost:8081'}))
        .build()
    let mitm = MITM()

    mitm.onError(function(ctx, err) {
      console.error('proxy error:', err);
    })

    mitm.onRequest(function(ctx, callback) {
        let host = ctx.clientToProxyRequest.headers.host
        let path = ctx.clientToProxyRequest.url 
        if (require.main === module) console.log(host + path)
        if (host.includes("api.csgorun.org") && ctx.clientToProxyRequest.headers.authorization) {
            driver.quit()        
            token = ctx.clientToProxyRequest.headers.authorization 
            cb(token)
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
        try {
            await driver.get(url)
        }
        catch (e) {
            console.error(e)
        }
    }


    startAuth()
}

module.exrpots.getToken = getToken

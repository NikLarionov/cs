#!/usr/bin/env node

const axios         = require('axios')
const cheerio       = require('cheerio')
const fs            = require('fs')
const Promise       = require('bluebird')
const realTime      = require('./realTime.js')

let concur = 1
let ms     = 500
let log = fs.createWriteStream('res.txt')
let addr = 'https://api.csgorun.org'

const AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/65.0.3325.181 Chrome/65.0.3325.181 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 7.0; Moto G (5) Build/NPPS25.137-93-8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.137 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 7_0_4 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11B554a Safari/9537.53',
  'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:60.0) Gecko/20100101 Firefox/60.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:59.0) Gecko/20100101 Firefox/59.0',
  'Mozilla/5.0 (Windows NT 6.3; Win64; x64; rv:57.0) Gecko/20100101 Firefox/57.0'
];

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const cs = axios.create({
    baseURL: 'https://csgorun.ru/',
    headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0'}
})

const api = axios.create({
    baseURL: addr,
    timeout: 10000,
    headers: {
        'User-Agent': AGENTS[Math.floor(Math.random()*AGENTS.length)],
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'close',
        'Upgrade-Insecure-Requests': '1',
        'If-None-Match': 'W/"393c-Mc/oG3InxbtaVRqsm0PeYj9yntQ"'
    },
    withCredentials: true
//Cookie: __cfduid=d16b0929dc78b817b15b4e38328e57b851593501834
})

const profile = axios.create({
//    GET /profile/76561198250071752 HTTP/1.1
    baseURL: 'https://csgorun.org/profile',
    timeout: 10000,
    headers: {
        'User-Agent': AGENTS[Math.floor(Math.random()*AGENTS.length)],
        'Host': 'csgorun.org',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'close',
        'Referer': 'https://csgorun.org/',
        'Cookie': '__cfduid=d16b0929dc78b817b15b4e38328e57b851593501834',
        'Upgrade-Insecure-Requests': 1
    }
})

/*
let ck = res.headers['set-cookie'][0].split(';')[0]
api.defaults.headers['Cookie'] = ck
*/


let getLastRes = async (n = 30) => {
    let i = n
    let hist = []
    try {
        let res = await api.get('/current-state')
        console.log('connected to host')
        let token = res.data.data.centrifugeToken
        realTime.traceGames(token, console.log)
        hist = res.data.data.game.history
        hist.forEach(e => {
            log.write(JSON.stringify(e) + ",\n")
        })
        if (n > 30) {
            n -= 30
            let lastIdx = hist[hist.length - 1].id - 1
            let ids = Array.from(Array(n), (_, i) => lastIdx - i)
            Promise.map(ids, id => {
                console.log(`requesting /games/${id}`)
                /*
                let data = api.get(`/games/${id}`)
                console.log(`data of ${id}: ${data}`)
                return {id: data.id, crash: data.crash}
                */
                return delay(ms).then(() => {return api.get(`/games/${id}`)})
            }, {concurrency: concur})
                .then(games => {
                    games.forEach(e => {
                        let info = {id: e.data.data.id, crash: e.data.data.crash}
                        console.log(info)
                        log.write(JSON.stringify(info) + ",\n")
                        hist.push(info)
                    })
                })
        }
        return hist
    }
    catch (e) {
        console.error(e)
    }
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

if (require.main === module) {
    if (process.argv[2]) {
        console.log(`requesting ${process.argv[2]} games`)
        getLastRes(parseInt(process.argv[2])).then(e => {
            try {
                console.log(e)
                console.log(e.length)
            }
            catch (e) {
                console.error(e)
            }    
        }).catch(console.error)
    }
}
else {
    module.exports.getLastRes = getLastRes
    module.exports.api = api
    module.exports.cs = cs
    module.exports.profile = profile
}

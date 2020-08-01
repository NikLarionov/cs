#!/usr/bin/env node

const axios         = require('axios')
const cheerio       = require('cheerio')
const fs            = require('fs')
const Promise       = require('bluebird')
const realTime      = require('./realTime.js')

let concur = 1
let log = fs.createWriteStream('res.txt')
let addr = 'https://api.csgorun.org'
let lastGames = []

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

let getLastRes = async (event, n, ms, trace=false) => {
    let i = n
    let idx = 0
    let hist = []
    try {
        let res = await api.get('/current-state')
        console.log('connected to host')
        let token = res.data.data.centrifugeToken
        if (trace) realTime.traceGames(token, e => {
            if (e === 'start') {
                event.reply('gameStarted')
            }
            else {
                lastGames.push(e)
                event.reply('message', {id: '_', txt: e, start: true})
            }
        })
        event.reply('message', 'connected to host')
        hist = res.data.data.game.history
        hist.forEach(e => {
            event.reply('message', {id: e.id, txt: e.crash, start: false})
            log.write(JSON.stringify(e.crash) + "\n")
            ++idx; event.reply('count', idx); 
        })
        if (n > 30) {
            n -= 30
            let lastIdx = hist[hist.length - 1].id - 1
            let ids = Array.from(Array(n), (_, i) => lastIdx - i)
            Promise.map(ids, id => {
                console.log(`requesting /games/${id}`)
                ++idx; event.reply('count', idx); 
                return delay(ms).then(() => {return api.get(`/games/${id}`)})
            }, {concurrency: concur})
                .then(games => {
                    games.forEach(e => {
                        let info = {id: e.data.data.id, crash: e.data.data.crash}
                        console.log(info)
                        event.reply('message', {id: info.id, txt: info.crash, start: false})
                        log.write(info.crash + "\n")
                        hist.push(info)
                    })
                }).catch(e => {
                    console.error(e)
                    event.reply('error', e)
                })
        }
        return hist
    }
    catch (e) {
        event.reply('error', e)
        console.error(e)
    }
}

/* BAD FUNCTIONS */
let makeBet = async (token, items, cashout) => {
    console.log('makeBet')
    return delay(2000).then(_ => {
        return api('/make-bet', {
                method: 'post',
                headers: {
                    'Authorization': token
                },
                data: {
                    userItemIds: items,
                    auto: cashout.toString()
                }
            }).catch(console.error)
    })
}

let getItems = async (token) => {
    console.log('getItems')
    return api.get('/current-state', {
        headers: {
            Authorization: token
        }
    }).then(resp => {
        return resp.data.data.user.items
    })
}

function main() {
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

if (require.main === module) {
    let token = 'JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAwMTA1LCJpYXQiOjE1OTU3ODE5NzksImV4cCI6MTYwMDk2NTk3OX0.X25xyCaaXy_CpMEs1pWkrhu0c4VkwJAieRFzQt2ntlk'
    makeBet(token, [188908280], '1.1').then(console.log).catch(console.error)
}
else {
    module.exports.getLastRes = getLastRes
    module.exports.api = api
    module.exports.cs = cs
    module.exports.profile = profile
    module.exports.log = log
    module.exports.lastGames = lastGames
    module.exports.getItems = getItems
    module.exports.makeBet = makeBet
}

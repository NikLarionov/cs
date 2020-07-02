const axios = require('axios')
//const cheerio = require('cheerio')
const fs      = require('fs')

let log = fs.createWriteStream('res.txt')
const addr = 'https://api.csgorun.org'

const AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/65.0.3325.181 Chrome/65.0.3325.181 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 7.0; Moto G (5) Build/NPPS25.137-93-8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.137 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 7_0_4 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11B554a Safari/9537.53',
  'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:60.0) Gecko/20100101 Firefox/60.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:59.0) Gecko/20100101 Firefox/59.0',
  'Mozilla/5.0 (Windows NT 6.3; Win64; x64; rv:57.0) Gecko/20100101 Firefox/57.0'
];

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



let getLastRes = async (n = 30) => {
    let i = n
    let hist = []
    let add = async () => {
        let res = await api.get(`/games/${i}`)
        let info = res.data
        let e = {id: info.data.id, crash: info.data.crash}
        hist.push(e)
        log.write(JSON.stringify(e) + "\n")
        --i;
    }
    try {
        let res = await api.get('/current-state')
        console.log('connected to host')
        /*
        let ck = res.headers['set-cookie'][0].split(';')[0]
        api.defaults.headers['Cookie'] = ck
        */
        hist = res.data.data.game.history
        hist.forEach(e => {
            log.write(JSON.stringify(e) + "\n")
        })
        if (n > 30) {
            n -= 30
            console.log(n)
            let lastIdx = hist[hist.length - 1].id
            setInterval(add, 500)
            while (i > lastIdx - n) {
                await sleep(1000)
            }
        }
        log.end()
        return hist
    }
    catch (e) {
        console.error(e)
    }
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
}

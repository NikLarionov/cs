const axios = require('axios')
const cheerio = require('cheerio')

const cs = axios.create({
    baseURL: 'https://csgorun.ru/',
    headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0'}
})

const api = axios.create({
    baseURL: 'https://api.csgorun.org/',
    timeout: 10000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:77.0) Gecko/20100101 Firefox/77.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'close',
        'Upgrade-Insecure-Requests': '1',
        'If-None-Match': 'W/"393c-Mc/oG3InxbtaVRqsm0PeYj9yntQ"'
    },
//Cookie: __cfduid=d16b0929dc78b817b15b4e38328e57b851593501834
})

let getLastRes = async (n = 30) => {
    try {
        let res = await api.get('/current-state')
        let ck = res.headers['set-cookie'][0].split(';')[0]
        api.defaults.headers['Cookie'] = ck
        let hist = res.data.data.game.history
        if (n > 30) {
            console.log(n)
            n -= 30
            let lastIdx = hist[hist.length - 1].id
            for (let i = lastIdx - 1; i >= lastIdx - n; --i) {
                let res = await api.get(`/games/${i}`)
                let info = res.data
                hist.push({id: info.data.id, crash: info.data.crash})
            }    
        }
        return hist
    }
    catch (e) {
        console.error(e)
    }
}

getLastRes(300).then(e => {
    console.log(e)
    console.log(e.length)
}).catch(console.error)

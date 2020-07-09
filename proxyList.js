const axios     = require('axios')
const tunnel    = require('tunnel')
const cheerio   = require('cheerio')
const fs        = require('fs')
const qs        = require('querystring')


const AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/65.0.3325.181 Chrome/65.0.3325.181 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 7.0; Moto G (5) Build/NPPS25.137-93-8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.137 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 7_0_4 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11B554a Safari/9537.53',
  'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:60.0) Gecko/20100101 Firefox/60.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:59.0) Gecko/20100101 Firefox/59.0',
  'Mozilla/5.0 (Windows NT 6.3; Win64; x64; rv:57.0) Gecko/20100101 Firefox/57.0'
];


let browserHeaders = () => {
    return {
        'User-Agent': AGENTS[Math.floor(Math.random()*AGENTS.length)],
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'close',
        'Upgrade-Insecure-Requests': '1',
        'If-None-Match': 'W/"393c-Mc/oG3InxbtaVRqsm0PeYj9yntQ"'
    }
}

let getFreeProxyListNet = (tls = false) => {
    let freeProxyListNet = 'https://free-proxy-list.net/'
    console.time('requesting proxy list')
    return axios.get(freeProxyListNet, {
        headers: browserHeaders()
    }).then(resp => {
        console.timeEnd('requesting proxy list')
        fs.writeFile('resp.html', resp.data, _ => console.log('wrote file resp.html'))
        let $ = cheerio.load(resp.data) 
        let proxyList = []
        $('#proxylisttable tbody').children('tr').each(function(idx) {
            let res = {}
            let ar = ['ip', 'port']
            if (!tls || $(this).find('.hx').text() === 'yes') {
                $(this).children().slice(0, 2).each(function (idx1) {
                    res[ar[idx1]] = $(this).text()
                })
                res.port = parseInt(res.port)
                console.log(res)
                proxyList.push(res)
            }
        })
        console.log(proxyList.length)
        return proxyList
    })
}

let spysOne = () => {
    let addr = 'http://spys.one/en/socks-proxy-list/'
//xx0=383b00898ac5d1006a96b0640df507f7&xpp=5&xf1=0&xf2=0&xf4=0&xf5=2
    let hdrs = browserHeaders()
    axios.get(addr, {
        headers: hdrs,
    }).then(resp => {
        let $ = cheerio.load(resp.data)
        let val = $('input[name="xx0"]').val()
        hdrs['Content-Length'] = '66'
        hdrs['Origin'] = 'http://spys.one '
        hdrs['Connection'] = 'keep-alive'
        hdrs['Referer'] = 'http://spys.one/en/socks-proxy-list/'
        hdrs['Content-Type'] = 'application/x-www-form-urlencoded'
        hdrs['host'] = 'spys.one' 
        let data = {xx0: val, xpp: "5", xf1: "0", xf2: "0", xf4: "0", xf5: "2"}
        return axios({
            method: 'post',
            url: addr,
            headers: hdrs,
            data: qs.stringify(data),
        })
    }).then(resp => {
        fs.writeFile('response.html', resp.data, _ => console.log('wrote file'))
        let $ = cheerio.load(resp.data)
        let res = []
        let vars = $('body').find('script').eq(2).html()
        eval(vars)
        console.log(vars)
        $('.spy1x, .spy1xx').each(function (idx) {
            let ip = $(this).find('td').first().text()
            if (match = /(\d+\.\d+\.\d+\.\d+).*/.exec(ip)) {
                ip = match[1]
            }
            let scr = $(this).find('script').first().html()
            if (!scr) return;
            let port = scr.slice(0, scr.length - 1).split('+').slice(1).map(e => eval(e).toString()).join('')
            res.push({ip: ip, port: port})
        })
        console.log(res)
        return res
    }).catch(console.error)
        
}

let httpsList = async (tls = false, n) => {
    return getFreeProxyListNet(tls)
}

let socksList = async () => {
    return spysOne()
}

if (require.main === module) {
    socksList()
}
else {
    module.exports.httpsList = httpsList
    module.exports.socksList = socksList
}

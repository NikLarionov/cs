#!/usr/bin/env node
const fs    = require('fs')
const WS    = require('ws')

/*
server.profile.get('/76561198250071752').then(resp => {
    fs.writeFile('profile.html', resp.data, _ => console.log('wrote file'))
})
*/

let traceGames = (token, cb) => {
    let wsLog = fs.createWriteStream('wsLog.json')
    let addr = 'https://ws.csgorun.org/connection/websocket'
    let ws   = new WS(addr)
    ws.on('open', () => {
        console.log('connected to host')
        ws.send(JSON.stringify({
            params: {
                token: token
            },
            id: 1
        }))
    })
    ws.on('message', mes => {
        wsLog.write('$' + mes)
        let messages = mes.split('\n').filter(e => e !== '').map(e => JSON.parse(e))
        messages.forEach(data => {
            let result = data.result
            if (data.id === 1) {
                //client = result.client
                ws.send(JSON.stringify({
                    method: 1,
                    params: {
                        channel: "game"
                    },
                    id: 2
                }))
            }
            else if (!data.id){
                let game = result.data.data
                if (game.type === 'c') {
                    //console.log(game.c)
                    cb(game.c)
                }
                else if (game.type === 'start') {
                    cb('start')
                }
            }
        })
    })
    ws.on('error', console.error)
}

module.exports.traceGames = traceGames

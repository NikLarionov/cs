#!/usr/bin/env node
const mane  = require('./mane.js')
const fs    = require('fs')
const WS    = require('ws')

mane.profile.get('/76561198250071752').then(resp => {
    fs.writeFile('profile.html', resp.data, _ => console.log('wrote file'))
})

mane.api.get('/current-state').then(resp => {
    console.log('got state')
    let wsLog = fs.createWriteStream('wsLog.json')
    let token = resp.data.data.centrifugeToken
    console.log(token)
    let addr = 'https://ws.csgorun.org/connection/websocket'
    let ws   = new WS(addr)
    let cilent
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
                client = result.client
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
                    console.log(game.c)
                }
            }
        })
    })
    ws.on('error', console.error)
})

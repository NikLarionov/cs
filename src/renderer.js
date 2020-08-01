const ipcRenderer = require('electron').ipcRenderer;

let promptTxt = '>>> '

let args = ['#num', '#ms', '#fn'].map(e => document.querySelector(e))
let update  = document.getElementById('update')
let button  = document.querySelector('#subm')
let counter = document.querySelector('#counter')
let mesBox  = document.querySelector('#mesbox')
let active  = document.getElementById('active')


function colorGen(lst = mesBox.children) {
    this.colors = {}
    this.stack = []
    this.lst = lst
    this.f = (cond) => {
        let f = (n) => {return false}
        if (cond.includes('..')) {
            let [fr, to] = cond.split('..').map(e => parseInt(e))
            if (isNaN(fr) || isNaN(to)) {
                return f
            }
            f = (n) => {
                n = parseInt(n)
                console.log(`f: ${fr} <= ${n} <= ${to}`)
                if (n >= fr && n <= to)
                    return true;
                return false;
            }
        }
        else {
            let x = parseInt(cond)
            if (isNaN(x)) {
                return f
            }
            f = (n) => {
                if (n === x)
                    return true
                return false
            }
        }
        return f
    }
    this.add = (cond, col) => {
        console.log(`add was called with ${cond}, ${col}`)
        let fun = this.f(cond)
        this.stack.push({color: col, f: fun})
        console.log(this.stack.length)
        for (let i = 0; i < this.lst.length; ++i) {
            let p = this.lst[i]
            let x = p.textContent.split(promptTxt)[1]
            if (fun(x)) {
                p.style.color = col
            }
        }
        console.log(this.stack.length)
    }
    this.changeF = (idx, cond) => {
        console.log(this.stack.length)
        console.log(`changeF was called with ${idx}, ${cond}`)
        this.stack[idx].f = this.f(cond)
        console.log(this.stack.length)
        this.genAll()
        console.log(this.stack.length)
    }
    this.changeC = (idx, col) => {
        console.log(this.stack.length)
        console.log(`changeC was called with ${idx}, ${col}`)
        this.stack[idx].color = col
        console.log(this.stack.length)
        this.genAll()
    }

    this.gen = (p) => {
        let x = parseInt(p.textContent.split(promptTxt)[1])
        this.stack.forEach(e => {
            if (e.f(x)) {
                console.log('success')
                p.style.color = e.color
            }
        })
    }

    this.genAll = () => {
        for (let i = 0; i < this.lst.length; ++i) {
            let p = this.lst[i]
            this.gen(p)
        }
    }
}

function colorInput(n, col, idx) {
    this.n = n
    this.col = col
    this.was = false
    this.idx = idx
    this.n.onchange = () => {
        if (!this.was && this.col.value.length !== 0) {
            colorHandler.add(this.n.value, this.col.value)
            this.was = true
        }
        else if (this.was){
            colorHandler.changeF(this.idx, this.n.value)
        }
    }
    this.col.onchange = () => {
        if (!this.was && this.n.value.length !== 0) {
            colorHandler.add(this.n.value, this.col.value)
            this.was = true
        }
        else if (this.was){
            colorHandler.changeC(this.idx, this.col.value)
        }
    }
}

let colorHandler = new colorGen()
let colorInputs  = []
let input        = document.querySelector('.input')

document.getElementById('addColor').onclick = () => {
    let div = document.createElement('div')
    div.className = 'input-group'
    let input1 = document.createElement('input')
    input1.type = 'text'
    input1.className = 'form-control'
    input1.placeholder = 'x..y or x'
    let input2 = document.createElement('input')
    input2.type = 'text'
    input2.className = 'form-control'
    input2.placeholder = 'i.e. red'

    let h = new colorInput(input1, input2, colorInputs.length)
    colorInputs.push(h)

    div.appendChild(input1)
    div.appendChild(input2)
    input.appendChild(div)
}

function send() {
    event.preventDefault() // stop the form from submitting
    args = args.map(e => e.value)
    if (isNaN(parseInt(args[0])) || isNaN(parseInt(args[1]))) {
        alert('Bad Arguments ;(')
        return
    }
    ipcRenderer.send('form-submission', args[0], args[1], args[2], update.checked)
}

let lastGames = []

ipcRenderer.on('message', (event, arg) => {
    let id  = arg.id  || ''
    let txt = arg.txt || arg
    let p = document.createElement('p')
    p.textContent = id + promptTxt + txt
    if (id === '_') {
        lastGames.push(parseFloat(txt))
        if (active.checked) {
            console.log('checking')
            parser.gamble(lastGames)     
        }
    }
    if (arg.start && mesBox.childElementCount > 0) {
        let first = mesBox.children[0]
        mesBox.insertBefore(p, first)
    }
    else {
        mesBox.appendChild(p)
    }
    colorHandler.gen(p)
})

ipcRenderer.on('count', (event, arg) => {
    counter.textContent = `${arg}/${args[0]}`
})

ipcRenderer.on('error', (event, arg) => {
    alert(arg)
})

let authBtn = document.getElementById('auth')
authBtn.onclick = (event) => {
    event.preventDefault()
    ipcRenderer.send('auth') 
}

ipcRenderer.on('authDone', (event, arg) => {
    document.querySelector('.bet-calc').style.display = 'block'
})

let TOKEN

ipcRenderer.on('token', (event, arg) => {
    TOKEN = arg 
    console.log(TOKEN)
})

function Formula(cond) {
    cond = cond.split('->')
    if (cond.length < 2) {
        alert('bad formula')
    }
    this.res = cond[1]
    if (!isNaN(parseFloat(this.res))) {
        this.res = parseFloat(this.res)
        this.useIdx = false
    }
    else {
        let regx = /a\[(\d+)\]/
        let match = regx.exec(this.res)
        if (match) {
            this.useIdx = true
            this.res = parseInt(match[1])
            if (this.res < 0) this.res = -1*(this.res + 1)
            else if (this.res > 0) this.res = this.res - 1
        }
    }
    let ar = cond[0].split(',')    

    this.conds = ar.map(e => {
        let regcheck = /a\[(\d+)\]\s*([><=])\s*([0-9.])/
        let match = regcheck.exec(e)
        if (match) {
            let op1     = parseInt(match[1])
            let oper    = match[2]
            let op2     = parseFloat(match[3])
            if (isNaN(op1) || isNaN(op2)) alert('bad formula')
            if (op1 < 0) op1 = -1*(op1 + 1)
            else if (op1 > 0) op1 = op1 - 1
            return [op1, oper, op2]
        }
        else alert('bad formula') 
    })

    if (this.conds.includes(undefined)) alert('bad formula')

    this.check = (games) => {
        console.log(games)
        let ok = this.conds.every(e => {
            if (e[0] > games.length) return false 
            if (e[1] == '<') {
                if (games[games.length - e[0]] > e[2]) return false
            }
            else if (e[1] == '>') {
                if (games[games.length - e[0]] < e[2]) return false
            }
            else if (e[1] == '=') {
                if (games[games.length - e[0]] != e[2]) return false
            }
            return true
        })
        console.log("OK: " + ok)
        if (ok) {
            if (this.useIdx) {
                if (this.res > games.length) return false
                return games[this.res]
            }
            else {
                return this.res
            }
        }
        else {
            return false
        }
    }    
}

let makeBet = (sum, cout) => {
    console.log('IN MAKGEBET')
    ipcRenderer.send('getItems')
    ipcRenderer.once('gotItems', (event, items) => {
        let ids = []
        let curSum = 0
        items.sort((a, b) => {
            if (a.price < b.price) return -1
            if (a.price > b.price) return 1
            return 0
        })
        items.every(e => {
            if (curSum >= sum) return false
            curSum += e.price
            ids.push(e.id)
            return true
        })
        console.log(items)
        if (curSum == 0) {
            alert("no items ;(")
        }
        else {
            ipcRenderer.once('gameStarted', (event) => {
                console.log('making bet')
                ipcRenderer.send('makeBet', ids, cout)
            })
        }
    })
}


function formParser() {
    this.stack = []

    this.f = (cond) => {
        let res = new Formula(cond)
        if (!res) alert('bad formula')
        else return res
    }

    this.add = (txt, sum) => {
        let fun = this.f(txt)
        this.stack.push({sum: sum, f: fun})
    }

    this.changeF = (idx, cond) => {
        this.stack[idx].f = this.f(cond)
    }

    this.changeS = (idx, col) => {
        this.stack[idx].sum = sum
    }

    this.gamble = (games) => {
        console.log('gamblig')
        this.stack.every(e => {
            let res = e.f.check(games)
            console.log(res)
            if (res) {
                console.log('GAMBLE: making bet')
                makeBet(e.sum, res)
                return false
            }
            return true
        })
    }
}

function formInput(txt, sum, idx) {
    this.txt = txt
    this.sum = sum
    this.was = false
    this.idx = idx
    this.txt.onchange = () => {
        if (!this.was && this.sum.value.length !== 0) {
            parser.add(this.txt.value, this.sum.value)
            this.was = true
        }
        else if (this.was){
            parser.changeF(this.idx, this.txt.value)
        }
    }
    this.sum.onchange = () => {
        if (!this.was && this.txt.value.length !== 0) {
            parser.add(this.txt.value, this.sum.value)
            this.was = true
        }
        else if (this.was){
            parser.changeS(this.idx, this.sum.value)
        }
    }
}


let parser       = new formParser()
let betInputs    = []
let bets         = document.querySelector('.bets')

document.getElementById('addFormula').onclick = () => {
    let div = document.createElement('div')
    div.className = 'input-group'
    let input1 = document.createElement('input')
    input1.type = 'text'
    input1.className = 'form-control'
    input1.placeholder = 'e.g. a[1] <= 1.1, a[2] <= 1.2 -> 1.1'
    let input2 = document.createElement('input')
    input2.type = 'text'
    input2.className = 'form-control'
    input2.placeholder = 'e.g. 1 or 1$'

    let h = new formInput(input1, input2, betInputs.length)
    betInputs.push(h)

    div.appendChild(input1)
    div.appendChild(input2)
    bets.appendChild(div)
}

const ipcRenderer = require('electron').ipcRenderer;

let promptTxt = '>>> '

let args = ['#num', '#ms', '#fn'].map(e => document.querySelector(e))
let update = document.getElementById('update')
let button = document.querySelector('#subm')
let counter = document.querySelector('#counter')
let mesBox  = document.querySelector('#mesbox')


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
        console.log(this.stack.length)
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
    ipcRenderer.send('form-submission', args[0], args[1], args[2], update.value === 'true' ? true : false)
}


ipcRenderer.on('message', (event, arg) => {
    let id  = arg.id  || ''
    let txt = arg.txt || arg
    let p = document.createElement('p')
    p.textContent = id + promptTxt + txt
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

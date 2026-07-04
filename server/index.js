// server/index.js —— 岳渎公园后端服务（小程序 + 网页版共用）
const express = require('express')
const cors = require('cors')
const path = require('path')
const { initDB } = require('./db')
const spotsRouter = require('./routes/spots')
const messagesRouter = require('./routes/messages')
const weatherRouter = require('./routes/weather')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// API 路由
app.use('/api/spots', spotsRouter)
app.use('/api/messages', messagesRouter)
app.use('/api/weather', weatherRouter)
app.get('/api/health', (req, res) => res.json({ status: 'ok', name: '岳渎公园后端服务', version: '1.0.0' }))

// 网页版静态文件（入口在项目根目录的 index.html）
app.use(express.static(path.join(__dirname, '..')))
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'index.html')))

initDB()
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🏞️  岳渎公园 → http://localhost:${PORT}`)
})

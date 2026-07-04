// server/routes/messages.js —— 游客留言 API
const express = require('express')
const router = express.Router()
const { queryAll, queryOne, run } = require('../db')

// GET /api/messages?spotId=xxx&page=1&limit=20
router.get('/', (req, res) => {
  const { spotId, page = 1, limit = 20 } = req.query
  const params = []

  let where = ''
  if (spotId) { where = ' WHERE spotId = ?'; params.push(spotId) }

  try {
    const { total } = queryOne(`SELECT COUNT(*) AS total FROM messages${where}`, params)
    const offset = (parseInt(page) - 1) * parseInt(limit)
    const messages = queryAll(`SELECT * FROM messages${where} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset])
    res.json({ success: true, data: messages, total, page: parseInt(page) })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// POST /api/messages
router.post('/', (req, res) => {
  const { spotId = null, spotName = '', nickname = '游客', content, rating = 5 } = req.body
  if (!content || !content.trim()) return res.status(400).json({ success: false, error: '留言内容不能为空' })
  if (content.trim().length > 500) return res.status(400).json({ success: false, error: '留言不能超过500字' })

  try {
    run('INSERT INTO messages (spotId, spotName, nickname, content, rating) VALUES (?,?,?,?,?)',
      [spotId, spotName, (nickname||'游客').trim().slice(0,20), content.trim(), Math.min(5,Math.max(1,parseInt(rating)||5))])
    const last = queryOne('SELECT last_insert_rowid() AS id')
    res.json({ success: true, data: { id: last.id, spotId, spotName, nickname: nickname||'游客', content: content.trim(), rating, createdAt: new Date().toLocaleString('zh-CN') } })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// DELETE /api/messages/:id
router.delete('/:id', (req, res) => {
  try {
    run('DELETE FROM messages WHERE id = ?', [req.params.id])
    res.json({ success: true, message: '留言已删除' })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

module.exports = router

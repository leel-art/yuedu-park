// server/routes/spots.js —— 景点 API
const express = require('express')
const router = express.Router()
const { queryAll, queryOne } = require('../db')

// GET /api/spots
router.get('/', (req, res) => {
  const { category, keyword } = req.query
  let sql = 'SELECT * FROM spots WHERE 1=1'
  const params = []

  if (category && category !== 'all') {
    sql += ' AND category = ?'; params.push(category)
  }
  if (keyword) {
    sql += ' AND (name LIKE ? OR subtitle LIKE ? OR description LIKE ? OR location LIKE ?)'
    const kw = `%${keyword}%`
    params.push(kw, kw, kw, kw)
  }
  sql += ' ORDER BY sortOrder ASC'

  try {
    const spots = queryAll(sql, params)
    const result = spots.map(s => ({
      ...s, gallery: JSON.parse(s.gallery||'[]'), location: JSON.parse(s.location||'{}'), detail: JSON.parse(s.detail||'[]')
    }))
    res.json({ success: true, data: result, total: result.length })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// GET /api/spots/:id
router.get('/:id', (req, res) => {
  try {
    const spot = queryOne('SELECT * FROM spots WHERE id = ?', [req.params.id])
    if (!spot) return res.status(404).json({ success: false, error: '景点不存在' })
    spot.gallery = JSON.parse(spot.gallery||'[]')
    spot.location = JSON.parse(spot.location||'{}')
    spot.detail = JSON.parse(spot.detail||'[]')
    res.json({ success: true, data: spot })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

module.exports = router

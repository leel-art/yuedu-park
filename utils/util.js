// utils/util.js —— 数据服务层
// 优先从云数据库获取，失败时降级为本地数据
const { spots: localSpots } = require('../data/spots')

// =====================================================
// 云端数据接口
// =====================================================

/**
 * 从云端获取景点列表
 * @param {Object} params - { category, keyword, page, pageSize }
 * @returns {Promise<Array>}
 */
async function fetchSpotsFromCloud(params = {}) {
  try {
    const res = await wx.cloud.callFunction({
      name: 'getSpots',
      data: {
        category: params.category || '',
        keyword: params.keyword || '',
        page: params.page || 1,
        pageSize: params.pageSize || 20
      }
    })
    if (res.result && res.result.success) {
      return res.result.data
    }
    console.warn('[数据] 云函数返回异常，降级为本地数据')
    return null
  } catch (err) {
    console.warn('[数据] 云函数调用失败，降级为本地数据:', err.message)
    return null
  }
}

/**
 * 从云端获取单个景点详情
 * @param {String} spotId
 * @returns {Promise<Object|null>}
 */
async function fetchSpotFromCloud(spotId) {
  try {
    const res = await wx.cloud.callFunction({
      name: 'getSpotById',
      data: { spotId }
    })
    if (res.result && res.result.success) {
      return res.result.data
    }
    console.warn('[数据] 云函数返回异常，降级为本地数据')
    return null
  } catch (err) {
    console.warn('[数据] 云函数调用失败，降级为本地数据:', err.message)
    return null
  }
}

// =====================================================
// 统一数据接口（云端优先 + 本地降级）
// =====================================================

/**
 * 获取景点列表（云端优先，失败时降级本地）
 */
async function getSpots(params = {}) {
  const cloudData = await fetchSpotsFromCloud(params)
  if (cloudData && cloudData.length > 0) return cloudData

  // 降级：使用本地数据
  let result = localSpots
  if (params.category && params.category !== 'all') {
    result = result.filter(s => s.category === params.category)
  }
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    result = result.filter(s =>
      s.name.toLowerCase().includes(kw) ||
      s.subtitle.toLowerCase().includes(kw) ||
      s.description.toLowerCase().includes(kw) ||
      s.location.address.toLowerCase().includes(kw)
    )
  }
  return result
}

/**
 * 获取单个景点（云端优先，失败时降级本地）
 */
async function getSpotById(spotId) {
  const cloudData = await fetchSpotFromCloud(spotId)
  if (cloudData) return cloudData

  // 降级：使用本地数据
  return localSpots.find(s => s.id === spotId) || null
}

/**
 * 获取推荐景点（排除当前景点）
 */
async function getRecommendedSpots(currentSpotId, count = 3) {
  const allSpots = await getSpots()
  return allSpots
    .filter(s => s.id !== currentSpotId && s._id !== currentSpotId)
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
}

/**
 * 格式化时间（秒 → mm:ss）
 */
function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * 生成二维码链接
 * 实际项目中使用微信官方API生成带 scene 参数的小程序码
 */
function generateQRUrl(spotId) {
  return `weixin://dl/business/?t=xxx&scene=${spotId}`
}

module.exports = {
  formatTime,
  getSpots,
  getSpotById,
  getRecommendedSpots,
  generateQRUrl
}

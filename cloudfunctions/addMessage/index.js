// 云函数：提交游客留言
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { spotId = null, spotName = '', nickname = '游客', content, rating = 5 } = event

  // 验证
  if (!content || content.trim().length === 0) {
    return { success: false, error: '留言内容不能为空' }
  }
  if (content.trim().length > 500) {
    return { success: false, error: '留言内容不能超过500字' }
  }
  if (nickname && nickname.length > 20) {
    return { success: false, error: '昵称不能超过20字' }
  }

  const safeRating = Math.min(5, Math.max(1, parseInt(rating) || 5))

  try {
    const result = await db.collection('messages').add({
      data: {
        spotId: spotId || '',
        spotName: spotName || '',
        nickname: (nickname || '游客').trim(),
        content: content.trim(),
        rating: safeRating,
        createdAt: db.serverDate()
      }
    })

    return {
      success: true,
      data: {
        _id: result._id,
        spotId,
        spotName,
        nickname: (nickname || '游客').trim(),
        content: content.trim(),
        rating: safeRating
      }
    }
  } catch (err) {
    console.error('[留言] 提交失败:', err)
    return { success: false, error: err.message }
  }
}

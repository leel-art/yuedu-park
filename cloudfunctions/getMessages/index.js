// 云函数：获取留言列表
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { spotId = '', page = 1, pageSize = 20 } = event

  try {
    let query = {}
    if (spotId) {
      query.spotId = spotId
    }

    const countResult = await db.collection('messages').where(query).count()
    const total = countResult.total

    const result = await db.collection('messages')
      .where(query)
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    return {
      success: true,
      data: result.data,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total
    }
  } catch (err) {
    console.error('[留言] 查询失败:', err)
    return { success: false, error: err.message, data: [] }
  }
}

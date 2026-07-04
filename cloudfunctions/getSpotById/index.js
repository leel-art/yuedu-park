// 云函数：获取单个景点完整信息
// 包含所有字段：详情、图集、视频地址、语音地址
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { spotId } = event

  if (!spotId) {
    return { success: false, error: '缺少景点ID', data: null }
  }

  try {
    // 同时按 id 字段和 _id 字段查询
    const _ = db.command
    const result = await db.collection('spots')
      .where(_.or([{ id: spotId }, { _id: spotId }]))
      .get()

    if (result.data.length === 0) {
      return { success: false, error: '景点不存在', data: null }
    }

    return { success: true, data: result.data[0] }
  } catch (err) {
    console.error('[getSpotById] 查询失败:', err)
    return { success: false, error: err.message, data: null }
  }
}

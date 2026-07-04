// 云函数：获取景点列表
// 支持分类筛选、关键词搜索、分页
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const {
    category = '',      // 分类筛选（空字符串 = 全部）
    keyword = '',        // 关键词搜索
    page = 1,            // 页码
    pageSize = 20        // 每页数量
  } = event

  try {
    const _ = db.command
    let query = {}

    // 分类筛选
    if (category && category !== 'all') {
      query.category = category
    }

    // 关键词搜索（支持名称、副标题、描述、地址）
    if (keyword) {
      const regex = db.RegExp({ regexp: keyword, options: 'i' })
      query = _.or([
        { name: regex },
        { subtitle: regex },
        { description: regex },
        { 'location.address': regex }
      ])
    }

    // 获取总数
    const countResult = await db.collection('spots').where(query).count()
    const total = countResult.total

    // 分页查询
    const result = await db.collection('spots')
      .where(query)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .orderBy('sortOrder', 'asc')
      .field({
        // 列表页只返回必要字段，减小数据量
        _id: true,
        id: true,
        name: true,
        subtitle: true,
        category: true,
        coverImage: true,
        videoPoster: true,
        duration: true,
        qrSceneId: true
      })
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
    console.error('[getSpots] 查询失败:', err)
    return { success: false, error: err.message, data: [] }
  }
}

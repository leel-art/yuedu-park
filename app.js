// app.js —— 岳渎公园小程序
App({
  globalData: {
    // 景区信息
    scenicName: '岳渎公园',
    scenicDesc: '国家AAAA级景区，以奇峰怪石、云海日出闻名',
    // 当通过扫码进入时，存储场景值用于跳转
    launchScene: null,
    launchSpotId: null,
    // 当前播放的景点视频
    currentSpot: null,
    // 系统信息
    statusBarHeight: 44,
    windowHeight: 0,
    windowWidth: 0
  },

  onLaunch(options) {
    // =====================================================
    // 🚀 初始化云开发（后端核心）
    // =====================================================
    if (wx.cloud) {
      wx.cloud.init({
        // env 参数说明：
        // - 首次使用留空，微信会自动分配默认环境
        // - 创建环境后，填入你的环境 ID，如 'yuedu-xxx'
        // - 环境 ID 在「微信开发者工具 → 云开发 → 设置」查看
        traceUser: true  // 记录用户访问（可选，用于统计分析）
      })
      console.log('[云开发] 初始化完成')
    } else {
      console.warn('[云开发] 当前基础库版本不支持云开发，请升级至 2.2.3+')
    }

    // =====================================================
    // 核心：处理扫码进入 —— 微信扫描景点二维码后自动弹出视频讲解
    // =====================================================
    const scene = decodeURIComponent(options.query.scene || '')
    const spotId = options.query.spotId || scene

    if (spotId) {
      this.globalData.launchScene = options.scene
      this.globalData.launchSpotId = spotId
      console.log('[扫码进入] 景点ID:', spotId)
      // 标记：从扫码进入，首页加载后需自动跳转
      this.globalData.autoNavigateToVideo = true
    }

    // 获取系统信息
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.statusBarHeight = res.statusBarHeight
        this.globalData.windowHeight = res.windowHeight
        this.globalData.windowWidth = res.windowWidth
      }
    })
  },

  // 全局方法：跳转到景点视频
  navigateToSpotVideo(spotId) {
    wx.navigateTo({
      url: `/pages/video/video?spotId=${spotId}&autoPlay=1`
    })
  }
})

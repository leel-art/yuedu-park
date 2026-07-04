// pages/index/index.js —— 岳渎公园首页
const { getSpots } = require('../../utils/util')
const app = getApp()

Page({
  data: {
    // 状态栏高度（自定义导航栏用）
    statusBarHeight: 44,
    // 所有景点
    spots: [],
    // 景点分类
    categories: [
      { key: 'all', name: '全部景点', icon: '🌄' },
      { key: '观景台', name: '观景台', icon: '🔭' },
      { key: '人文遗迹', name: '人文遗迹', icon: '📜' },
      { key: '建筑', name: '建筑', icon: '🏯' },
      { key: '历史遗迹', name: '历史遗迹', icon: '⚔️' },
      { key: '自然景观', name: '自然景观', icon: '🏔️' }
    ],
    // 当前选中分类
    activeCategory: 'all',
    // 筛选后的景点
    filteredSpots: [],
    // 首次使用扫码提示
    showScanTip: false,
    // 加载状态
    loading: true,
    loadError: false,
    // 天气数据
    weather: null
  },

  async onLoad() {
    // 获取系统信息（状态栏高度）
    const sysInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight + 8
    })

    // 加载景点数据（云端优先）
    await this.loadSpots()

    // 加载天气数据
    this.loadWeather()

    // =====================================================
    // 核心：检测是否从扫码进入
    // =====================================================
    if (app.globalData.autoNavigateToVideo && app.globalData.launchSpotId) {
      const spotId = app.globalData.launchSpotId
      app.globalData.autoNavigateToVideo = false
      app.globalData.launchSpotId = null

      console.log('[首页检测] 扫码进入，跳转到视频页:', spotId)
      setTimeout(() => {
        wx.navigateTo({
          url: `/pages/video/video?spotId=${spotId}&autoPlay=1`
        })
      }, 500)
    }

    // 首次使用：显示扫码提示
    const hasShownTip = wx.getStorageSync('scan_tip_shown')
    if (!hasShownTip) {
      this.setData({ showScanTip: true })
      wx.setStorageSync('scan_tip_shown', true)
    }
  },

  // 从云端加载景点数据
  async loadSpots() {
    this.setData({ loading: true, loadError: false })
    try {
      const spots = await getSpots()
      this.setData({
        spots,
        filteredSpots: spots,
        loading: false
      })
    } catch (err) {
      console.error('[首页] 数据加载失败:', err)
      this.setData({ loading: false, loadError: true })
      wx.showToast({ title: '数据加载失败', icon: 'none' })
    }
  },

  // 从云函数加载天气数据
  async loadWeather() {
    try {
      const res = await wx.cloud.callFunction({ name: 'getWeather', data: {} })
      if (res.result && res.result.success) {
        this.setData({ weather: res.result.data })
        return
      }
    } catch (err) {
      console.warn('[天气] 云函数调用失败，使用降级数据:', err.message)
    }
    // 降级：显示模拟天气
    this.setData({
      weather: {
        weatherIcon: '🌤️', temperature: 28, weatherDesc: '大部晴朗',
        humidity: 55, windSpeed: 12,
        forecast: [
          { date: '今天', icon: '🌤️', tempMax: 30, tempMin: 22 },
          { date: '明天', icon: '⛅', tempMax: 28, tempMin: 20 },
          { date: '后天', icon: '🌧️', tempMax: 25, tempMin: 18 }
        ]
      }
    })
  },

  onShow() {
    // 每次回到首页时刷新数据（可注释掉以减少请求）
    // this.loadSpots()
  },

  // 分类切换（本地筛选，无需重新请求）
  onCategoryChange(e) {
    const key = e.currentTarget.dataset.key
    const { spots } = this.data
    let filtered = spots

    if (key !== 'all') {
      filtered = spots.filter(s => s.category === key)
    }

    const categoryItem = this.data.categories.find(c => c.key === key)

    this.setData({
      activeCategory: key,
      categoryName: categoryItem ? categoryItem.name : '全部',
      filteredSpots: filtered
    })
  },

  // 点击景点卡片 → 跳转到景点讲解页
  onSpotTap(e) {
    const spotId = e.currentTarget.dataset.spotid
    wx.navigateTo({
      url: `/pages/spot/spot?spotId=${spotId}`
    })
  },

  // 关闭扫码提示
  dismissScanTip() {
    this.setData({ showScanTip: false })
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadSpots()
    wx.stopPullDownRefresh()
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '岳渎公园 · 山河交汇，千年潼关',
      path: '/pages/index/index',
      imageUrl: '/images/share_cover.jpg'
    }
  }
})

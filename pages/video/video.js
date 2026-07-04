// pages/video/video.js —— 视频介绍页
// ⭐ 核心页面：扫码后直接到达此页面，自动播放景点视频讲解
const { getSpotById, getRecommendedSpots } = require('../../utils/util')
const app = getApp()

Page({
  data: {
    spot: null,
    spotId: '',
    nextSpot: null,
    // 视频播放状态
    isPlaying: false,
    duration: 0,
    currentTime: 0,
    progress: 0,
    formattedDuration: '00:00',
    // 是否自动播放（扫码进入时为 true）
    autoPlay: false,
    // 是否从扫码进入
    isFromScan: false,
    // 状态栏高度
    statusBarHeight: 44,
    // 加载状态
    loading: true
  },

  async onLoad(options) {
    const spotId = options.spotId || ''
    const autoPlayFlag = options.autoPlay === '1'
    const isFromScan = autoPlayFlag && !options.fromPage

    if (!spotId) {
      wx.showToast({ title: '未指定景点', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    this.setData({ spotId, autoPlay: autoPlayFlag, isFromScan })

    const sysInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight + 8
    })

    // 从云端加载景点数据
    await this.loadSpot(spotId)

    if (isFromScan) {
      wx.showToast({
        title: '已定位到当前景点',
        icon: 'success',
        duration: 2000
      })
    }
  },

  // 从云端加载景点详情和推荐
  async loadSpot(spotId) {
    this.setData({ loading: true })
    try {
      const spot = await getSpotById(spotId)
      if (!spot) {
        wx.showToast({ title: '景点数据不存在', icon: 'none' })
        setTimeout(() => wx.navigateBack(), 1500)
        return
      }

      wx.setNavigationBarTitle({ title: spot.name })

      // 并行获取推荐景点
      const recommended = await getRecommendedSpots(spotId, 1)
      const nextSpot = recommended.length > 0 ? recommended[0] : null

      this.setData({ spot, nextSpot, loading: false })
    } catch (err) {
      console.error('[视频页] 数据加载失败:', err)
      this.setData({ loading: false })
      wx.showToast({ title: '数据加载失败', icon: 'none' })
    }
  },

  onReady() {
    // 页面渲染完成后，创建视频上下文
    if (this.data.autoPlay && this.data.spot) {
      this.videoContext = wx.createVideoContext('spotVideo', this)
      console.log('[视频页] 准备自动播放:', this.data.spot.name)
    }
  },

  onUnload() {
    // 记录观看进度
    if (this.data.currentTime > 0) {
      console.log('[观看记录]', this.data.spotId, '进度:', this.data.currentTime, '秒')
    }
  },

  // ===== 视频事件 =====
  onPlay() {
    this.setData({ isPlaying: true })
  },

  onPause() {
    this.setData({ isPlaying: false })
  },

  onEnded() {
    this.setData({ isPlaying: false, progress: 100 })

    wx.showModal({
      title: '视频播放完毕',
      content: this.data.nextSpot
        ? `接下来去看看「${this.data.nextSpot.name}」吗？`
        : '是否查看该景点的详细文字讲解？',
      confirmText: this.data.nextSpot ? '去下一个' : '查看讲解',
      cancelText: '重新播放',
      success: (res) => {
        if (res.confirm) {
          if (this.data.nextSpot) {
            this.goToSpotVideo()
          } else {
            this.goToSpotDetail()
          }
        } else {
          if (this.videoContext) {
            this.videoContext.seek(0)
            this.videoContext.play()
          }
        }
      }
    })
  },

  onError(e) {
    console.error('[视频] 播放错误:', e.detail)
    wx.showToast({
      title: '视频加载失败，请检查网络',
      icon: 'none',
      duration: 2500
    })
  },

  onTimeUpdate(e) {
    const { currentTime, duration } = e.detail
    const progress = duration > 0 ? Math.round((currentTime / duration) * 100) : 0
    this.setData({
      currentTime: Math.floor(currentTime),
      duration: Math.floor(duration),
      progress,
      formattedDuration: this._formatTime(duration)
    })
  },

  onFullscreenChange(e) {
    console.log('[视频] 全屏状态变化:', e.detail.fullScreen)
  },

  // ===== 导航 =====
  goBack() {
    wx.navigateBack()
  },

  goToSpotDetail() {
    wx.navigateTo({
      url: `/pages/spot/spot?spotId=${this.data.spotId}&fromPage=video`
    })
  },

  goToSpotVideo() {
    if (!this.data.nextSpot) return
    wx.redirectTo({
      url: `/pages/video/video?spotId=${this.data.nextSpot.id}&autoPlay=1&fromPage=video`
    })
  },

  // ===== 分享 =====
  onShareAppMessage() {
    const spot = this.data.spot
    return {
      title: `岳渎公园 · ${spot ? spot.name : ''}视频讲解`,
      path: `/pages/video/video?spotId=${this.data.spotId}`,
      imageUrl: spot ? spot.videoPoster : ''
    }
  },

  // ===== 工具方法 =====
  _formatTime(seconds) {
    if (!seconds || seconds <= 0) return '00:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
})

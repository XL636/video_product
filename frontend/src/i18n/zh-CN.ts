// 中文语言配置 - Anime Video Generator

export const zhCN = {
  // 通用
  common: {
    appTitle: '动漫视频生成器',
    appName: 'AnimeGen Studio',
    loading: '加载中...',
    save: '保存',
    cancel: '取消',
    delete: '删除',
    edit: '编辑',
    search: '搜索',
    filter: '筛选',
    download: '下载',
    upload: '上传',
    settings: '设置',
    logout: '退出登录',
    back: '返回',
    next: '下一步',
    done: '完成',
    error: '错误',
    success: '成功',
    home: '首页',
    none: '无',
    characters: '字符',
  },

  // 导航菜单
  nav: {
    dashboard: '仪表板',
    create: '创建',
    studio: '工作室',
    gallery: '画廊',
    settings: '模型设置',
  },

  // 页面标题
  pages: {
    login: '登录',
    register: '注册',
    dashboard: '仪表板',
    create: '创建',
    studio: '故事工作室',
    gallery: '画廊',
    settings: '模型设置',
  },

  // 表单
  form: {
    email: '邮箱',
    password: '密码',
    confirmPassword: '确认密码',
    username: '用户名',
    prompt: '提示词',
    style: '风格',
    duration: '时长',
    apiKey: 'API 密钥',
    provider: '服务提供商',
    aspectRatio: '画面比例',
    styleStrength: '风格强度',
    stylePreset: '风格预设',
    name: '名称',
    description: '描述',
    referenceImage: '参考图片',
    character: '角色',
    motionDescription: '运动描述',
    sceneDescription: '场景描述',
  },

  // 生成类型
  generation: {
    img2vid: '图片转视频',
    txt2vid: '文字转视频',
    vid2anime: '视频转动漫',
    story: '故事模式',
  },

  // 状态
  status: {
    queued: '队列中',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
    submitted: '已提交',
    draft: '草稿',
  },

  // 视频类型
  videoType: {
    all: '全部',
    img2vid: '图片视频',
    txt2vid: '文字视频',
    vid2anime: '动漫视频',
  },

  // 动漫风格预设
  styles: {
    ghibli: '吉卜力工作室',
    ghibliDesc: '柔和水彩画风格',
    shonen: '少年漫画',
    shonenDesc: '大胆动感的动作风格',
    seinen: '青年漫画',
    seinenDesc: '成熟精细的写实风格',
    cyberpunk: '赛博朋克',
    cyberpunkDesc: '霓虹灯未来美学',
    chibi: 'Q版风格',
    chibiDesc: '可爱的Q版造型',
  },

  // 按钮
  button: {
    createAccount: '创建账号',
    signIn: '登录',
    signOut: '退出登录',
    generate: '生成',
    upload: '上传',
    save: '保存',
    cancel: '取消',
    delete: '删除',
    edit: '编辑',
    preview: '预览',
    download: '下载',
    merge: '合并',
    add: '添加',
    generateVideo: '生成视频',
    generating: '生成中...',
    convertToAnime: '转换为动漫',
    converting: '转换中...',
    enhancePrompt: '用动漫关键词增强',
    addScene: '添加场景',
    addFirstScene: '添加第一个场景',
    addCharacter: '添加角色',
    generateAll: '全部生成',
    mergeExport: '合并导出',
    merging: '合并中...',
    downloadMerged: '下载合并视频',
    startCreating: '开始创作',
    viewAll: '查看全部',
  },

  // 消息
  messages: {
    welcomeBack: '欢迎回来',
    loginSuccess: '登录成功',
    logoutSuccess: '已退出登录',
    generationStarted: '视频生成已开始',
    generationComplete: '视频生成完成',
    deleteConfirm: '确定要删除吗？',
    saveSuccess: '设置已保存',
    invalidCredentials: '邮箱或密码错误',
    uploadImageFirst: '请先上传图片',
    uploadVideoFirst: '请先上传视频',
    enterMotionPrompt: '请输入运动描述',
    enterPrompt: '请输入提示词',
    jobSubmitted: '任务提交成功！',
    jobFailed: '任务提交失败',
    sceneNeedsPrompt: '场景需要提示词',
    sceneGenStarted: '场景生成已开始！',
    sceneGenFailed: '场景生成失败',
    noScenesToGenerate: '没有可生成的场景',
    noCompletedScenes: '没有已完成的场景可合并',
    mergeStarted: '合并已开始',
    mergingScenes: '正在合并 {count} 个场景...',
    saveStoryFirst: '请先保存故事',
    saveStoryDesc: '合并需要已保存的故事。请在故事标签页创建新故事。',
    mergeFailed: '合并启动失败',
    videoDeleted: '视频已删除',
    deleteVideoFailed: '删除视频失败',
    regenQueued: '重新生成已加入队列',
    regenerating: '正在重新生成',
    apiKeySaved: 'API 密钥已保存',
    apiKeySaveFailed: '保存 API 密钥失败',
    apiKeyRemoved: 'API 密钥已移除',
    apiKeyRemoveFailed: '移除 API 密钥失败',
    noApiKey: '未配置 {provider} 的 API 密钥，请先在设置中添加。',
    passwordMismatch: '两次密码不一致',
    passwordTooShort: '密码至少需要6个字符',
    registrationFailed: '注册失败，请重试',
  },

  // 创建页面
  create: {
    img2vidMobile: '图转视频',
    txt2vidMobile: '文转视频',
    vid2animeMobile: '转动漫',
    storyMobile: '故事',
    storyAvailableIn: '故事模式可在',
    studioPage: '工作室',
    fullExperience: '页面获得完整体验。',
  },

  // 工作室页面
  studio: {
    characters: '角色',
    addCharHint: '添加角色以在故事场景中使用。',
    noDescription: '暂无描述',
    sceneTimeline: '场景时间线',
    noScenesYet: '还没有场景',
    addSceneHint: '添加第一个场景开始构建你的故事。',
    scene: '场景',
    describeScene: '描述此场景...',
  },

  // 文件拖放
  fileUpload: {
    dropHere: '将文件拖放到此处',
    dragImage: '将图片拖放到此处',
    dragVideo: '将视频拖放到此处',
    clickToBrowse: '或点击浏览文件',
    uploading: '上传中...',
    imageSelected: '图片已选择',
    videoSelected: '视频已选择',
  },

  // 提示词编辑器
  promptEditor: {
    characters: '字符',
    defaultLabel: '提示词',
    defaultPlaceholder: '详细描述你的动漫场景...',
    motionPlaceholder: '描述图片如何运动... 例如："镜头缓慢向右平移，樱花花瓣轻轻飘落"',
    scenePlaceholder: '详细描述你的动漫视频场景... 例如："黎明时分，一位孤独的武士站在雾气缭绕的山峰上，风吹动他的头发，樱花花瓣在身边飞舞"',
  },

  // 页面顶部栏
  header: {
    profile: '个人资料',
    settings: '模型设置',
    logOut: '退出登录',
  },

  // 视频转动漫
  vid2anime: {
    comfyuiWarning: '需要本地 ComfyUI 实例运行并配置。',
    subtle: '微弱 (0.3)',
    full: '最强 (1.0)',
  },

  // 任务队列
  jobQueue: {
    title: '任务队列',
    noJobs: '暂无任务。提交一个生成任务开始吧。',
  },

  // 设置页面
  settings: {
    apiKeys: 'API 密钥',
    apiKeysDesc: '配置您的提供商 API 密钥以启用视频生成。',
    defaults: '默认设置',
    defaultProvider: '默认提供商',
    defaultStylePreset: '默认风格预设',
    configured: '已配置',
    enterApiKey: '输入 API 密钥...',
    local: '本地',
    klingDesc: '高质量图片和文字转视频生成。',
    jimengDesc: '字节跳动即梦动漫视频生成。',
    viduDesc: 'Vidu 2.0 动漫风格视频生成，原生支持动漫风格。',
    cogvideoDesc: '智谱 CogVideoX-3 视频生成，支持文字/图片转视频。',
    comfyuiDesc: '本地视频转动漫转换流程。',
  },

  // 时长选项
  duration: {
    fiveSeconds: '5 秒',
    eightSeconds: '8 秒',
    tenSeconds: '10 秒',
    twelveSeconds: '12 秒',
    fifteenSeconds: '15 秒',
  },

  // 画面比例
  aspectRatio: {
    landscape: '16:9 横屏',
    portrait: '9:16 竖屏',
    square: '1:1 方形',
  },

  // 积分
  credits: '积分',
}

export default zhCN

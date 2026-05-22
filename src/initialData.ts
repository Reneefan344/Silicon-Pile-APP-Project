import { Posting, ChatThread, SystemLog } from "./types";

export const INITIAL_POSTINGS: Posting[] = [
  {
    id: "post-1",
    title: "NVIDIA B300",
    architecture: "Blackwell Architecture · HGX 8-GPU",
    description: "全新B300大批量现货，配NVLink 5.0高速互连，单机算力性能指标突破极限，可直签原厂维保协议。",
    type: "supply",
    status: "现货",
    qty: "64 台",
    location: "深圳交付",
    vram: "192GB HBM3e",
    network: "NVLink 5.0",
    tags: ["A100 兼容", "全新原包"],
    cpu: "Intel Xeon Platinum 8468",
    memory: "2TB DDR5 REG",
    storage: "7.68TB NVMe SSD x4",
    networkArchitecture: "InfiniBand NDR 400G Dual Port",
    requiresContract: true,
    supportsGuaranty: true,
    attachmentName: "b300_hgx_spec_v2.pdf",
    timestamp: "2026-05-22T02:00:00Z",
    authorName: "亚太智算网络01号节点",
    comments: [
      {
        id: "c1-1",
        authorName: "智能中枢首席运维",
        text: "原厂维保年限是3年还是5年？多签合同能否提供原厂授权信？",
        timestamp: "2026-05-22T02:30:00Z"
      },
      {
        id: "c1-2",
        authorName: "亚太智算网络01号节点",
        text: "回回复：原厂标准提供3年维保，可在商务会话中申请增加至5年；我们是原厂战略合作商，可签原厂维保多签直达协议。",
        timestamp: "2026-05-22T02:45:00Z"
      }
    ]
  },
  {
    id: "post-2",
    title: "NVIDIA H800",
    architecture: "Hopper Architecture · SXM5 8-GPU",
    description: "SXM5高密度集群，已搭载水冷系统。现货交付时间窗口紧凑，保障全额资金托管担保交易。",
    type: "supply",
    status: "期货",
    qty: "128 台",
    location: "香港交割",
    vram: "80GB HBM3",
    network: "NVLink 4.0",
    tags: ["紧缺资源"],
    cpu: "AMD Epyc 9354 32-Core",
    memory: "1.5TB DDR5 RDIMM",
    storage: "3.84TB NVMe SSD x2",
    networkArchitecture: "HDR InfiniBand 200G",
    requiresContract: true,
    supportsGuaranty: true,
    estArrival: "Q3 2024",
    moq: "8 台起订",
    timestamp: "2026-05-22T01:15:00Z",
    authorName: "数海乾坤算力服务商",
    comments: [
      {
        id: "c2-1",
        authorName: "云端大模型研发组",
        text: "支持分批交付吗？第一批需要起订量8台在两周内到香港机房。",
        timestamp: "2026-05-22T01:45:00Z"
      }
    ]
  },
  {
    id: "post-3",
    title: "MELLANOX QM9700",
    architecture: "Quantum-2 NDR InfiniBand Switch",
    description: "64端口NDR 400Gb/s 极度紧缺交换机，全集成，无任何锁限制，配合集群提效必备。",
    type: "supply",
    status: "在途",
    qty: "12 台",
    location: "上海清关中",
    vram: "N/A (Switch Hub)",
    network: "400Gb/s InfiniBand",
    tags: ["全新原包", "原厂维保"],
    cpu: "Mellanox Board Controller",
    memory: "32GB System RAM",
    storage: "128GB Flash",
    networkArchitecture: "64x NDR 400G OSFP Ports",
    requiresContract: false,
    supportsGuaranty: true,
    timestamp: "2026-05-21T23:00:00Z",
    authorName: "高速路由设备组-Vane",
    comments: []
  },
  {
    id: "post-4",
    title: "NVIDIA H100 GPU 集群需求",
    architecture: "Hopper HGX 8-GPU | 256 卡节点",
    description: "急购/租 32个 H100 8-GPU SXM5 节点，配 800G IB互连，部署于上海或周边高密度数据中心机房，需满足PUE <= 1.25，需签中长期算力托管租赁合同。",
    type: "demand",
    status: "现货",
    qty: "32 台",
    location: "部署上海",
    vram: "80GB HBM3",
    network: "InfiniBand 800G",
    tags: ["接受租赁", "极度紧缺"],
    cpu: "Intel Xeon Platinum 8480X",
    memory: "2TB DDR5",
    storage: "7.68TB NVMe x4",
    networkArchitecture: "8x NVIDIA ConnectX-7",
    requiresContract: true,
    supportsGuaranty: true,
    timestamp: "2026-05-22T02:10:00Z",
    authorName: "极客深度学习实验室",
    comments: [
      {
        id: "c4-1",
        authorName: "亚太自营节点A",
        text: "我们在上海临港自建绿电数据中心，PUE平均为1.21，配800G InfiniBand全连接网，有32台现货，已在线下发商务多签流程，请查收沟通会话。",
        timestamp: "2026-05-22T03:00:00Z"
      }
    ]
  },
  {
    id: "post-5",
    title: "NVIDIA A100 80G 需求",
    architecture: "HGX 8-A100-80G GPU集群",
    description: "用于长周期LLM语言物理测试，需要托管至平台机房，带宽延迟至深圳核心网低于2ms，最好有原包及合格证。",
    type: "demand",
    status: "期货",
    qty: "16 台",
    location: "深圳/广州",
    vram: "80GB HBM2e",
    network: "NVLink 3.0",
    tags: ["接受二手"],
    cpu: "AMD Epyc 7763",
    memory: "1TB DDR4",
    storage: "3.84TB NVMe",
    networkArchitecture: "4x 200G ConnectX-6",
    requiresContract: true,
    supportsGuaranty: true,
    timestamp: "2026-05-21T18:45:00Z",
    authorName: "物理模型研究所",
    comments: []
  }
];

export const INITIAL_CHATS: ChatThread[] = [
  {
    id: "kaelen",
    name: "操作员 Kaelen",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCNMDBJVKkftZmm9aoNQBapbCAyw3_tbNB-hFXij9G-zhC0BzC8AZmQoVrzsJWzQ4syqvkqF_kUqedKTFokVfMZjLvF3ID50wxkrAHVexu45JcKf8ObvIEPTnfW7UXRZjctf4NgmEOHwp3zkJ5zwG8qnoAwCIadS48ICn6Q4dWv0g1cvmImzKBU2yC-fNnJiZSAQOcMU5tN918WmetyYGt1LZNm5_d5u-gyjtJ4hyEaeR4wYzfC6FQ2swl_rDcmKVJgUUP7n7rUpUQl",
    avatarAlt: "Operator Kaelen Avatar",
    lastMessage: "坐标已接收。正在启动序列。",
    unreadCount: 3,
    statusText: "大宗配置·分配中",
    messages: [
      {
        id: "msg-k1",
        sender: "operator",
        text: "韩梅梅，请问你在寻找B300集群交付参数吗？我们刚刚更新了在深圳机房的64台物理资源分配代码。",
        timestamp: "23:25"
      },
      {
        id: "msg-k2",
        sender: "user",
        text: "是的，我需要核实物理散热参数以及NVLink版本是否与我们原有的B200完全兼容。",
        timestamp: "23:30"
      },
      {
        id: "msg-k3",
        sender: "operator",
        text: "兼容无误。坐标已接收。正在启动序列。相关B300的物理租赁多签担保准备就绪，你可以随时询问我任何技术与交易条款细节。",
        timestamp: "23:31"
      }
    ]
  },
  {
    id: "vane",
    name: "技术员 Vane",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBh5nFnYOpKmmoccA8VL34Ms_UOdMcYOHotzYOyf3PnRBF4pDExL_hWyge7PQi2wyAoJyE8XMort3JCuPyb3sEM34Zt3SDvnpUoedC_uPTgBrbs0qIpl_QfYIqzobUoRIr44PB1FBl63j3r1_MVDRxD7QpmFDm9GHKzh2tAzdL6zwYVEO5hNeRH37IxsI8VRG_4D6psUm-1b3iYYuR0slK-1ZCe9rZmf-IFwNb3Eg3c-zJGVb2v_ZrD40mRicT4Pj1W6wxaey84OPLQ",
    avatarAlt: "Technician Vane Avatar",
    lastMessage: "歧管已修复。等待放行。",
    unreadCount: 0,
    statusText: "在场运维·离线诊断中",
    messages: [
      {
        id: "msg-v1",
        sender: "operator",
        text: "检测到 7G 扇区高密度板卡冷却歧管有压降波动，触发了安全诊断警报。",
        timestamp: "22:10"
      },
      {
        id: "msg-v2",
        sender: "user",
        text: "需要手动将冷却系统切换到备用主泵吗？",
        timestamp: "22:15"
      },
      {
        id: "msg-v3",
        sender: "operator",
        text: "不需要，阀门已自动隔震并重装。歧管已修复。等待放行。运行参数已彻底回稳。",
        timestamp: "22:18"
      }
    ]
  },
  {
    id: "reyes",
    name: "指挥官 Reyes",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCpOz-WXFYAr1HiI6KR9z75V7dNDa2bIrvxeRK1LkD10OX6ICK5yhunC9WbRYsPGpUFz5_o-t3C8H-6NdRD8ULmzV_wKgjh-s_kDdm86PdRTkarWEFTKCnsIXLyLFAfJR15odZ1XCXKTqSFHBQ-CGzj-EJtfoPJEKOYJxZTUmW_0b8d3HaRmWVjCQ6ZOVMclzRxcY0O7DmYrpZ-xMI2LDOIgzY41BdeTDlFmWyMLJlbu31pUTrLb1BxUbOD3GnzO-FpSJ_FUwXhSUEM",
    avatarAlt: "Commander Reyes Avatar",
    lastMessage: "停止行动。任务取消。",
    unreadCount: 0,
    statusText: "合规安全审查官",
    messages: [
      {
        id: "msg-r1",
        sender: "operator",
        text: "韩梅梅，对于大批量租用H800集群，平台标准多签担保合同必须由授权终端主体在甲乙双方法人代表认证下签署。",
        timestamp: "前天"
      },
      {
        id: "msg-r2",
        sender: "user",
        text: "明白，我们正在配合法务审核关于数据主权隔离的相关条款。",
        timestamp: "前天"
      },
      {
        id: "msg-r3",
        sender: "operator",
        text: "很好。若对方主体存在任何不实证明，安全模块将直接执行物理断开。确保一切处于合规边界内。",
        timestamp: "前天"
      }
    ]
  }
];

export const INITIAL_SYSTEM_LOGS: SystemLog[] = [
  {
    id: "log-1",
    logName: "系统日志.001",
    category: "system",
    title: "严重节点故障",
    description: "检测到 7G 扇区冷却歧管压降。自动隔离程序已被激活并执行冷热流路物理截流。",
    timestamp: "23:41:09.041",
    status: "critical"
  },
  {
    id: "log-2",
    logName: "网络日志.084",
    category: "network",
    title: "路由已更新",
    description: "骨干网数据包流通过备用中继器执行重定向。主备交换延时 +14ms，网络依旧保持全域联接稳态。",
    timestamp: "23:38:12.991",
    status: "success"
  },
  {
    id: "log-3",
    logName: "安全日志.219",
    category: "security",
    title: "尝试未经授权的访问",
    description: "来自一个未验证外部客户端终端 MAC 地址的多次失败握手握柄请求。协议拦截已成功介入，其IP报文已被全面丢弃屏蔽。",
    timestamp: "23:15:00.000",
    status: "critical"
  },
  {
    id: "log-4",
    logName: "系统日志.000",
    category: "system",
    title: "系统周期清除",
    description: "常规硬件诊断扫描完成。水冷压缩机流阻平滑，光纤汇聚接驳平稳，所有冗余计算环境参数回归指标底座。",
    timestamp: "22:00:00.000",
    status: "success"
  }
];

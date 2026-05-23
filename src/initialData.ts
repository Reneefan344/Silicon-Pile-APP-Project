import { Posting, ChatThread, SystemLog } from "./types";

export const INITIAL_POSTINGS: Posting[] = [];

export const INITIAL_CHATS: ChatThread[] = [
  {
    id: "guidui",
    name: "GUIDUI客服",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCNMDBJVKkftZmm9aoNQBapbCAyw3_tbNB-hFXij9G-zhC0BzC8AZmQoVrzsJWzQ4syqvkqF_kUqedKTFokVfMZjLvF3ID50wxkrAHVexu45JcKf8ObvIEPTnfW7UXRZjctf4NgmEOHwp3zkJ5zwG8qnoAwCIadS48ICn6Q4dWv0g1cvmImzKBU2yC-fNnJiZSAQOcMU5tN918WmetyYGt1LZNm5_d5u-gyjtJ4hyEaeR4wYzfC6FQ2swl_rDcmKVJgUUP7n7rUpUQl",
    avatarAlt: "GUIDUI客服 Avatar",
    lastMessage: "你好，我是GUIDUI客服，有什么可以帮你的？",
    unreadCount: 0,
    statusText: "平台客服",
    messages: []
  }
];

export const INITIAL_SYSTEM_LOGS: SystemLog[] = [];

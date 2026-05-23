import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase, supabaseUrl, supabaseAnonKey } from "./supabaseClient";
import { Posting, ChatThread, ChatMessage, SystemLog, TabType, UserProfile, Comment } from "./types";
import { INITIAL_POSTINGS, INITIAL_CHATS, INITIAL_SYSTEM_LOGS } from "./initialData";

interface AppContextProps {
  postings: Posting[];
  chats: ChatThread[];
  systemLogs: SystemLog[];
  bookmarkedIds: string[];
  activeTab: TabType;
  welcomeEntered: boolean;
  activeLobbySubTab: 'supply' | 'demand';
  activePublishSubTab: 'supply' | 'demand';
  activeMessageSubTab: 'system' | 'chat';
  activeChatThreadId: string | null;
  isLoadingChat: boolean;
  userProfile: UserProfile | null;
  registered: boolean;
  isAuthLoading: boolean;
  session: Session | null;

  setWelcomeEntered: (entered: boolean) => void;
  setActiveTab: (tab: TabType) => void;
  setActiveLobbySubTab: (subTab: 'supply' | 'demand') => void;
  setActivePublishSubTab: (subTab: 'supply' | 'demand') => void;
  setActiveMessageSubTab: (subTab: 'system' | 'chat') => void;
  setActiveChatThreadId: (id: string | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setRegistered: (registered: boolean) => void;

  addPosting: (posting: Omit<Posting, 'id' | 'timestamp'>) => Promise<void>;
  addComment: (postId: string, text: string) => Promise<void>;
  toggleBookmark: (id: string) => Promise<void>;
  sendChatMessage: (threadId: string, text: string) => Promise<void>;
  submitInquiry: (posting: Posting, inquiryText: string) => Promise<string>;
  clearUnreads: (threadId: string) => Promise<void>;
  addLogMessage: (log: Omit<SystemLog, 'id' | 'timestamp'>) => Promise<void>;
  login: (phone: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, nickname: string, phone: string, location: string) => Promise<{ error?: string; needEmailConfirm?: boolean }>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

function mapPostingFromDB(row: any): Posting {
  return {
    id: row.id,
    title: row.title,
    architecture: row.architecture || '',
    description: row.description || '',
    type: row.type,
    status: row.status,
    qty: row.qty || '',
    location: row.location || '',
    vram: row.vram || '',
    network: row.network || '',
    tags: row.tags || [],
    cpu: row.cpu || '',
    memory: row.memory || '',
    storage: row.storage || '',
    networkArchitecture: row.network_architecture || '',
    requiresContract: row.requires_contract || false,
    supportsGuaranty: row.supports_guaranty || false,
    attachmentName: row.attachment_name || undefined,
    attachmentData: row.attachment_data || undefined,
    estArrival: row.est_arrival || undefined,
    moq: row.moq || undefined,
    timestamp: row.created_at,
    authorName: row.author_name || '',
    userId: row.user_id || '',
    comments: [],
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [postings, setPostings] = useState<Posting[]>([]);
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  const [welcomeEntered, setWelcomeEnteredState] = useState<boolean>(false);
  const [registered, setRegisteredState] = useState<boolean>(false);

  const [activeTab, setActiveTabState] = useState<TabType>('lobby');
  const [activeLobbySubTab, setActiveLobbySubTab] = useState<'supply' | 'demand'>('supply');
  const [activePublishSubTab, setActivePublishSubTab] = useState<'supply' | 'demand'>('supply');
  const [activeMessageSubTab, setActiveMessageSubTab] = useState<'system' | 'chat'>('system');
  const [activeChatThreadId, setActiveChatThreadId] = useState<string | null>(null);
  const [isLoadingChat, setIsLoadingChat] = useState<boolean>(false);

  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Check for existing session on app start
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setWelcomeEnteredState(true);
        setRegisteredState(true);
      }
      setIsAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setWelcomeEnteredState(true);
        setRegisteredState(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load user profile from Supabase when session changes
  useEffect(() => {
    if (session?.user) {
      loadUserProfile(session.user);
    } else if (!isAuthLoading) {
      setUserProfileState(null);
      setPostings([]);
      setChats([]);
      setSystemLogs([]);
      setBookmarkedIds([]);
      setIsDataLoaded(false);
    }
  }, [session, isAuthLoading]);

  // Load all data when user is authenticated
  useEffect(() => {
    if (session?.user && !isDataLoaded) {
      loadAllData(session.user.id);
    }
  }, [session, isDataLoaded]);

  const loadUserProfile = async (user: User) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error("加载用户资料失败:", error.message);
    }

    if (data) {
      setUserProfileState({
        nickname: data.nickname,
        phone: data.phone || '',
        email: user.email || '',
        location: data.location || '深圳市',
        avatar: data.avatar || undefined,
      });
    }
  };

  const loadAllData = async (userId: string) => {
    try {
      // Load postings (public, everyone sees all)
      const { data: postingsData } = await supabase
        .from('postings')
        .select('*')
        .order('created_at', { ascending: false });

      // Load comments for all postings
      const { data: commentsData } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: true });

      // Load bookmarks
      const { data: bookmarksData } = await supabase
        .from('bookmarks')
        .select('posting_id')
        .eq('user_id', userId);

      // Load chat threads with messages
      const { data: threadsData } = await supabase
        .from('chat_threads')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      const { data: messagesData } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      // Load system logs
      const { data: logsData } = await supabase
        .from('system_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // If no postings exist yet, seed initial data
      let finalPostings: any[] = postingsData || [];
      if (finalPostings.length === 0) {
        await seedInitialPostings(userId);
        const { data: freshPostings } = await supabase
          .from('postings')
          .select('*')
          .order('created_at', { ascending: false });
        finalPostings = freshPostings || [];
      }

      // If no chat threads for this user, seed initial chats
      let finalThreads: any[] = threadsData || [];
      let finalMessages: any[] = messagesData || [];
      if (finalThreads.length === 0) {
        await seedInitialChats(userId);
        const { data: freshThreads } = await supabase
          .from('chat_threads')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });
        const { data: freshMessages } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });
        finalThreads = freshThreads || [];
        finalMessages = freshMessages || [];
      }

      // If no system logs for this user, seed initial logs
      let finalLogs: any[] = logsData || [];
      if (finalLogs.length === 0) {
        await seedInitialLogs(userId);
        const { data: freshLogs } = await supabase
          .from('system_logs')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        finalLogs = freshLogs || [];
      }

      // Map postings with their comments
      const mappedPostings: Posting[] = finalPostings.map((p: any) => {
        const postComments = (commentsData || []).filter((c: any) => c.posting_id === p.id);
        return {
          ...mapPostingFromDB(p),
          comments: postComments.map((c: any) => ({
            id: c.id,
            authorName: c.author_name,
            avatar: c.avatar || undefined,
            text: c.text,
            timestamp: c.created_at,
          })),
        };
      });

      // Map chats
      const mappedChats: ChatThread[] = finalThreads.map((t: any) => {
        const threadMsgs = finalMessages.filter((m: any) => m.thread_id === t.id);
        return {
          id: t.id,
          name: t.name,
          avatar: t.avatar || '',
          avatarAlt: t.avatar_alt || '',
          lastMessage: t.last_message || '',
          unreadCount: t.unread_count || 0,
          statusText: t.status_text || '',
          messages: threadMsgs.map((m: any) => ({
            id: m.id,
            sender: m.sender as 'user' | 'operator',
            text: m.text,
            timestamp: formatTimestamp(m.created_at),
          })),
        };
      });

      // Map logs
      const mappedLogs: SystemLog[] = finalLogs.map((l: any) => ({
        id: l.id,
        logName: l.log_name || '',
        category: l.category as 'system' | 'network' | 'security',
        title: l.title,
        description: l.description || '',
        timestamp: formatLogTimestamp(l.created_at),
        status: l.status as 'critical' | 'alert' | 'success',
      }));

      setPostings(mappedPostings);
      setChats(mappedChats);
      setSystemLogs(mappedLogs);
      setBookmarkedIds((bookmarksData || []).map((b: any) => b.posting_id));
      setIsDataLoaded(true);
    } catch (err) {
      console.error('Error loading data from Supabase:', err);
    }
  };

  const seedInitialPostings = async (userId: string) => {
    const postingsToInsert = INITIAL_POSTINGS.map((p) => ({
      user_id: userId,
      title: p.title,
      architecture: p.architecture,
      description: p.description,
      type: p.type,
      status: p.status,
      qty: p.qty,
      location: p.location,
      vram: p.vram || '',
      network: p.network || '',
      tags: p.tags,
      cpu: p.cpu || '',
      memory: p.memory || '',
      storage: p.storage || '',
      network_architecture: p.networkArchitecture || '',
      requires_contract: p.requiresContract,
      supports_guaranty: p.supportsGuaranty,
      attachment_name: p.attachmentName || null,
      attachment_data: p.attachmentData || null,
      est_arrival: p.estArrival || null,
      moq: p.moq || null,
      author_name: p.authorName || '',
      created_at: p.timestamp,
    }));

    const { error } = await supabase.from('postings').insert(postingsToInsert);
    if (error) console.error('Error seeding postings:', error);

    // Seed comments for initial postings
    for (const p of INITIAL_POSTINGS) {
      if (p.comments && p.comments.length > 0) {
        const commentsToInsert = p.comments.map((c) => ({
          posting_id: p.id,
          user_id: userId,
          author_name: c.authorName,
          avatar: c.avatar || null,
          text: c.text,
          created_at: c.timestamp,
        }));
        await supabase.from('comments').insert(commentsToInsert);
      }
    }
  };

  const seedInitialChats = async (userId: string) => {
    for (const chat of INITIAL_CHATS) {
      await supabase.from('chat_threads').insert({
        id: chat.id,
        user_id: userId,
        name: chat.name,
        avatar: chat.avatar,
        avatar_alt: chat.avatarAlt,
        last_message: chat.lastMessage,
        unread_count: chat.unreadCount,
        status_text: chat.statusText,
      });

      const msgsToInsert = chat.messages.map((m) => ({
        thread_id: chat.id,
        user_id: userId,
        sender: m.sender,
        text: m.text,
      }));
      if (msgsToInsert.length > 0) {
        await supabase.from('chat_messages').insert(msgsToInsert);
      }
    }
  };

  const seedInitialLogs = async (userId: string) => {
    const logsToInsert = INITIAL_SYSTEM_LOGS.map((l) => ({
      user_id: userId,
      log_name: l.logName,
      category: l.category,
      title: l.title,
      description: l.description,
      status: l.status,
    }));
    await supabase.from('system_logs').insert(logsToInsert);
  };

  const formatTimestamp = (ts: string): string => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return ts;
    }
  };

  const formatLogTimestamp = (ts: string): string => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + "." + String(Math.floor(Math.random() * 900) + 100);
    } catch {
      return ts;
    }
  };

  // Auth functions
  const login = async (phone: string, password: string): Promise<{ error?: string }> => {
    // Direct Supabase REST API call — bypasses all JS client internals
    let profileEmail: string | null = null;
    try {
      const queryUrl = `${supabaseUrl}/rest/v1/profiles?select=email&phone=eq.${phone}`;
      const res = await fetch(queryUrl, {
        headers: { 'apikey': supabaseAnonKey, 'Accept': 'application/json' },
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error("Phone lookup HTTP", res.status, errText);
        return { error: `查询异常: ${errText.slice(0, 100)}` };
      }
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0 && rows[0].email) {
        profileEmail = rows[0].email;
      }
    } catch (err: any) {
      console.error("Phone lookup error:", err);
      return { error: "网络异常，请稍后重试" };
    }

    if (!profileEmail) {
      return { error: "该手机号未注册，请先注册账号" };
    }

    const { error } = await supabase.auth.signInWithPassword({ email: profileEmail, password });

    if (error) {
      if (error.message === "Invalid login credentials") {
        return { error: "手机号或密码错误，请重试" };
      }
      if (error.message.toLowerCase().includes("email not confirmed")) {
        return { error: "该账号邮箱尚未验证，请查收注册邮件并点击确认链接后重试" };
      }
      return { error: error.message };
    }

    setWelcomeEnteredState(true);
    setRegisteredState(true);
    setIsDataLoaded(false);
    return {};
  };

  const register = async (
    email: string,
    password: string,
    nickname: string,
    phone: string,
    location: string
  ): Promise<{ error?: string; needEmailConfirm?: boolean }> => {
    // Pre-check: is phone already registered? (direct REST API to avoid session issues)
    try {
      const checkUrl = `${supabaseUrl}/rest/v1/profiles?select=id&phone=eq.${encodeURIComponent(phone)}`;
      const checkRes = await fetch(checkUrl, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
      });
      if (checkRes.ok) {
        const rows = await checkRes.json();
        if (Array.isArray(rows) && rows.length > 0) {
          return { error: "该手机号已被注册，请返回登录页面直接登录" };
        }
      }
    } catch (_) {
      // If pre-check fails, let signUp handle it
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nickname, phone, location, email },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already") || error.message.includes("已")) {
        return { error: `该邮箱 ${email} 已被注册（认证系统记录），请直接登录或更换邮箱` };
      }
      return { error: error.message };
    }

    if (data.user) {
      if (data.session) {
        // Auto-logged in (email confirmation disabled)
        await supabase.from('profiles').upsert({
          id: data.user.id,
          nickname,
          phone,
          email,
          location,
        });
        setWelcomeEnteredState(true);
        setRegisteredState(true);
        setIsDataLoaded(false);
      } else {
        // Email confirmation required — DB trigger handle_new_user() already created the profile.
        return { needEmailConfirm: true };
      }
    }

    return {};
  };

  const logout = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    // Double-clear to ensure no stale session lingers
    setSession(null);
    setUserProfileState(null);
    setRegisteredState(false);
    setWelcomeEnteredState(false);
    setPostings([]);
    setChats([]);
    setSystemLogs([]);
    setBookmarkedIds([]);
    setIsDataLoaded(false);
  };

  const setWelcomeEntered = (val: boolean) => setWelcomeEnteredState(val);
  const setRegistered = (val: boolean) => setRegisteredState(val);

  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    if (tab === 'messages' && activeChatThreadId) {
      clearUnreads(activeChatThreadId);
    }
  };

  const setUserProfile = async (profile: UserProfile | null) => {
    setUserProfileState(profile);
    if (profile && session?.user) {
      const { error } = await supabase.from('profiles').upsert({
        id: session.user.id,
        nickname: profile.nickname,
        phone: profile.phone,
        email: profile.email,
        location: profile.location,
        avatar: profile.avatar || null,
      });
      if (error) {
        console.error("保存用户资料失败:", error.message, error.details);
      }
    }
  };

  const addPosting = async (newPostData: Omit<Posting, 'id' | 'timestamp'>) => {
    if (!session?.user) return;
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();

    const { error } = await supabase.from('postings').insert({
      id: newId,
      user_id: session.user.id,
      title: newPostData.title,
      architecture: newPostData.architecture,
      description: newPostData.description,
      type: newPostData.type,
      status: newPostData.status,
      qty: newPostData.qty,
      location: newPostData.location,
      vram: newPostData.vram || '',
      network: newPostData.network || '',
      tags: newPostData.tags,
      cpu: newPostData.cpu || '',
      memory: newPostData.memory || '',
      storage: newPostData.storage || '',
      network_architecture: newPostData.networkArchitecture || '',
      requires_contract: newPostData.requiresContract,
      supports_guaranty: newPostData.supportsGuaranty,
      attachment_name: newPostData.attachmentName || null,
      attachment_data: newPostData.attachmentData || null,
      est_arrival: newPostData.estArrival || null,
      moq: newPostData.moq || null,
      author_name: newPostData.authorName || userProfile?.nickname || '系统自营算力节点',
      created_at: now,
    });

    if (!error) {
      const newPost: Posting = {
        ...newPostData,
        id: newId,
        timestamp: now,
        authorName: newPostData.authorName || userProfile?.nickname || '系统自营算力节点',
        comments: [],
      };
      setPostings((prev) => [newPost, ...prev]);
    }
  };

  const addComment = async (postId: string, text: string) => {
    if (!text.trim() || !session?.user) return;

    const newId = crypto.randomUUID();
    const now = new Date().toISOString();

    const { error } = await supabase.from('comments').insert({
      id: newId,
      posting_id: postId,
      user_id: session.user.id,
      author_name: userProfile?.nickname || '未名终端用户',
      avatar: userProfile?.avatar || null,
      text: text.trim(),
      created_at: now,
    });

    if (!error) {
      const newComment: Comment = {
        id: newId,
        authorName: userProfile?.nickname || '未名终端用户',
        avatar: userProfile?.avatar || undefined,
        text: text.trim(),
        timestamp: now,
      };
      setPostings((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return { ...post, comments: [...(post.comments || []), newComment] };
          }
          return post;
        })
      );
    }
  };

  const toggleBookmark = async (id: string) => {
    if (!session?.user) return;

    const isBookmarked = bookmarkedIds.includes(id);

    if (isBookmarked) {
      await supabase.from('bookmarks').delete().eq('user_id', session.user.id).eq('posting_id', id);
      setBookmarkedIds((prev) => prev.filter((item) => item !== id));
    } else {
      await supabase.from('bookmarks').insert({ user_id: session.user.id, posting_id: id });
      setBookmarkedIds((prev) => [...prev, id]);
    }
  };

  const clearUnreads = async (threadId: string) => {
    if (!session?.user) return;
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === threadId ? { ...chat, unreadCount: 0 } : chat
      )
    );
    await supabase
      .from('chat_threads')
      .update({ unread_count: 0 })
      .eq('id', threadId)
      .eq('user_id', session.user.id);
  };

  const sendChatMessage = async (threadId: string, text: string) => {
    if (!text.trim() || !session?.user) return;

    const timestamp = new Date().toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit"
    });

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp
    };

    let currentThreadHistory: ChatMessage[] = [];
    setChats((prevChats) => {
      return prevChats.map((chat) => {
        if (chat.id === threadId) {
          currentThreadHistory = [...chat.messages, userMsg];
          return { ...chat, lastMessage: text, messages: currentThreadHistory };
        }
        return chat;
      });
    });

    // Persist user message
    const userMsgId = crypto.randomUUID();
    await supabase.from('chat_messages').insert({
      id: userMsgId,
      thread_id: threadId,
      user_id: session.user.id,
      sender: 'user',
      text,
    });
    await supabase.from('chat_threads').update({ last_message: text }).eq('id', threadId).eq('user_id', session.user.id);

    setIsLoadingChat(true);

    try {
      const historyPayload = currentThreadHistory.slice(-8, -1).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operatorId: threadId, message: text, history: historyPayload })
      });

      const data = await response.json();
      const replyText = data.text || "【重发信号】: 系统通信错误。请重新接驳。";

      const rplMsgId = crypto.randomUUID();
      await supabase.from('chat_messages').insert({
        id: rplMsgId,
        thread_id: threadId,
        user_id: session.user.id,
        sender: 'operator',
        text: replyText,
      });
      await supabase.from('chat_threads').update({ last_message: replyText }).eq('id', threadId).eq('user_id', session.user.id);

      const rplMsg: ChatMessage = {
        id: rplMsgId,
        sender: 'operator',
        text: replyText,
        timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
      };

      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === threadId) {
            return {
              ...chat,
              lastMessage: replyText,
              unreadCount: activeTab === 'messages' && activeChatThreadId === threadId ? 0 : chat.unreadCount + 1,
              messages: [...chat.messages, rplMsg]
            };
          }
          return chat;
        })
      );
    } catch (err) {
      console.error("Error posting chat request:", err);
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'operator',
        text: "【静电噪音】: 无线信道出现极低频电涌遮蔽，暂时无法接驳核心卫星。已自动将请求缓存入主存储器。",
        timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
      };
      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === threadId) {
            return { ...chat, messages: [...chat.messages, errorMsg] };
          }
          return chat;
        })
      );
    } finally {
      setIsLoadingChat(false);
    }
  };

  const submitInquiry = async (posting: Posting, inquiryText: string): Promise<string> => {
    if (!session?.user) return 'kaelen';

    const isSupply = posting.type === 'supply';
    const messageTitle = isSupply ? "【货源询单接洽】" : "【需求应单接洽】";
    const locLabel = isSupply ? "机房位置" : "期望位置";
    const qtyLabel = isSupply ? "货源数量" : "期望数量";
    const noteLabel = isSupply ? "我的商务询盘附言" : "我的供给对接说明";

    const inquiryMessageText = `${messageTitle}
项目名称: ${posting.title}
类别: ${isSupply ? '算力货源 (SUPPLY)' : '算力需求 (DEMAND)'}
${locLabel}: ${posting.location}
规格: ${posting.architecture}
${qtyLabel}: ${posting.qty}
${noteLabel}: "${inquiryText}"`;

    const author = posting.authorName || "系统自营算力仓";
    let targetThreadId = "kaelen";

    const matchedPredefined = chats.find(c =>
      author.toLowerCase().includes(c.id) ||
      c.name.toLowerCase().includes(author.toLowerCase()) ||
      (author.toLowerCase().includes("vane") && c.id === "vane") ||
      (author.toLowerCase().includes("reyes") && c.id === "reyes") ||
      (author.toLowerCase().includes("kaelen") && c.id === "kaelen")
    );

    if (matchedPredefined) {
      targetThreadId = matchedPredefined.id;
      await sendChatMessage(targetThreadId, inquiryMessageText);
    } else {
      const existingDynamic = chats.find(c => c.name === author);
      if (existingDynamic) {
        targetThreadId = existingDynamic.id;
        await sendChatMessage(targetThreadId, inquiryMessageText);
      } else {
        const cleanThreadId = `thread-${encodeURIComponent(author)}`;
        targetThreadId = cleanThreadId;

        const timestamp = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
        const userMsg: ChatMessage = {
          id: `msg-user-${Date.now()}`,
          sender: 'user',
          text: inquiryMessageText,
          timestamp
        };

        // Create thread in Supabase
        await supabase.from('chat_threads').insert({
          id: cleanThreadId,
          user_id: session.user.id,
          name: author,
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpOz-WXFYAr1HiI6KR9z75V7dNDa2bIrvxeRK1LkD10OX6ICK5yhunC9WbRYsPGpUFz5_o-t3C8H-6NdRD8ULmzV_wKgjh-s_kDdm86PdRTkarWEFTKCnsIXLyLFAfJR15odZ1XCXKTqSFHBQ-CGzj-EJtfoPJEKOYJxZTUmW_0b8d3HaRmWVjCQ6ZOVMclzRxcY0O7DmYrpZ-xMI2LDOIgzY41BdeTDlFmWyMLJlbu31pUTrLb1BxUbOD3GnzO-FpSJ_FUwXhSUEM',
          avatar_alt: `${author} Avatar`,
          last_message: inquiryMessageText,
          unread_count: 0,
          status_text: isSupply ? "供应商节点 · 已接驳" : "应单方客户 · 已接驳",
        });
        await supabase.from('chat_messages').insert({
          thread_id: cleanThreadId,
          user_id: session.user.id,
          sender: 'user',
          text: inquiryMessageText,
        });

        const newThread: ChatThread = {
          id: cleanThreadId,
          name: author,
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpOz-WXFYAr1HiI6KR9z75V7dNDa2bIrvxeRK1LkD10OX6ICK5yhunC9WbRYsPGpUFz5_o-t3C8H-6NdRD8ULmzV_wKgjh-s_kDdm86PdRTkarWEFTKCnsIXLyLFAfJR15odZ1XCXKTqSFHBQ-CGzj-EJtfoPJEKOYJxZTUmW_0b8d3HaRmWVjCQ6ZOVMclzRxcY0O7DmYrpZ-xMI2LDOIgzY41BdeTDlFmWyMLJlbu31pUTrLb1BxUbOD3GnzO-FpSJ_FUwXhSUEM',
          avatarAlt: `${author} Avatar`,
          lastMessage: inquiryMessageText,
          unreadCount: 0,
          statusText: isSupply ? "供应商节点 · 已接驳" : "应单方客户 · 已接驳",
          messages: [userMsg]
        };

        setChats(prev => [newThread, ...prev]);

        setIsLoadingChat(true);
        try {
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ operatorId: cleanThreadId, message: inquiryMessageText, history: [] })
          });

          const data = await response.json();
          const replyText = data.text || "【重发信号】: 系统通信错误。请重新接驳。";

          await supabase.from('chat_messages').insert({
            thread_id: cleanThreadId,
            user_id: session.user.id,
            sender: 'operator',
            text: replyText,
          });
          await supabase.from('chat_threads').update({ last_message: replyText }).eq('id', cleanThreadId).eq('user_id', session.user.id);

          const rplMsg: ChatMessage = {
            id: `msg-rpl-${Date.now()}`,
            sender: 'operator',
            text: replyText,
            timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
          };

          setChats((prevChats) =>
            prevChats.map((chat) => {
              if (chat.id === cleanThreadId) {
                return {
                  ...chat,
                  lastMessage: replyText,
                  messages: [...chat.messages, rplMsg]
                };
              }
              return chat;
            })
          );
        } catch (err) {
          console.error("Error securing new chat thread reply:", err);
        } finally {
          setIsLoadingChat(false);
        }
      }
    }

    return targetThreadId;
  };

  const addLogMessage = async (logData: Omit<SystemLog, 'id' | 'timestamp'>) => {
    if (!session?.user) return;

    const newId = crypto.randomUUID();
    const timestamp = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + "." + String(Math.floor(Math.random() * 900) + 100);

    await supabase.from('system_logs').insert({
      id: newId,
      user_id: session.user.id,
      log_name: logData.logName,
      category: logData.category,
      title: logData.title,
      description: logData.description,
      status: logData.status,
    });

    const newLog: SystemLog = { ...logData, id: newId, timestamp };
    setSystemLogs((prev) => [newLog, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        postings,
        chats,
        systemLogs,
        bookmarkedIds,
        activeTab,
        welcomeEntered,
        activeLobbySubTab,
        activePublishSubTab,
        activeMessageSubTab,
        activeChatThreadId,
        isLoadingChat,
        userProfile,
        registered,
        isAuthLoading,
        session,
        setWelcomeEntered,
        setActiveTab,
        setActiveLobbySubTab,
        setActivePublishSubTab,
        setActiveMessageSubTab,
        setActiveChatThreadId,
        setUserProfile,
        setRegistered,
        addPosting,
        addComment,
        toggleBookmark,
        sendChatMessage,
        submitInquiry,
        clearUnreads,
        addLogMessage,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

-- ============================================================
-- 硅堆 (Silicon Pile) - Supabase Database Initialization
-- ============================================================
-- Run this SQL in the Supabase SQL Editor to initialize the database.
-- https://supabase.com/dashboard/project/<your-project>/sql/new
-- ============================================================

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nickname TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  location TEXT DEFAULT '深圳市',
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Postings table
CREATE TABLE IF NOT EXISTS public.postings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  architecture TEXT DEFAULT '',
  description TEXT DEFAULT '',
  type TEXT CHECK (type IN ('supply', 'demand')) NOT NULL,
  status TEXT CHECK (status IN ('现货', '期货', '在途')) DEFAULT '现货',
  qty TEXT DEFAULT '',
  location TEXT DEFAULT '',
  vram TEXT DEFAULT '',
  network TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  cpu TEXT DEFAULT '',
  memory TEXT DEFAULT '',
  storage TEXT DEFAULT '',
  network_architecture TEXT DEFAULT '',
  requires_contract BOOLEAN DEFAULT false,
  supports_guaranty BOOLEAN DEFAULT false,
  pay_to_inspect BOOLEAN DEFAULT false,
  requires_deposit BOOLEAN DEFAULT false,
  attachment_name TEXT,
  attachment_data TEXT,
  attachment_visibility TEXT,
  est_arrival TEXT,
  moq TEXT,
  author_name TEXT DEFAULT '',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  posting_id UUID REFERENCES public.postings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  author_name TEXT NOT NULL,
  avatar TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  posting_id UUID REFERENCES public.postings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, posting_id)
);

-- 5. Chat threads table
CREATE TABLE IF NOT EXISTS public.chat_threads (
  id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT DEFAULT '',
  avatar_alt TEXT DEFAULT '',
  last_message TEXT DEFAULT '',
  unread_count INTEGER DEFAULT 0,
  status_text TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id, user_id)
);

-- 6. Chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender TEXT CHECK (sender IN ('user', 'operator')) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. System logs table
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  log_name TEXT DEFAULT '',
  category TEXT CHECK (category IN ('system', 'network', 'security')) DEFAULT 'system',
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT CHECK (status IN ('critical', 'alert', 'success')) DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- ============================================================
-- 8. Escalations table (human agent ticketing)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.escalations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id TEXT NOT NULL,
  original_thread_id TEXT,
  context TEXT DEFAULT '',
  status TEXT CHECK (status IN ('pending', 'replied', 'closed')) DEFAULT 'pending',
  agent_reply TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.escalations ENABLE ROW LEVEL SECURITY;
-- escalations is accessed via service_role key on server side, so RLS is restrictive for anon users
CREATE POLICY "Users can view own escalations" ON public.escalations
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- RLS Policies
-- ============================================================

-- Profiles: everyone can read, only owner can update
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Postings: everyone can read, only owner can insert/update/delete
ALTER TABLE public.postings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Postings are viewable by everyone" ON public.postings
  FOR SELECT USING (true);
CREATE POLICY "Users can insert own postings" ON public.postings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own postings" ON public.postings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own postings" ON public.postings
  FOR DELETE USING (auth.uid() = user_id);

-- Comments: everyone can read, only owner can insert/delete
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments are viewable by everyone" ON public.comments
  FOR SELECT USING (true);
CREATE POLICY "Users can insert own comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- Bookmarks: only owner can read/write
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookmarks" ON public.bookmarks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bookmarks" ON public.bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookmarks" ON public.bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Chat threads: only owner can read/write
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own chat threads" ON public.chat_threads
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat threads" ON public.chat_threads
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chat threads" ON public.chat_threads
  FOR UPDATE USING (auth.uid() = user_id);

-- Chat messages: only owner can read/write
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own chat messages" ON public.chat_messages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- System logs: only owner can read/write
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own system logs" ON public.system_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own system logs" ON public.system_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Trigger: Auto-create profile on user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, phone, email, location)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'email', new.email),
    COALESCE(new.raw_user_meta_data->>'location', '深圳市')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

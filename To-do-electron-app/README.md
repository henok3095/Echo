# LifeSync - Personal Productivity & Taste Tracker

A modern, cross-platform desktop application built with Electron + React that helps you track tasks, ideas, journal entries, media preferences, and memories with social features.

## ✨ Features

### 🎯 Task & Idea Management
- Create and organize tasks by categories (Life, School, Work, Side Projects)
- Priority levels and due dates
- Convert ideas to actionable tasks
- Status tracking (Not Started, In Progress, Completed)

### 🎬 Media Tracker
- Track movies, series, and albums
- Rating system (1-10 stars)
- Status tracking (To Watch/Listen, Watching/Listening, Watched/Listened)
- Write reviews and add tags

### 📓 Journal
- Daily journal entries with mood tracking
- Markdown support
- Tag system for organization
- Date-based filtering

### 🧠 Memory Bank
- Store personal thoughts, quotes, and life highlights
- Different memory types (thoughts, quotes, highlights, image notes)
- Searchable and taggable

### 📅 Calendar View
- Visual calendar showing all your activities
- Task due dates, journal entries, and media logs
- Interactive date selection

### 👤 Profile & Social
- User profiles with avatars and bios
- Public/private visibility settings
- Social features (coming soon)

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lifesync-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a [Supabase account](https://supabase.com)
   - Create a new project
   - Go to Settings > API to get your URL and anon key

4. **Configure environment variables**
   Create a `.env` file in the project root:
   ```env
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

5. **Set up the database**
   Run the following SQL in your Supabase SQL editor:

   ```sql
   -- Create tables
   CREATE TABLE profiles (
     id UUID REFERENCES auth.users(id) PRIMARY KEY,
     username TEXT UNIQUE,
     bio TEXT,
     avatar_url TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   CREATE TABLE tasks (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     description TEXT,
     category TEXT DEFAULT 'Life',
     priority TEXT DEFAULT 'Medium',
     status TEXT DEFAULT 'Not Started',
     due_date DATE,
     tags TEXT[],
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   CREATE TABLE media_entries (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     type TEXT NOT NULL,
     status TEXT DEFAULT 'to_watch',
     rating INTEGER CHECK (rating >= 0 AND rating <= 10),
     review TEXT,
     tags TEXT[],
     visibility TEXT DEFAULT 'private',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   CREATE TABLE journal_entries (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     content TEXT NOT NULL,
     date DATE NOT NULL,
     mood TEXT DEFAULT 'neutral',
     tags TEXT[],
     visibility TEXT DEFAULT 'private',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   CREATE TABLE memories (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     content TEXT NOT NULL,
     type TEXT DEFAULT 'thought',
     tags TEXT[],
     image_url TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   CREATE TABLE follows (
     follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     PRIMARY KEY (follower_id, following_id)
   );

   -- Enable Row Level Security
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
   ALTER TABLE media_entries ENABLE ROW LEVEL SECURITY;
   ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
   ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
   ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

   -- Create policies
   CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
   CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
   CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

   CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
   CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
   CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

   CREATE POLICY "Users can view own media entries" ON media_entries FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "Users can insert own media entries" ON media_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
   CREATE POLICY "Users can update own media entries" ON media_entries FOR UPDATE USING (auth.uid() = user_id);
   CREATE POLICY "Users can delete own media entries" ON media_entries FOR DELETE USING (auth.uid() = user_id);

   CREATE POLICY "Users can view own journal entries" ON journal_entries FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "Users can insert own journal entries" ON journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
   CREATE POLICY "Users can update own journal entries" ON journal_entries FOR UPDATE USING (auth.uid() = user_id);
   CREATE POLICY "Users can delete own journal entries" ON journal_entries FOR DELETE USING (auth.uid() = user_id);

   CREATE POLICY "Users can view own memories" ON memories FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "Users can insert own memories" ON memories FOR INSERT WITH CHECK (auth.uid() = user_id);
   CREATE POLICY "Users can update own memories" ON memories FOR UPDATE USING (auth.uid() = user_id);
   CREATE POLICY "Users can delete own memories" ON memories FOR DELETE USING (auth.uid() = user_id);

   CREATE POLICY "Users can view follows" ON follows FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);
   CREATE POLICY "Users can insert follows" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
   CREATE POLICY "Users can delete follows" ON follows FOR DELETE USING (auth.uid() = follower_id);

   -- Create storage bucket for avatars
   INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

   CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
   CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
   CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
   CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

6. **Run the application**
   ```bash
   npm run dev
   ```

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production build

### Tech Stack
- **Frontend**: React 19, Vite
- **Desktop**: Electron
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 📱 Features Roadmap

### MVP (Current)
- ✅ User authentication
- ✅ Task management
- ✅ Media tracking
- ✅ Journal entries
- ✅ Memory bank
- ✅ Calendar view
- ✅ User profiles

### Future Features
- 🔄 Social features (follows, activity feed)
- 🔄 API integrations (TMDB, Spotify)
- 🔄 Charts and analytics
- 🔄 Export functionality
- 🔄 Offline support
- 🔄 Mobile app

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions, please open an issue on GitHub. 
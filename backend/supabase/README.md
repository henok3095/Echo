# LifeSync Backend Setup

## Supabase & Database Setup

1. **Create a Supabase Project**
   - Go to https://supabase.com
   - Create a new project and save your credentials

2. **Configure Environment Variables**
   - In your frontend project, create a `.env` file:
     ```env
     VITE_SUPABASE_URL=your_supabase_url_here
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
     ```

3. **Set Up the Database**
   - Open the Supabase dashboard
   - Go to SQL Editor
   - Copy and run the SQL from `backend/supabase/schema.sql`

4. **Configure Authentication**
   - In Supabase dashboard, go to Authentication > Settings
   - Set Site URL to `http://localhost:5173`
   - Enable Email Auth

5. **Create Storage Bucket**
   - The SQL script creates an `avatars` bucket for user images

6. **Done!**
   - Your backend is ready for LifeSync

---

- All backend logic and helpers are in `backend/api/`
- All database schema and policies are in `backend/supabase/`
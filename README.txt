MUHAMMAD ANAS — SUPABASE ARTIST PORTFOLIO
==========================================

WHAT THIS PACKAGE INCLUDES
- Existing purple/neon portfolio layout retained and made configurable.
- Five gallery panels, maximum 15 media items per panel (75 total).
- Online gallery powered by Supabase Database + Storage.
- Admin sign-in using Supabase Auth (no public sign-up form).
- Admin can upload, edit title/description, and delete images/videos.
- Site editor: artist/site name, logo text or logo image URL, favicon URL,
  email, hero copy, about copy, social links, colors and font.
- Responsive layout, lazy-loaded gallery images, and lightweight transitions.
- Video thumbnails are generated when possible. Video is not loaded until
  hover preview or the visitor opens it. Click opens the player.
- Artwork watermark and casual right-click/drag deterrents. These cannot
  prevent screenshots, screen recording, or determined copying.

IMPORTANT SECURITY / OWNERSHIP
- The GitHub repository and Supabase project should be owned by YOU.
- Give the buyer only their website URL and their website admin login.
- Do NOT give buyers your GitHub login, Supabase dashboard login, Secret key,
  service_role key, or repository write access.
- The Publishable key in config.js is designed to be public. RLS policies
  protect database writes and Storage uploads behind authenticated users.
- This setup assumes one trusted admin Auth account per buyer's Supabase
  project. Do not enable public sign-ups or create accounts for untrusted users.
- A buyer with the website admin password can edit gallery and site settings.
  Keep the owner accounts and project credentials private.
- Supabase storage is not unlimited. The upload UI and bucket are configured
  for a maximum of 50 MB per image or video. On Supabase Free, the global file
  size limit is 50 MB and total Storage quota is 1 GB. Check your plan/quota.

FIRST-TIME SETUP (YOUR OWN WEBSITE)
1. Extract this ZIP.
2. Open config.js in a text editor.
3. Replace supabaseUrl with the buyer's Supabase Project URL, for example:
   https://YOUR-PROJECT-REF.supabase.co
   Do not add /rest/v1/ at the end.
4. Replace supabaseAnonKey with the Supabase Publishable key (sb_publishable_...).
   NEVER use the Secret key (sb_secret_...) or service_role key in this file.
5. In Supabase Dashboard > SQL Editor, create a new query, paste all of
   supabase-setup.sql, and run it.
6. In Supabase Dashboard > Authentication > Users, add the buyer/admin email
   and set a strong password. Disable public sign-ups if enabled.
7. In Supabase Dashboard > Authentication > URL Configuration, add the final
   GitHub Pages website URL to Site URL and Redirect URLs.
8. Upload index.html, style.css, script.js, config.js and the other package
   files to the root of a GitHub repository. Enable GitHub Pages from the
   repository's Settings > Pages.
9. Open the published website. Click "Admin Login" and sign in with the admin
   email/password created in Supabase.
10. Use the dashboard to upload artworks and customize the website.

BUYER DELIVERY WORKFLOW
- For every buyer, create a separate GitHub repository and separate Supabase
  project under accounts you control (or an ownership structure you choose).
- Use a separate admin Auth account for that buyer.
- Configure that copy's config.js with that buyer's Supabase Project URL and
  Publishable key.
- Run supabase-setup.sql in that buyer's Supabase project.
- Deploy to GitHub Pages and give the buyer only the website URL and admin
  login credentials.
- For paid additions, you make the code changes in the repository you control.

MEDIA / SPEED GUIDANCE
- Images: WebP is recommended; JPG and PNG are supported.
- Upload size: maximum 50 MB per image or video. Supabase Free also has a
  1 GB total Storage quota, so monitor total usage.
- Videos: MP4 using H.264 is the recommended compatibility choice; WebM is
  also supported. Use short, compressed clips and upload a poster/thumbnail
  when possible. Avoid huge GIF files.
- The gallery uses lazy loading. Video files use preload=none and are only
  fetched for hover preview or when opened.
- Keep image dimensions appropriate for portfolio display (roughly 1600 px
  long edge is usually enough for previews). Export compressed files.
- The site uses external Google Fonts and Supabase CDN; visitors need internet.

ADMIN PANEL
- Click Admin Login in the website header.
- Sign in with the Supabase Auth admin user.
- Gallery tab: choose one of the five panels and upload supported media.
- Website & Theme tab: change the artist name, logo, favicon, email, hero text,
  about text, social links, colors and font, then Save website changes.
- Account tab: sign out. Password changes/reset are managed through Supabase
  Auth; keep account recovery email accessible.

TROUBLESHOOTING
- "Website setup required": config.js still has placeholder URL/key.
- Gallery not loading: run supabase-setup.sql, confirm table policies, bucket
  is public, and check browser console for the error.
- Upload denied: sign in as the Auth user in this Supabase project and confirm
  the storage policies in the SQL file have been applied.
- For GitHub Pages, upload the files at the repository root, not inside an
  extra nested folder.

NEW EDITOR FEATURES: Website & Theme tab includes click-to-edit page text for most visible text nodes, image upload for logo through Supabase Storage, and extra font choices. Save changes after editing.

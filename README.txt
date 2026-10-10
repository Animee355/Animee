ANIMEE WEBSITE

Live website:
https://animee355.github.io/Animee/

Repository:
https://github.com/Animee355/Animee

HOW IT WORKS
- The website is hosted as a static site on GitHub Pages.
- Supabase provides authentication, the posts database, comments, and media storage.
- The owner signs in through the Admin Sign In panel using the authorized Supabase account.
- Only the configured owner account is intended to create, edit, and delete website posts. Database row-level security policies must remain enabled for this protection.
- Images, videos, and audio are uploaded directly from the owner's device to the public Supabase Storage bucket named animee-media.
- The current upload limit is 500 MiB (about 524 MB), matching the configured bucket limit.
- Large uploads use the TUS resumable upload protocol with progress and retry support. Keep the page open until the upload completes.

IMPORTANT SECURITY NOTES
- The animee-media bucket is public so published media can be played on the public website. Anyone who has a media URL may be able to view that media.
- The Supabase publishable key is intended for use in browser code. Do not put a Supabase secret/service-role key or a private access token in this repository.
- Keep the owner account password private and do not share it.
- Owner-only access depends on correct Supabase authentication and Row Level Security policies, not on hiding the Admin button in the page.
- Do not upload media you do not own or have permission to publish.

TROUBLESHOOTING
1. Hard refresh the website with Ctrl+F5.
2. Sign in using the authorized owner account.
3. Choose a photo, video, or audio file and publish it.
4. For large videos, wait for the upload progress to reach 100% and for the post-save message.
5. If an error appears, copy the exact error message for diagnosis.

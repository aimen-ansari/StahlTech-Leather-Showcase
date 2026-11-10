Below is a summary of the technical architecture and the logic behind our implementation:

1. What We Used
We built a modern tech stack focused on high performance and "Artisan Crafted" aesthetics:
Frontend: React.js with Tailwind CSS for the luxury dark theme and Framer Motion for smooth, high-end animations.
Backend-as-a-Service: Supabase for the PostgreSQL database, Authentication (Admin/Public roles), and Storage for product images.
Routing: react-router-dom to manage the seamless transition between the Home, About, Contact, and Admin pages.
Icons: Lucide-React for minimalist, themed iconography across the dashboard and contact sections.

2. Why We Used It
Each choice was made to solve specific technical challenges:
Supabase RLS (Row Level Security): We used this to ensure that only you (the Admin) can add or delete products, while your customers can only view them.
React Context API: We implemented ProductContext to ensure that when you add a product in the Admin Console, it instantly updates the storefront without a page reload.
AbortController: We added this to fix "AbortErrors" caused by React's Strict Mode, ensuring your database connection remains stable during fast navigation.
Local Video: We utilized local video on the About page to showcase your Sialkot craftsmanship without relying on third-party players like YouTube, maintaining a "premium" ad-free look.

3. How We Implemented It
We followed a systematic workflow to move from errors to a live site:
Schema Synchronization: We updated the Supabase database using SQL commands to include color and size columns so they matched your React form fields.
Security Configuration: We verified that your user ID was assigned the admin role in the profiles table to grant you access to the Masterpiece creator.
Image Pipeline: We configured the Admin Dashboard to take a local file, upload it to the Supabase "product-images" bucket, and then save that public URL into the product's database row.
Universal Navigation: We updated the App.jsx and Header.jsx to link the new About, Contact, and Login pages into a single, cohesive user journey.

## Contact Form: Email Notifications + Admin Inbox

The `/contact` form submits to the `send-contact-inquiry` Supabase Edge Function, which:

1. Stores every inquiry in the `contact_inquiries` table (so nothing is lost even if email delivery fails).
2. Emails a notification to the workshop inbox through [Resend](https://resend.com), with the visitor's address set as `Reply-To`.

Stored inquiries also appear in **Admin Console → Inquiries**, where you can search, reply by email, mark read/unread, and delete them.

### Step 1 — Run the database migration

Open **Supabase Dashboard → SQL Editor → New query**, paste the contents of:

```
supabase/migrations/20261110000000_contact_inquiries_inbox.sql
```

Then click **Run**. This adds the `is_read` column and locks the table down so only admins can read, update, or delete inquiries. Anonymous visitors get no direct table access (the Edge Function writes with the service-role key).

### Step 2 — Create a Resend API key

1. Sign up at [resend.com](https://resend.com) using the inbox that should receive notifications.
2. Go to **Domains → Add Domain**, enter your domain, and add the DNS records Resend shows you. Wait for verification.
3. Go to **API Keys → Create API Key** (Sending access is enough) and copy the `re_...` key.

> While testing without a verified domain, Resend's `onboarding@resend.dev` sender only delivers to the email address that owns the Resend account.

### Step 3 — Deploy the Edge Function

Run these from the project root, using the Supabase account that owns the site's project:

```bash
npx supabase login
npx supabase link --project-ref ogiqwnyubonpkqmyzwxj
npx supabase secrets set RESEND_API_KEY=re_your_key_here
npx supabase secrets set CONTACT_NOTIFY_EMAIL=stahltechbiz@gmail.com
npx supabase secrets set "CONTACT_FROM_EMAIL=StahlTech Website <inquiries@your-verified-domain.com>"
npx supabase functions deploy send-contact-inquiry
```

`CONTACT_FROM_EMAIL` must use a domain you verified in Resend (for example `inquiries@stahltechleather.com`). The display name is optional.

### Edge Function secrets

| Secret | Required | Default |
| --- | --- | --- |
| `RESEND_API_KEY` | Yes (for email) | – |
| `CONTACT_NOTIFY_EMAIL` | No | `stahltechbiz@gmail.com` (comma-separate multiple recipients) |
| `CONTACT_FROM_EMAIL` | No | `StahlTech Website <onboarding@resend.dev>` |

If `RESEND_API_KEY` is missing or Resend rejects the message, the Edge Function still returns success because the inquiry was saved, and the admin inbox still shows it. Check the function logs for details:

```bash
npx supabase functions logs send-contact-inquiry
```

### Database

The function writes to `public.contact_inquiries` (`id`, `name`, `email`, `subject`, `message`, `is_read`, `created_at`).

- Public browser access: none.
- Admin access: RLS policies allow authenticated users whose `profiles.role = 'admin'` to `SELECT`, `UPDATE`, and `DELETE`.
- The admin inbox subscribes to Supabase Realtime, so new inquiries appear without a page reload (the migration adds the table to the realtime publication).


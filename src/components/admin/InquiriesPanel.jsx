import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  RefreshCw,
  Reply,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function buildReplyHref(inquiry) {
  const subject = encodeURIComponent(`Re: ${inquiry.subject || 'Your inquiry'}`);
  const body = encodeURIComponent(`Hi ${inquiry.name || ''},\n\n`);
  return `mailto:${inquiry.email}?subject=${subject}&body=${body}`;
}

export default function InquiriesPanel({ onUnreadCountChange }) {
  const [inquiries, setInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [busyId, setBusyId] = useState(null);

  const loadInquiries = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError('');

    try {
      const { data, error: queryError } = await supabase
        .from('contact_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;
      setInquiries(data || []);
    } catch (err) {
      console.error('Failed to load contact inquiries:', err);
      setError(err?.message || 'Could not load inquiries.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  const unreadCount = inquiries.filter((inquiry) => !inquiry.is_read).length;

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [onUnreadCountChange, unreadCount]);

  // Live updates. Requires the `contact_inquiries` table in the Supabase
  // realtime publication (see supabase/migrations).
  useEffect(() => {
    const channel = supabase
      .channel('admin-contact-inquiries')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contact_inquiries' },
        () => loadInquiries({ silent: true }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadInquiries]);

  const markReadState = async (inquiry, isRead) => {
    setBusyId(inquiry.id);
    try {
      const { error: updateError } = await supabase
        .from('contact_inquiries')
        .update({ is_read: isRead })
        .eq('id', inquiry.id);

      if (updateError) throw updateError;

      setInquiries((current) =>
        current.map((item) => (item.id === inquiry.id ? { ...item, is_read: isRead } : item)),
      );
    } catch (err) {
      console.error('Failed to update inquiry:', err);
      toast.error(err?.message || 'Could not update this inquiry.');
    } finally {
      setBusyId(null);
    }
  };

  const removeInquiry = async (inquiry) => {
    const confirmed = window.confirm(
      `Delete the inquiry from ${inquiry.name} <${inquiry.email}>? This cannot be undone.`,
    );
    if (!confirmed) return;

    setBusyId(inquiry.id);
    try {
      const { error: deleteError } = await supabase
        .from('contact_inquiries')
        .delete()
        .eq('id', inquiry.id);

      if (deleteError) throw deleteError;

      setInquiries((current) => current.filter((item) => item.id !== inquiry.id));
      toast.success('Inquiry deleted.');
    } catch (err) {
      console.error('Failed to delete inquiry:', err);
      toast.error(err?.message || 'Could not delete this inquiry.');
    } finally {
      setBusyId(null);
    }
  };

  const filteredInquiries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return inquiries;

    return inquiries.filter((inquiry) =>
      [inquiry.name, inquiry.email, inquiry.subject, inquiry.message].some((value) =>
        (value || '').toLowerCase().includes(term),
      ),
    );
  }, [inquiries, searchTerm]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-serif text-3xl tracking-tight">Inquiry Inbox</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {inquiries.length} total · {unreadCount} unread
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search name, email, message..."
              className="input-luxury w-full pl-10 sm:w-72"
            />
          </div>
          <button
            type="button"
            onClick={() => loadInquiries({ silent: true })}
            disabled={isRefreshing}
            className="btn-luxury flex items-center justify-center gap-2 px-4 py-3 disabled:opacity-70"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-sm border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center border border-border bg-card py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filteredInquiries.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-border bg-card py-20 text-center">
          <Inbox className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="font-serif text-xl">
            {inquiries.length === 0 ? 'No inquiries yet' : 'No matching inquiries'}
          </p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {inquiries.length === 0
              ? 'Messages submitted through the contact form will appear here, and an email notification is sent for each one.'
              : 'Try a different name, email address, subject, or keyword.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInquiries.map((inquiry) => {
            const isUnread = !inquiry.is_read;
            const isBusy = busyId === inquiry.id;

            return (
              <article
                key={inquiry.id}
                className={`rounded-sm border bg-card p-6 transition-colors ${
                  isUnread ? 'border-primary/50' : 'border-border'
                }`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-serif text-xl">{inquiry.name}</h3>
                      {isUnread && (
                        <span className="rounded-sm bg-primary px-2 py-1 text-[10px] uppercase tracking-widest text-primary-foreground">
                          New
                        </span>
                      )}
                    </div>
                    <p className="mt-1 break-words text-sm text-muted-foreground">
                      <a href={`mailto:${inquiry.email}`} className="hover:text-primary">
                        {inquiry.email}
                      </a>
                      {inquiry.subject ? (
                        <>
                          <span className="mx-2">·</span>
                          {inquiry.subject}
                        </>
                      ) : null}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                      {formatDate(inquiry.created_at)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={buildReplyHref(inquiry)}
                      className="rounded-sm border border-border p-2 transition-colors hover:border-primary hover:text-primary"
                      aria-label={`Reply to ${inquiry.name} by email`}
                      title="Reply by email"
                    >
                      <Reply size={16} />
                    </a>
                    <button
                      type="button"
                      onClick={() => markReadState(inquiry, isUnread)}
                      disabled={isBusy}
                      className="rounded-sm border border-border p-2 transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                      aria-label={isUnread ? `Mark inquiry from ${inquiry.name} as read` : `Mark inquiry from ${inquiry.name} as unread`}
                      title={isUnread ? 'Mark as read' : 'Mark as unread'}
                    >
                      {isUnread ? <MailOpen size={16} /> : <Mail size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeInquiry(inquiry)}
                      disabled={isBusy}
                      className="rounded-sm border border-border p-2 transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50"
                      aria-label={`Delete inquiry from ${inquiry.name}`}
                      title="Delete inquiry"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <p className="mt-4 whitespace-pre-wrap border-l-2 border-primary/40 pl-4 text-sm leading-relaxed">
                  {inquiry.message}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

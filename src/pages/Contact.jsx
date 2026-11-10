import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Instagram, Facebook } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const EMPTY_FORM = {
  name: '',
  email: '',
  subject: 'Custom Whip Commission',
  message: '',
  website: '', // Honeypot field: real visitors never fill this in.
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

async function getFunctionErrorMessage(error) {
  const fallback = error?.message || 'Unable to send your inquiry. Please try again.';
  const context = error?.context;

  if (context && typeof context.json === 'function') {
    try {
      const body = await context.clone().json();
      if (body?.error) return body.error;
    } catch {
      // Ignore and use the generic message below.
    }
  }

  return fallback;
}

async function sendInquiry(payload) {
  const { data, error } = await supabase.functions.invoke('send-contact-inquiry', {
    body: payload,
  });

  if (error) {
    throw new Error(await getFunctionErrorMessage(error));
  }

  if (data?.success === false) {
    throw new Error(data.error || 'Unable to send your inquiry. Please try again.');
  }

  return { emailSent: data?.emailSent !== false };
}

export default function Contact() {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!isSupabaseConfigured) {
      toast.error('Messaging is not configured yet. Please email us directly.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await sendInquiry({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject,
        message: formData.message.trim(),
        website: formData.website,
      });

      if (!result.emailSent) {
        console.warn('Inquiry saved, but the email notification was not sent.');
      }

      toast.success('Thanks! Your inquiry has been sent. Our atelier will be in touch shortly.');
      setFormData(EMPTY_FORM);
    } catch (error) {
      toast.error(error.message || 'Unable to send your inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="container mx-auto px-6 py-24 lg:py-32">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-20"
        >
          {/* Left Side: Contact Information */}
          <div className="space-y-12">
            <motion.div variants={itemVariants} className="space-y-4">
              <span className="text-xs uppercase tracking-[0.4em] text-primary font-medium">Get in Touch</span>
              <h1 className="font-serif text-5xl md:text-6xl tracking-tight italic">
                Connect with the <span className="text-primary">Atelier</span>
              </h1>
              <p className="text-muted-foreground max-w-md leading-relaxed">
                Whether you are seeking a custom-balanced bullwhip or have questions about our artisan techniques, our team is here to assist.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-8">
              <div className="flex items-start gap-6 group">
                <div className="p-3 border border-border group-hover:border-primary transition-colors">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Call Our Workshop</p>
                  <p className="text-xl font-serif">+92 333 86 00 603</p>
                </div>
              </div>

              <div className="flex items-start gap-6 group">
                <div className="p-3 border border-border group-hover:border-primary transition-colors">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Electronic Correspondence</p>
                  <p className="text-xl font-serif">stahltechbiz@gmail.com</p>
                </div>
              </div>

              <div className="flex items-start gap-6 group">
                <div className="p-3 border border-border group-hover:border-primary transition-colors">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Global Headquarters</p>
                  <p className="text-xl font-serif italic">Sialkot, Punjab, Pakistan</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="pt-8">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Follow the Craft</p>
              <div className="flex gap-6">
                <Instagram className="w-5 h-5 cursor-pointer hover:text-primary transition-colors" />
                <Facebook className="w-5 h-5 cursor-pointer hover:text-primary transition-colors" />
              </div>
            </motion.div>
          </div>

          {/* Right Side: Inquiry Form */}
          <motion.div
            variants={itemVariants}
            className="bg-card/30 border border-border p-8 md:p-12 rounded-sm shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />

            <h2 className="font-serif text-2xl mb-8">Direct Inquiry</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="contact-name" className="text-[10px] uppercase tracking-widest text-muted-foreground">Full Name</label>
                  <input
                    id="contact-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-luxury w-full"
                    placeholder="John Doe"
                    autoComplete="name"
                    maxLength={120}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="contact-email" className="text-[10px] uppercase tracking-widest text-muted-foreground">Email Address</label>
                  <input
                    id="contact-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-luxury w-full"
                    placeholder="john@example.com"
                    autoComplete="email"
                    maxLength={254}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="contact-subject" className="text-[10px] uppercase tracking-widest text-muted-foreground">Subject</label>
                <select
                  id="contact-subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="input-luxury w-full bg-background"
                >
                  <option>Custom Whip Commission</option>
                  <option>Product Maintenance Inquiry</option>
                  <option>Wholesale/Export Partnership</option>
                  <option>General Support</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="contact-message" className="text-[10px] uppercase tracking-widest text-muted-foreground">Message</label>
                <textarea
                  id="contact-message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  className="input-luxury w-full resize-none"
                  placeholder="How may we assist you today?"
                  maxLength={5000}
                  required
                />
              </div>

              {/* Honeypot: hidden from humans, catches spam bots. */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="contact-website">Website</label>
                <input
                  id="contact-website"
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-luxury w-full py-4 flex items-center justify-center gap-3 group disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                {isSubmitting ? 'Sending...' : 'Send Inquiry'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

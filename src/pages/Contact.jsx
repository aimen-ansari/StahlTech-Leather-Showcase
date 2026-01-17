import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Instagram, Facebook } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.1, delayChildren: 0.3 } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export default function Contact() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Logic for sending inquiry
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
                  <p className="text-xl font-serif">+92 333 86 00 603</p> {/* Placeholder for StahlTech Number */}
                </div>
              </div>

              <div className="flex items-start gap-6 group">
                <div className="p-3 border border-border group-hover:border-primary transition-colors">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Electronic Correspondence</p>
                  <p className="text-xl font-serif">stahltech.biz@gmail.com</p>
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
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Full Name</label>
                  <input type="text" className="input-luxury w-full" placeholder="John Doe" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Email Address</label>
                  <input type="email" className="input-luxury w-full" placeholder="john@example.com" required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Subject</label>
                <select className="input-luxury w-full bg-background">
                  <option>Custom Whip Commission</option>
                  <option>Product Maintenance Inquiry</option>
                  <option>Wholesale/Export Partnership</option>
                  <option>General Support</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Message</label>
                <textarea rows={5} className="input-luxury w-full resize-none" placeholder="How may we assist you today?" required />
              </div>

              <button type="submit" className="btn-luxury w-full py-4 flex items-center justify-center gap-3 group">
                <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                Send Inquiry
              </button>
            </form>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
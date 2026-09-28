import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ruler, Palette, Tag } from 'lucide-react';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const modalVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut", staggerChildren: 0.05 }
  },
  exit: { opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.2 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } }
};

export default function ProductModal({ product, isOpen, onClose }) {
  // Lock background scroll and allow Escape-to-close while the modal is open.
  useEffect(() => {
    if (!isOpen) return;

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!product) return null;
  const displayImage = product.image_url || "/placeholder.svg";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          // items-start + overflow-y-auto on the backdrop makes tall content
          // reachable; `my-auto` on the card still centres it when it fits.
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-background/90 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative my-auto w-full max-w-5xl rounded-sm bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky so the close control stays reachable while the modal scrolls. */}
            <div className="sticky top-0 z-10 flex justify-end h-0 pointer-events-none">
              <button
                onClick={onClose}
                aria-label="Close quick view"
                className="pointer-events-auto translate-y-4 p-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 md:items-stretch">
              <motion.div
                variants={itemVariants}
                className="relative flex items-center justify-center overflow-hidden bg-black
                           aspect-[3/4] max-h-[70dvh] md:aspect-auto md:max-h-none md:h-full"
              >
                <img
                  src={displayImage}
                  alt={product.name}
                  loading="eager"
                  decoding="async"
                  className="block max-h-full max-w-full h-auto w-auto object-contain"
                />
              </motion.div>

              <div className="flex flex-col justify-center p-8 lg:p-12">
                <motion.span variants={itemVariants} className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
                  {product.category}
                </motion.span>

                <motion.h2 variants={itemVariants} className="mt-4 font-serif text-3xl text-foreground lg:text-4xl">
                  {product.name}
                </motion.h2>

                <motion.p variants={itemVariants} className="mt-6 leading-relaxed text-muted-foreground">
                  {product.description || "Handcrafted with the finest materials for a premium feel and durability."}
                </motion.p>

                {/* Updated Specifications for Whips */}
                <motion.div variants={itemVariants} className="mt-8 grid grid-cols-3 gap-4 border-t border-border/50 pt-8">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary">
                      <Ruler className="h-4 w-4" />
                      <span className="text-[10px] uppercase tracking-wider">Size</span>
                    </div>
                    <p className="font-medium text-foreground">{product.size || "Standard"}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary">
                      <Palette className="h-4 w-4" />
                      <span className="text-[10px] uppercase tracking-wider">Color</span>
                    </div>
                    <p className="font-medium text-foreground">{product.color || "Brandy"}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary">
                      <Tag className="h-4 w-4" />
                      <span className="text-[10px] uppercase tracking-wider">Price</span>
                    </div>
                    <p className="font-serif text-2xl text-primary">${Number(product.price)}</p>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="mt-10 flex gap-4">
                  <button className="btn-luxury flex-1 py-4">Enquire via WhatsApp</button>
                  <button className="btn-outline-luxury flex-1 py-4">Wishlist</button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ruler, Palette, Tag } from 'lucide-react';

// ... (variants remain the same as your provided code)

export default function ProductModal({ product, isOpen, onClose }) {
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-5xl overflow-hidden rounded-sm bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="grid md:grid-cols-2">
              <motion.div
                variants={itemVariants}
                className="relative aspect-square md:aspect-auto bg-secondary/5"
              >
                <img src={displayImage} alt={product.name} className="h-full w-full object-cover" />
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
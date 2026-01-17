import { useState } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import HeroCarousel from '@/components/HeroCarousel';
import CategoryBar from '@/components/CategoryBar';
import ProductGrid from '@/components/ProductGrid';
import ProductModal from '@/components/ProductModal';
import Footer from '@/components/Footer';
import { useProducts } from '@/context/ProductContext';
import { Loader2 } from 'lucide-react'; // Added for better UX

export default function Index() {
  const { products, loading } = useProducts(); // Destructure loading
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fix: Case-insensitive filtering to match Admin Console data
  const filteredProducts = activeCategory.toLowerCase() === 'all'
    ? products
    : products.filter(product => 
        product.category?.toLowerCase() === activeCategory.toLowerCase()
      );

  const handleQuickView = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedProduct(null), 300);
  };

  // Show a clean loader while fetching from Supabase
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="font-serif tracking-widest text-muted-foreground uppercase text-xs">
          Loading Collection
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background"
    >
      <Header />
      <HeroCarousel />
      <CategoryBar 
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      
      {/* If the filter results in 0, show a helpful message */}
      {filteredProducts.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-muted-foreground font-serif italic">
            No masterpieces currently available in {activeCategory}.
          </p>
        </div>
      ) : (
        <ProductGrid 
          products={filteredProducts}
          onQuickView={handleQuickView}
        />
      )}

      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
      <Footer />
    </motion.div>
  );
}
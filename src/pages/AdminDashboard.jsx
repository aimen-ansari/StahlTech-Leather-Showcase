import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit, Trash2, X, Save, LogOut, Home, Search, Upload, Loader2, LayoutDashboard, AlertCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/context/ProductContext';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/withTimeout';
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user, isAdmin, logout, loading } = useAuth();
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const navigate = useNavigate();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [submitError, setSubmitError] = useState('');

  // Guards so the Publish button can never spin forever on a slow or stalled
  // connection (supabase-js requests have no built-in timeout).
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
  const UPLOAD_TIMEOUT_MS = 60000;
  const SAVE_TIMEOUT_MS = 30000;

  // Added color and size to initial state
  const [formData, setFormData] = useState({
    name: '', category: 'Bullwhips', size: '', color: '', price: '', description: '', image_url: ''
  });

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (!isAdmin) return <Navigate to="/login" replace />;

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenForm = (product = null) => {
    setImageFile(null);
    setSubmitError('');
    if (product) {
      setEditingProduct(product);
      setFormData({ 
        ...product, 
        price: product.price.toString(),
        color: product.color || '', 
        size: product.size || '' 
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', category: 'Bullwhips', size: '', color: '', price: '', description: '', image_url: '' });
    }
    setIsFormOpen(true);
  };

  const uploadImage = async (file) => {
    try {
      setIsUploading(true);
      const filePath = `${Math.random()}.${file.name.split('.').pop()}`;
      const { error } = await withTimeout(
        supabase.storage.from('product-images').upload(filePath, file),
        UPLOAD_TIMEOUT_MS,
        'The image upload timed out. Check your connection and try again.'
      );
      if (error) throw error;
      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      toast.error("Upload failed: " + error.message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isUploading || isSubmitting) return;
    setSubmitError('');

    try {
      if (imageFile && imageFile.size > MAX_IMAGE_SIZE) {
        const msg = `"${imageFile.name}" is ${(imageFile.size / 1048576).toFixed(1)} MB. Please choose an image under 10 MB.`;
        setSubmitError(msg);
        toast.error(msg);
        return;
      }

      let finalImageUrl = formData.image_url;
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        } else if (!finalImageUrl) {
          // Upload failed and there is no previously saved image: stop here
          // instead of publishing a product with no picture.
          setSubmitError('Image upload failed. Please choose another image and try again.');
          return;
        }
      }

      const productData = {
        ...formData,
        image_url: finalImageUrl,
        price: parseFloat(formData.price) || 0
      };

      setIsSubmitting(true);
      const result = editingProduct
        ? await withTimeout(
            updateProduct(editingProduct.id, productData),
            SAVE_TIMEOUT_MS,
            'Saving took too long. Check your connection and try again.'
          )
        : await withTimeout(
            addProduct(productData),
            SAVE_TIMEOUT_MS,
            'Saving took too long. Check your connection and try again.'
          );

      if (result?.error) {
        setSubmitError("Database Error: " + result.error.message);
        toast.error("Database Error: " + result.error.message);
      } else {
        setIsFormOpen(false);
        // Success toast is already fired by addProduct/updateProduct in ProductContext.
      }
    } catch (err) {
      console.error("Submission failed:", err);
      setSubmitError(err?.message || 'Could not save the product. Please try again.');
      toast.error(err?.message || 'Could not save the product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <LayoutDashboard className="text-primary h-6 w-6" />
            <h1 className="font-serif text-2xl tracking-tight">Admin Console</h1>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/" className="text-sm hover:text-primary transition-colors">View Store</Link>
            <button onClick={logout} className="flex items-center gap-2 text-sm text-destructive hover:bg-destructive/10 px-4 py-2 rounded-sm transition-all">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-card p-6 border border-border rounded-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Total Pieces</p>
            <p className="text-4xl font-serif text-primary">{products.length}</p>
          </div>
          <div className="md:col-span-3 flex items-end justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" placeholder="Search Inventory..." 
                className="input-luxury pl-10 w-full"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => handleOpenForm()} className="btn-luxury flex items-center gap-2">
              <Plus size={20} /> Add Masterpiece
            </button>
          </div>
        </div>

        {/* Product Cards show color/size if available */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <div key={product.id} className="group bg-card border border-border rounded-sm overflow-hidden transition-all hover:border-primary/40 shadow-sm">
              <div className="aspect-[3/4] relative overflow-hidden bg-muted">
                <img src={product.image_url || '/placeholder.svg'} alt={product.name} loading="lazy" decoding="async" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={() => handleOpenForm(product)} className="p-2 bg-background/90 rounded-full hover:text-primary"><Edit size={18} /></button>
                  <button onClick={() => deleteProduct(product.id)} className="p-2 bg-background/90 rounded-full hover:text-destructive"><Trash2 size={18} /></button>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-serif text-xl">{product.name}</h3>
                  <span className="text-primary font-medium tracking-tight">${product.price}</span>
                </div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  {product.category} {product.color ? `• ${product.color}` : ''} {product.size ? `• ${product.size}` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md p-6 overflow-y-auto">
            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="w-full max-w-4xl bg-card border border-border p-10 rounded-sm shadow-2xl my-auto">
              <div className="flex justify-between items-center mb-10">
                <h2 className="font-serif text-3xl">{editingProduct ? 'Update Product' : 'New Collection Item'}</h2>
                <button type="button" onClick={() => { setIsFormOpen(false); setSubmitError(''); }}><X size={24} /></button>
              </div>

              {submitError && (
                <div className="mb-6 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-sm flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">Identification</label>
                    <input required placeholder="Product Name" className="input-luxury w-full" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">Category</label>
                      <select className="input-luxury w-full bg-background" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                        <option>Bullwhips</option>
                        <option>Stockwhips</option>
                        <option>Snake Whips</option>
                        <option>Accessories</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">Price (USD)</label>
                      <input type="number" step="0.01" required className="input-luxury w-full" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                    </div>
                  </div>

                  {/* New Row for Color and Size */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">Primary Color</label>
                      <input placeholder="e.g. Brandy" className="input-luxury w-full" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">Standard Size</label>
                      <input placeholder="e.g. 8ft" className="input-luxury w-full" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">Detailed Narrative</label>
                    <textarea rows={4} className="input-luxury w-full resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground block">Product Visuals</label>
                    <div className="h-64 w-full border border-dashed border-border rounded-sm flex flex-col items-center justify-center relative overflow-hidden bg-muted/30">
                      {imageFile || formData.image_url ? (
                        <img src={imageFile ? URL.createObjectURL(imageFile) : formData.image_url} alt="Product preview" className="absolute inset-0 w-full h-full object-contain" />
                      ) : (
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      )}
                      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setImageFile(e.target.files[0])} />
                    </div>
                  </div>
                  <div className="pt-10 flex gap-4">
                    <button type="button" onClick={() => { setIsFormOpen(false); setSubmitError(''); }} className="flex-1 py-4 border border-border uppercase text-[10px] tracking-widest">Cancel</button>
                    <button type="submit" disabled={isUploading || isSubmitting} className="flex-1 py-4 bg-primary text-primary-foreground uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                      {(isUploading || isSubmitting) ? <Loader2 className="animate-spin h-3 w-3" /> : <Save size={14} />}
                      {isUploading ? 'Uploading Image...' : isSubmitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Publish Item'}
                    </button>
                  </div>
                  {(isUploading || isSubmitting) && (
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground text-center mt-3">
                      {isUploading
                        ? 'Uploading image — this can take up to a minute on slow connections'
                        : 'Saving to the database — please wait'}
                    </p>
                  )}
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
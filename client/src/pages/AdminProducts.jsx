import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import AdminLayout from '../components/AdminLayout';
import Button from '../components/Button';
import Input from '../components/Input';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  compareAtPrice: '',
  discountPercentage: '',
  category: '',
  stock: '',
  sku: '',
  countryOfOrigin: 'Pakistan',
  tags: '',
  images: [''],
  videoUrl: '',
  features: '',
  deliveryMin: '3',
  deliveryMax: '7',
  isFeatured: false,
  isBestSeller: false
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    productService
      .getProductsAdmin({ limit: 50 })
      .then((data) => {
        if (!cancelled) setProducts(data.products);
      })
      .catch(() => {
        if (!cancelled) toast.error('Could not load products.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  useEffect(() => {
    categoryService.getCategoriesAdmin().then((data) => setCategories(data.categories)).catch(() => {});
  }, []);

  const refresh = () => setRefreshToken((t) => t + 1);

  const startCreate = () => {
    setForm({ ...emptyForm, images: [''], category: categories[0]?._id || '' });
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (product) => {
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : '',
      discountPercentage: product.discountPercentage ? String(product.discountPercentage) : '',
      category: product.category?._id || '',
      stock: String(product.stock),
      sku: product.sku || '',
      countryOfOrigin: product.countryOfOrigin || 'Pakistan',
      tags: (product.tags || []).join(', '),
      images: product.images?.length ? product.images.map((img) => img.url) : [''],
      videoUrl: product.videos?.[0]?.url || '',
      features: (product.features || []).join('\n'),
      deliveryMin: String(product.estimatedDeliveryDays?.min ?? 3),
      deliveryMax: String(product.estimatedDeliveryDays?.max ?? 7),
      isFeatured: !!product.isFeatured,
      isBestSeller: !!product.isBestSeller
    });
    setEditingId(product._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.category) {
      toast.error('Please select a category (create one first if none exist)');
      return;
    }

    setSubmitting(true);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      category: form.category,
      stock: parseInt(form.stock, 10) || 0,
      countryOfOrigin: form.countryOfOrigin.trim() || 'Pakistan',
      sku: form.sku.trim() || undefined,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      features: form.features
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean),
      images: form.images
        .map((url) => url.trim())
        .filter(Boolean)
        .map((url) => ({ url, alt: form.name.trim() })),
      videos: form.videoUrl ? [{ url: form.videoUrl.trim() }] : [],
      estimatedDeliveryDays: {
        min: parseInt(form.deliveryMin, 10) || 3,
        max: parseInt(form.deliveryMax, 10) || 7
      },
      isFeatured: form.isFeatured,
      isBestSeller: form.isBestSeller
    };
    if (form.compareAtPrice) payload.compareAtPrice = parseFloat(form.compareAtPrice);
    if (form.discountPercentage) payload.discountPercentage = parseFloat(form.discountPercentage);

    try {
      if (editingId) {
        await productService.updateProduct(editingId, payload);
        toast.success('Product updated');
      } else {
        await productService.createProduct(payload);
        toast.success('Product created');
      }
      setShowForm(false);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product) => {
    if (!confirm(`Remove "${product.name}" from the store?`)) return;
    try {
      await productService.deleteProduct(product._id);
      toast.success('Product removed');
      refresh();
    } catch {
      toast.error('Could not remove product');
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-ink">Manage Products</h1>
        <Button onClick={startCreate}>+ Add product</Button>
      </div>

        {categories.length === 0 && (
          <p className="text-sm text-error mb-4">
            No categories exist yet. Create a category before adding products (Admin → Categories).
          </p>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-sand-dark rounded-sm p-6 mb-8 flex flex-col gap-4"
          >
            <h2 className="font-display text-xl text-ink">{editingId ? 'Edit product' : 'New product'}</h2>

            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-ink/60">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                rows={3}
                className="w-full px-4 py-3 rounded-sm bg-paper border border-sand-dark text-ink focus:border-ink outline-none transition-colors resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-ink/60">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-sm bg-paper border border-sand-dark text-ink focus:border-ink outline-none"
              >
                <option value="" disabled>Select a category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input label="Price (Rs.)" type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              <Input label="Compare-at price (optional)" type="number" step="0.01" min="0" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })} />
              <Input label="Discount % (optional)" type="number" min="0" max="100" value={form.discountPercentage} onChange={(e) => setForm({ ...form, discountPercentage: e.target.value })} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input label="Stock" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
              <Input label="SKU (optional)" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              <Input label="Country of Origin" value={form.countryOfOrigin} onChange={(e) => setForm({ ...form, countryOfOrigin: e.target.value })} />
            </div>

            <Input label="Tags (comma-separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="cookware, non-stick, kitchen" />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-ink/60">Features (one per line)</label>
              <textarea
                value={form.features}
                onChange={(e) => setForm({ ...form, features: e.target.value })}
                rows={3}
                placeholder={'Even heat distribution\nScratch-resistant coating'}
                className="w-full px-4 py-3 rounded-sm bg-paper border border-sand-dark text-ink focus:border-ink outline-none transition-colors resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-ink/60">
                Images (first one is used as the thumbnail)
              </label>
              <div className="flex flex-col gap-2">
                {form.images.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-ink/40 w-5 shrink-0">{idx + 1}.</span>
                    {url && (
                      <img
                        src={url}
                        alt=""
                        className="h-10 w-10 rounded-sm object-cover bg-sand shrink-0"
                        onError={(e) => { e.target.style.visibility = 'hidden'; }}
                      />
                    )}
                    <input
                      type="url"
                      placeholder="https://..."
                      value={url}
                      onChange={(e) => {
                        const next = [...form.images];
                        next[idx] = e.target.value;
                        setForm({ ...form, images: next });
                      }}
                      className="flex-1 px-4 py-2.5 rounded-sm bg-paper border border-sand-dark text-ink focus:border-ink outline-none transition-colors"
                    />
                    {idx > 0 && (
                      <button
                        type="button"
                        title="Move up"
                        onClick={() => {
                          const next = [...form.images];
                          [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                          setForm({ ...form, images: next });
                        }}
                        className="text-ink/40 hover:text-ink px-1"
                      >
                        ↑
                      </button>
                    )}
                    {form.images.length > 1 && (
                      <button
                        type="button"
                        title="Remove"
                        onClick={() => setForm({ ...form, images: form.images.filter((_, i) => i !== idx) })}
                        className="text-error/70 hover:text-error px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, images: [...form.images, ''] })}
                className="self-start text-sm text-gold-dark hover:underline mt-1"
              >
                + Add another image
              </button>
            </div>

            <Input label="Video URL (optional)" type="url" placeholder="https://..." value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />

            <div className="grid grid-cols-2 gap-4">
              <Input label="Est. delivery — min days" type="number" min="0" value={form.deliveryMin} onChange={(e) => setForm({ ...form, deliveryMin: e.target.value })} />
              <Input label="Est. delivery — max days" type="number" min="0" value={form.deliveryMax} onChange={(e) => setForm({ ...form, deliveryMax: e.target.value })} />
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={form.isBestSeller} onChange={(e) => setForm({ ...form, isBestSeller: e.target.checked })} />
                Best Seller
              </label>
            </div>

            <div className="flex gap-3 mt-2">
              <Button type="submit" loading={submitting}>
                {editingId ? 'Save changes' : 'Create product'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-ink/60">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-ink/60">No products yet. Add your first one above.</p>
        ) : (
          <div className="border border-sand-dark rounded-sm divide-y divide-sand-dark bg-white">
            {products.map((product) => (
              <div key={product._id} className="flex items-center gap-4 p-4">
                <div className="h-14 w-14 rounded-sm bg-sand flex-shrink-0 overflow-hidden">
                  {product.images?.[0] && <img src={product.images[0].url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink truncate">{product.name}</p>
                  <p className="text-xs text-ink/50">
                    {product.category?.name || 'Uncategorized'} · Rs. {product.price.toLocaleString()} · {product.stock} in stock
                    {!product.isActive && ' · Hidden'}
                  </p>
                </div>
                <Button variant="ghost" onClick={() => startEdit(product)}>Edit</Button>
                <Button variant="ghost" onClick={() => handleDelete(product)} className="text-error">Remove</Button>
              </div>
            ))}
          </div>
        )}
    </AdminLayout>
  );
}

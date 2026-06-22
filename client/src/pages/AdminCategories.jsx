import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { categoryService } from '../services/categoryService';
import AdminLayout from '../components/AdminLayout';
import Button from '../components/Button';
import Input from '../components/Input';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    categoryService
      .getCategoriesAdmin()
      .then((data) => {
        if (!cancelled) setCategories(data.categories);
      })
      .catch(() => {
        if (!cancelled) toast.error('Could not load categories');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  const refresh = () => setRefreshToken((t) => t + 1);

  const startCreate = () => {
    setName('');
    setDescription('');
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (category) => {
    setName(category.name);
    setDescription(category.description || '');
    setEditingId(category._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await categoryService.updateCategory(editingId, { name: name.trim(), description: description.trim() });
        toast.success('Category updated');
      } else {
        await categoryService.createCategory({ name: name.trim(), description: description.trim() });
        toast.success('Category created');
      }
      setShowForm(false);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category) => {
    if (!confirm(`Remove "${category.name}"?`)) return;
    try {
      await categoryService.deleteCategory(category._id);
      toast.success('Category removed');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove category');
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-ink">Manage Categories</h1>
        <Button onClick={startCreate}>+ Add category</Button>
      </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white border border-sand-dark rounded-sm p-6 mb-8 flex flex-col gap-4">
            <h2 className="font-display text-xl text-ink">{editingId ? 'Edit category' : 'New category'}</h2>
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-ink/60">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-sm bg-paper border border-sand-dark text-ink focus:border-ink outline-none transition-colors resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" loading={submitting}>
                {editingId ? 'Save changes' : 'Create category'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-ink/60">Loading...</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-ink/60">No categories yet. Add your first one above.</p>
        ) : (
          <div className="border border-sand-dark rounded-sm divide-y divide-sand-dark bg-white">
            {categories.map((category) => (
              <div key={category._id} className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink truncate">
                    {category.name}
                    {!category.isActive && <span className="text-xs text-ink/40 ml-2">(hidden)</span>}
                  </p>
                  {category.description && <p className="text-xs text-ink/50 truncate">{category.description}</p>}
                </div>
                <Button variant="ghost" onClick={() => startEdit(category)}>
                  Edit
                </Button>
                <Button variant="ghost" onClick={() => handleDelete(category)} className="text-error">
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
    </AdminLayout>
  );
}

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { useSEO } from '../hooks/useSEO';

export default function Shop() {
  useSEO({ title: 'Shop', description: 'Browse the full Aura Avenue catalog of premium kitchen accessories.' });

  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  const activeCategory = searchParams.get('category') || ''; // category _id
  const activeSearch = searchParams.get('search') || '';
  const activeSort = searchParams.get('sort') || '-createdAt';
  const activePage = parseInt(searchParams.get('page') || '1', 10);

  const requestKey = `${activeCategory}|${activeSearch}|${activeSort}|${activePage}`;
  const [loadedKey, setLoadedKey] = useState(null);
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;

    const params = { page: activePage, limit: 12, sort: activeSort };
    if (activeCategory) params.category = activeCategory;
    if (activeSearch) params.search = activeSearch;

    productService
      .getProducts(params)
      .then((data) => {
        if (cancelled) return;
        setProducts(data.products);
        setPagination(data.pagination);
        setLoadedKey(requestKey);
      })
      .catch(() => {
        if (cancelled) return;
        toast.error('Could not load products. Please try again.');
        setLoadedKey(requestKey);
      });

    return () => {
      cancelled = true;
    };
  }, [activeCategory, activeSearch, activeSort, activePage, requestKey]);

  useEffect(() => {
    categoryService.getCategories().then((data) => setCategories(data.categories)).catch(() => {});
  }, []);

  const updateParams = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    if (!('page' in updates)) next.delete('page');
    setSearchParams(next);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParams({ search: searchInput || null });
  };

  const activeCategoryName = categories.find((c) => c._id === activeCategory)?.name;

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl text-ink mb-1">{activeCategoryName || 'Shop'}</h1>
            <p className="text-sm text-ink/60">
              {pagination ? `${pagination.total} ${pagination.total === 1 ? 'product' : 'products'}` : '\u00A0'}
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products..."
              className="flex-1 sm:w-64 px-4 py-2.5 rounded-sm bg-white border border-sand-dark
                         text-sm text-ink placeholder:text-ink/35 focus:border-ink outline-none transition-colors"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-sm bg-ink text-paper text-sm font-medium hover:bg-gold-dark transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters sidebar */}
          <aside className="md:w-48 flex-shrink-0">
            <h2 className="text-xs font-medium uppercase tracking-wider text-ink/50 mb-3">Category</h2>
            <div className="flex flex-row md:flex-col flex-wrap gap-2">
              <button
                onClick={() => updateParams({ category: null })}
                className={`text-left text-sm px-3 py-1.5 rounded-sm transition-colors ${
                  !activeCategory ? 'bg-ink text-paper' : 'hover:bg-sand text-ink/70'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => updateParams({ category: cat._id })}
                  className={`text-left text-sm px-3 py-1.5 rounded-sm transition-colors ${
                    activeCategory === cat._id ? 'bg-ink text-paper' : 'hover:bg-sand text-ink/70'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <h2 className="text-xs font-medium uppercase tracking-wider text-ink/50 mb-3 mt-6">Sort by</h2>
            <select
              value={activeSort}
              onChange={(e) => updateParams({ sort: e.target.value })}
              className="w-full text-sm px-3 py-2 rounded-sm bg-white border border-sand-dark text-ink outline-none focus:border-ink"
            >
              <option value="-createdAt">Newest</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="-ratingsAverage">Top Rated</option>
            </select>
          </aside>

          {/* Product grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[4/5] bg-sand rounded-sm mb-3" />
                    <div className="h-4 bg-sand rounded-sm w-3/4 mb-2" />
                    <div className="h-3 bg-sand rounded-sm w-1/3" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="font-display text-xl text-ink mb-2">Nothing here yet</p>
                <p className="text-sm text-ink/60">Try a different search or category.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {pagination && pagination.totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-12">
                    {Array.from({ length: pagination.totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => updateParams({ page: String(i + 1) })}
                        className={`h-9 w-9 rounded-sm text-sm transition-colors ${
                          pagination.page === i + 1 ? 'bg-ink text-paper' : 'hover:bg-sand text-ink/70'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

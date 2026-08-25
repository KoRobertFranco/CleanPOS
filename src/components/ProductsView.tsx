import { useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, X, Package } from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatCurrency } from '@/lib/format';
import type { Category, Product } from '@/lib/types';
import { Button, Card } from '@/components/ui';
import { DataGrid, type Column } from '@/components/DataGrid';
import { FilterBar } from '@/components/FilterBar';
import { cn } from '@/lib/utils';

const CATEGORIES: Category[] = ['Snacks', 'Beverages', 'Grocery', 'Household'];
const EMOJIS = ['🥔', '🍫', '🥨', '🍿', '🍪', '🥜', '🥤', '🧃', '💧', '⚡', '🥛', '☕', '🍞', '🥚', '🍚', '🍝', '🫘', '🍌', '🪥', '🧼', '🧻', '🧴', '🗑️', '🔋'];

export function ProductsView() {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search],
  );

  const openNew = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setShowForm(true);
  };

  const columns: Column<Product>[] = [
    {
      key: 'product',
      header: 'Product',
      render: (p) => (
        <div className="flex items-center gap-3">
          <span className="text-2xl">{p.emoji}</span>
          <span className="font-medium text-stone-900">{p.name}</span>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (p) => (
        <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
          {p.category}
        </span>
      ),
    },
    {
      key: 'sku',
      header: 'SKU',
      render: (p) => <span className="text-stone-500">{p.sku}</span>,
    },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      render: (p) => <span className="font-semibold text-stone-900">{formatCurrency(p.price)}</span>,
    },
    {
      key: 'stock',
      header: 'Stock',
      align: 'right',
      render: (p) => (
        <span
          className={cn(
            'text-sm font-medium',
            p.stock === 0 ? 'text-red-500' : p.stock < 15 ? 'text-amber-600' : 'text-stone-600',
          )}
        >
          {p.stock}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (p) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(p); }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-900"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); deleteProduct(p.id); }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-stone-50 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Products</h1>
          <p className="text-sm text-stone-500">{products.length} items in catalog</p>
        </div>
        <Button onClick={openNew}>
          <Plus size={18} /> Add Product
        </Button>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search products..."
      />

      <DataGrid
        columns={columns}
        rows={filtered}
        rowKey={(p) => p.id}
        emptyMessage="No products found"
      />

      {showForm && (
        <ProductForm
          product={editing}
          onClose={() => setShowForm(false)}
          onSave={(product) => {
            if (editing) updateProduct(product);
            else addProduct(product);
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}

function ProductForm({
  product,
  onClose,
  onSave,
}: {
  product: Product | null;
  onClose: () => void;
  onSave: (p: Product) => void;
}) {
  const [name, setName] = useState(product?.name ?? '');
  const [price, setPrice] = useState(product?.price.toString() ?? '');
  const [category, setCategory] = useState<Category>(product?.category ?? 'Snacks');
  const [sku, setSku] = useState(product?.sku ?? '');
  const [stock, setStock] = useState(product?.stock.toString() ?? '');
  const [emoji, setEmoji] = useState(product?.emoji ?? '☕');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock, 10);
    if (!name || isNaN(priceNum) || isNaN(stockNum)) return;

    onSave({
      id: product?.id ?? `p${Date.now()}`,
      name,
      price: priceNum,
      category,
      sku: sku || `${category.slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      stock: stockNum,
      emoji,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-[440px] max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={20} className="text-stone-400" />
            <h3 className="text-lg font-bold text-stone-900">
              {product ? 'Edit Product' : 'New Product'}
            </h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-900">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">Icon</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-xl transition',
                    emoji === e ? 'bg-stone-900 ring-2 ring-stone-900 ring-offset-1' : 'bg-stone-100 hover:bg-stone-200',
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Flat White"
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-stone-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Price (Ks)</label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-stone-400"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Stock</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-stone-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">Category</label>
            <div className="flex gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition',
                    category === c
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">SKU (optional)</label>
            <input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Auto-generated"
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-stone-400"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">{product ? 'Save Changes' : 'Add Product'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

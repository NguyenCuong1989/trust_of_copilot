const quickAdd = [
  'Koi Platinum',
  'Betta Crown Tail',
  'Arowana Juvenile',
  'Filter media',
  'Aquarium salt'
];

const orderItems = [
  { item: 'Koi Platinum', qty: 2, price: '₫350,000', total: '₫700,000' },
  { item: 'Aquarium salt', qty: 1, price: '₫80,000', total: '₫80,000' }
];

export function PosScreenPanel() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-3xl bg-white p-6 shadow-panel ring-1 ring-slate-100">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Register</h2>
            <p className="text-sm text-slate-500">Draft orders against the orders and order_items databases.</p>
          </div>
          <button className="rounded-full bg-cyan-600 px-4 py-2 text-sm font-medium text-white">Hold order</button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {quickAdd.map((product) => (
            <button key={product} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-cyan-300 hover:bg-cyan-50">
              <p className="font-medium text-slate-900">{product}</p>
              <p className="mt-1 text-xs text-slate-500">Tap to add to current order</p>
            </button>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Item</th>
                <th className="px-4 py-3 text-left font-medium">Qty</th>
                <th className="px-4 py-3 text-left font-medium">Price</th>
                <th className="px-4 py-3 text-left font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orderItems.map((line) => (
                <tr key={line.item}>
                  <td className="px-4 py-3 font-medium text-slate-900">{line.item}</td>
                  <td className="px-4 py-3 text-slate-600">{line.qty}</td>
                  <td className="px-4 py-3 text-slate-600">{line.price}</td>
                  <td className="px-4 py-3 text-slate-600">{line.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="rounded-3xl bg-slate-900 p-6 text-white shadow-panel">
        <h3 className="text-lg font-semibold">Checkout summary</h3>
        <div className="mt-5 space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
            <span>Subtotal</span>
            <span>₫780,000</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
            <span>Discount</span>
            <span>₫0</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-cyan-500/20 px-4 py-3 text-base font-semibold">
            <span>Total</span>
            <span>₫780,000</span>
          </div>
        </div>
        <div className="mt-6 grid gap-3">
          <button className="rounded-full bg-cyan-500 px-4 py-3 font-medium text-slate-950">Complete sale</button>
          <button className="rounded-full border border-white/20 px-4 py-3 font-medium text-white">Print receipt</button>
        </div>
      </aside>
    </div>
  );
}

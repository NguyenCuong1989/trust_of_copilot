const metrics = [
  { label: 'Today's revenue', value: '₫18.6M', delta: '+12.4%' },
  { label: 'Active orders', value: '24', delta: '+5' },
  { label: 'Low stock SKUs', value: '7', delta: 'Needs attention' },
  { label: 'Healthy tanks', value: '11/12', delta: '92% stable' }
];

const lowStock = [
  { fish: 'Koi Platinum', stock: '6 pcs', threshold: '10 pcs', status: 'Low' },
  { fish: 'Betta Crown Tail', stock: '14 pcs', threshold: '20 pcs', status: 'Low' },
  { fish: 'Arowana Juvenile', stock: '2 pcs', threshold: '5 pcs', status: 'Reorder' }
];

export function DashboardOverview() {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-3xl bg-white p-5 shadow-panel ring-1 ring-slate-100">
            <p className="text-sm text-slate-500">{metric.label}</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <h2 className="text-3xl font-semibold">{metric.value}</h2>
              <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800">{metric.delta}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <article className="rounded-3xl bg-white p-6 shadow-panel ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Low stock watchlist</h3>
              <p className="text-sm text-slate-500">Products that should be restocked from Notion fish and inventory databases.</p>
            </div>
            <button className="rounded-full bg-cyan-600 px-4 py-2 text-sm font-medium text-white">Sync Notion</button>
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Fish</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Threshold</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStock.map((item) => (
                  <tr key={item.fish}>
                    <td className="px-4 py-3 font-medium text-slate-900">{item.fish}</td>
                    <td className="px-4 py-3 text-slate-600">{item.stock}</td>
                    <td className="px-4 py-3 text-slate-600">{item.threshold}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">{item.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="rounded-3xl bg-gradient-to-br from-cyan-600 to-teal-600 p-6 text-white shadow-panel">
          <p className="text-sm/6 text-cyan-100">Notion-first architecture</p>
          <h3 className="mt-3 text-2xl font-semibold">One UI layer for fish, orders, and tank health</h3>
          <p className="mt-3 text-sm/6 text-cyan-50/90">
            This scaffold is ready to connect to 10 Notion databases via server-side queries and simple CRUD endpoints.
          </p>
          <div className="mt-6 grid gap-3 text-sm">
            {['Dashboard overview', 'Fish CRUD', 'POS register', 'Inventory tank view'].map((item) => (
              <div key={item} className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                {item}
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}

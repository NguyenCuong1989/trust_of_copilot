const fishRows = [
  { name: 'Koi Platinum', species: 'Koi', price: '₫350,000', stock: 6, tank: 'T-02', status: 'Low' },
  { name: 'Betta Crown Tail', species: 'Betta', price: '₫180,000', stock: 14, tank: 'T-05', status: 'Active' },
  { name: 'Arowana Juvenile', species: 'Arowana', price: '₫2,400,000', stock: 2, tank: 'T-08', status: 'Reorder' }
];

export function FishManagementPanel() {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-3xl bg-white p-6 shadow-panel ring-1 ring-slate-100">
        <h2 className="text-lg font-semibold">CRUD workspace</h2>
        <p className="mt-1 text-sm text-slate-500">Create, update, archive, and restore fish records from the Notion fish database.</p>

        <form className="mt-5 grid gap-4">
          {['Fish name', 'Species', 'Sale price', 'Tank', 'Health score'].map((label) => (
            <label key={label} className="grid gap-2 text-sm font-medium text-slate-700">
              {label}
              <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-400 focus:bg-white" placeholder={label} />
            </label>
          ))}
          <div className="flex gap-3 pt-2">
            <button className="rounded-full bg-cyan-600 px-5 py-3 text-sm font-medium text-white">Save fish</button>
            <button className="rounded-full border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700">Archive</button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-panel ring-1 ring-slate-100">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Fish database preview</h3>
            <p className="text-sm text-slate-500">Structured for Notion sync and inventory linkage.</p>
          </div>
          <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">Refresh</button>
        </div>
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Species</th>
                <th className="px-4 py-3 text-left font-medium">Price</th>
                <th className="px-4 py-3 text-left font-medium">Stock</th>
                <th className="px-4 py-3 text-left font-medium">Tank</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fishRows.map((fish) => (
                <tr key={fish.name}>
                  <td className="px-4 py-3 font-medium text-slate-900">{fish.name}</td>
                  <td className="px-4 py-3 text-slate-600">{fish.species}</td>
                  <td className="px-4 py-3 text-slate-600">{fish.price}</td>
                  <td className="px-4 py-3 text-slate-600">{fish.stock}</td>
                  <td className="px-4 py-3 text-slate-600">{fish.tank}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{fish.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

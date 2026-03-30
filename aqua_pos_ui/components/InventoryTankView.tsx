const tanks = [
  { tank: 'T-01', fish: 'Koi Platinum', qty: 6, health: 92, temperature: '26.2°C' },
  { tank: 'T-02', fish: 'Betta Crown Tail', qty: 14, health: 88, temperature: '27.0°C' },
  { tank: 'T-03', fish: 'Arowana Juvenile', qty: 2, health: 76, temperature: '28.1°C' },
  { tank: 'T-04', fish: 'Mixed Fry', qty: 24, health: 94, temperature: '25.8°C' }
];

export function InventoryTankView() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Average health', '87%'],
          ['Low-water alerts', '1'],
          ['Tanks online', '12'],
          ['Reorder items', '7']
        ].map(([label, value]) => (
          <article key={label} className="rounded-3xl bg-white p-5 shadow-panel ring-1 ring-slate-100">
            <p className="text-sm text-slate-500">{label}</p>
            <h2 className="mt-3 text-3xl font-semibold">{value}</h2>
          </article>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {tanks.map((tank) => (
          <article key={tank.tank} className="rounded-3xl bg-white p-6 shadow-panel ring-1 ring-slate-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-cyan-700">{tank.tank}</p>
                <h3 className="mt-1 text-xl font-semibold">{tank.fish}</h3>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">{tank.temperature}</span>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                  <span>Quantity</span>
                  <span>{tank.qty} pcs</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div className="h-3 rounded-full bg-cyan-500" style={{ width: Math.min(tank.qty * 4, 100) + '%' }} />
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                  <span>Health</span>
                  <span>{tank.health}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div className="h-3 rounded-full bg-emerald-500" style={{ width: tank.health + '%' }} />
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

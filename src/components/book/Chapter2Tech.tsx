export function Chapter2Tech() {
  return (
    <section className="book-chapter">
      <div className="book-grid">
        <div className="prose max-w-none">
          <h2>Глава 2: Технология. Сменные аккумуляторы и 24 станции</h2>
          <p>
            Каждая станция рассчитана на 3 порта по 60 кВт. Замена батареи занимает около 5 минут, поэтому
            машина быстро возвращается на линию без длинной зарядной сессии.
          </p>
          <ul>
            <li>Центральный хаб ГПУ выдает энергию в сеть станций.</li>
            <li>24 станции покрывают ключевые точки спроса.</li>
            <li>150 кассет формируют рабочий буфер для пиковых часов.</li>
          </ul>
        </div>
        <div className="book-card">
          <p className="book-label mb-4">Инфографика схемы</p>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
            <p className="font-semibold">Хаб ГПУ</p>
            <p className="my-2 text-center text-xl">↓</p>
            <p className="font-semibold">24 станции замены</p>
            <p className="my-2 text-center text-xl">↓</p>
            <p className="font-semibold">150 сменных кассет</p>
          </div>
        </div>
      </div>
    </section>
  );
}

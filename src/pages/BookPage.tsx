import { Chapter1Market } from '../components/book/Chapter1Market';
import { Chapter2Tech } from '../components/book/Chapter2Tech';
import { Chapter3Economics } from '../components/book/Chapter3Economics';
import { Chapter4Investments } from '../components/book/Chapter4Investments';
import { Chapter5Revenue } from '../components/book/Chapter5Revenue';
import { Chapter6Payback } from '../components/book/Chapter6Payback';
import { Chapter7Conclusion } from '../components/book/Chapter7Conclusion';

export function BookPage() {
  return (
    <main className="book-page px-4 py-6 md:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="book-card mb-6">
          <h1 className="text-3xl font-bold">Живой бизнес-план энергоцентра</h1>
          <p className="mt-2 text-sm">
            Интерактивный инвестиционный меморандум: все ключевые цифры пересчитываются в реальном времени.
          </p>
        </header>
        <Chapter1Market />
        <Chapter2Tech />
        <Chapter3Economics />
        <Chapter4Investments />
        <Chapter5Revenue />
        <Chapter6Payback />
        <Chapter7Conclusion />
      </div>
    </main>
  );
}

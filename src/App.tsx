import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { BookPage } from './pages/BookPage';
import { CalculatorPage } from './pages/CalculatorPage';
import { ComparePage } from './pages/ComparePage';

function App() {
  return (
    <>
      <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-2 p-3 text-sm font-semibold">
          <NavLink to="/book" className={({ isActive }) => `rounded-lg px-3 py-2 ${isActive ? 'bg-indigo-100 text-indigo-800' : 'text-slate-700 hover:bg-slate-100'}`}>
            Книга
          </NavLink>
          <NavLink to="/calculator" className={({ isActive }) => `rounded-lg px-3 py-2 ${isActive ? 'bg-indigo-100 text-indigo-800' : 'text-slate-700 hover:bg-slate-100'}`}>
            Калькулятор
          </NavLink>
          <NavLink to="/compare" className={({ isActive }) => `rounded-lg px-3 py-2 ${isActive ? 'bg-indigo-100 text-indigo-800' : 'text-slate-700 hover:bg-slate-100'}`}>
            Сравнение
          </NavLink>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Navigate to="/book" replace />} />
        <Route path="/book" element={<BookPage />} />
        <Route path="/calculator" element={<CalculatorPage />} />
        <Route path="/compare" element={<ComparePage />} />
      </Routes>
    </>
  );
}

export default App;

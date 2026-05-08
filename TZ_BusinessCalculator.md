# ТЗ: Веб-сервис «Бизнес-калькулятор энергоцентра»

## 1. Цель
Создать SPA-приложение для расчета себестоимости, выручки, прибыли, окупаемости, инвест-резюме и графика накопленной прибыли для двух сценариев:
- зарядка такси (B2C);
- питание бизнеса (B2B).

## 2. Технологии
- React (функциональные компоненты, хуки);
- TypeScript (строгая типизация);
- Tailwind CSS;
- Recharts;
- Vite.

## 3. Структура данных
```ts
interface Inputs {
  gasPrice: number;
  capex: number;
  priceToClient: number;
  carsPerDay: number;
  kwhPerCar: number;
  electricityLoss: number;
  priceToBusiness: number;
  dailyKwhPerBusiness: number;
  businessesCount: number;
  gasConsumptionPerKwh: number;
  servicePercent: number;
  amortizationKwh: number;
}
```

## 4. Логика расчетов
### Себестоимость
```ts
const gasCost = gasPrice * gasConsumptionPerKwh;
const fullCost = gasCost * (1 + servicePercent / 100) + amortizationKwh;
```

### B2C / B2B
- `dailyKwh` зависит от сценария;
- `dailyRevenue = dailyKwh * price`;
- `monthlyRevenue = dailyRevenue * 30`;
- `monthlyProfit = (price - fullCost) * dailyKwh * 30`;
- `paybackMonths = capex / (monthlyProfit / 1e6)`.

## 5. UI
- Левая панель: ввод параметров, переключатель сценария, reset.
- Правая панель: прибыль, себестоимость, маржа, окупаемость, инвест-резюме, график.

## 6. Требования
- Реактивный пересчет без кнопки.
- Валидация: числа >= 0.
- Корректное переключение сценариев.

## 7. Тестовые кейсы
- Такси: газ 8.45, CAPEX 187.7, цена 14, 400 машин -> прибыль ~5.2 млн, окупаемость ~36 мес.
- Такси: газ 10.0, CAPEX 187.7, цена 14, 400 машин -> прибыль ~4.9 млн, окупаемость ~38 мес.
- Бизнес: газ 8.45, CAPEX 72, цена 7, 100 клиентов -> прибыль ~1.5 млн, окупаемость ~48 мес.

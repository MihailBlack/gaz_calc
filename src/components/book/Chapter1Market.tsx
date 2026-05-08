import { useMemo } from 'react';
import { buildInputsForScenario, calculateScenario } from '../../calculations';
import { useBusinessPlanStore } from '../../store/useBusinessPlanStore';

export function Chapter1Market() {
  const tariffNetwork = useBusinessPlanStore((s) => s.tariffNetwork);
  const setTariffNetwork = useBusinessPlanStore((s) => s.setTariffNetwork);
  const inputs = useBusinessPlanStore((s) => s.calculatorInputs);
  const quantity = useBusinessPlanStore((s) => s.quantity);

  const taxiInputs = useMemo(() => buildInputsForScenario(inputs, 'taxi', quantity), [inputs, quantity]);
  const results = useMemo(
    () => calculateScenario({ ...taxiInputs, priceToClient: tariffNetwork }, 'taxi'),
    [taxiInputs, tariffNetwork],
  );

  return (
    <section className="book-chapter">
      <div className="book-grid">
        <div className="prose max-w-none">
          <h2>Глава 1: Рынок. Почему такси и 14 руб?</h2>
          <p>
            В Нижнем Новгороде около 420 электротакси, а тариф на коммерческих зарядках достигает 16 руб/кВт·ч.
            Наше предложение 14 руб/кВт·ч дает паркам ощутимую экономию и удерживает высокий спрос.
          </p>
          <ul>
            <li>Позиционирование: дешевле рынка, но с сохранением хорошей маржи.</li>
            <li>Быстрый оборот станции повышает загрузку инфраструктуры.</li>
            <li>Низкая цена входа для клиента ускоряет подключение таксопарков.</li>
          </ul>
        </div>
        <div className="book-card">
          <label className="book-label">Тариф сети для такси (руб/кВт·ч): {tariffNetwork.toFixed(0)}</label>
          <input type="range" min={10} max={20} step={1} value={tariffNetwork} onChange={(e) => setTariffNetwork(Number(e.target.value))} className="w-full" />
          <p className="mt-4 text-sm">
            При снижении тарифа до <strong>{tariffNetwork.toFixed(0)}</strong> ваша маржа сокращается до{' '}
            <strong>{results.marginPerKwh.toFixed(2)} руб/кВт·ч</strong>.
          </p>
        </div>
      </div>
    </section>
  );
}

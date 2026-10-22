import { RowDataPacket } from 'mysql2';
import { pool } from '../config/db';

export interface DiscountResult {
  ruleId: number | null;
  name: string | null;
  amount: number;
}

export async function findBestDiscount(subtotal: number): Promise<DiscountResult> {
  const [rules] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, min_purchase, discount_type, discount_value, max_discount
     FROM discount_rules
     WHERE is_active = 1
       AND min_purchase <= ?
       AND (start_date IS NULL OR start_date <= CURDATE())
       AND (end_date IS NULL OR end_date >= CURDATE())`,
    [subtotal]
  );

  let best: DiscountResult = { ruleId: null, name: null, amount: 0 };

  for (const rule of rules) {
    let amount =
      rule.discount_type === 'percent'
        ? (subtotal * rule.discount_value) / 100
        : rule.discount_value;

    if (rule.discount_type === 'percent' && rule.max_discount !== null) {
      amount = Math.min(amount, rule.max_discount);
    }
    amount = Math.floor(Math.min(amount, subtotal));

    if (amount > best.amount) {
      best = { ruleId: rule.id, name: rule.name, amount };
    }
  }

  return best;
}
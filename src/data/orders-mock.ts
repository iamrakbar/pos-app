export type OrderStatus = 'completed' | 'pending' | 'cancelled';

export type OrderItem = {
    name: string;
    qty: number;
    price: number;
};

export type MockOrder = {
    id: string;
    transaction_id: string;
    order_type: 'dine-in' | 'takeaway';
    table: string | null;
    payment_method: string;
    status: OrderStatus;
    items: OrderItem[];
    subtotal: number;
    total: number;
    customer_type: 'merchant' | 'registered';
    customer_name: string | null;
    notes: string | null;
    created_at: string; // ISO string
};

function order(
    id: string,
    status: OrderStatus,
    order_type: 'dine-in' | 'takeaway',
    table: string | null,
    payment_method: string,
    items: OrderItem[],
    customer_name: string | null,
    created_at: string,
    notes: string | null = null,
): MockOrder {
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const feeRate = payment_method === 'QRIS' ? 0.007 : payment_method === 'GoPay' || payment_method === 'OVO' ? 0.015 : 0;
    return {
        id,
        transaction_id: `TR-${id}`,
        order_type,
        table,
        payment_method,
        status,
        items,
        subtotal,
        total: Math.round(subtotal * (1 + feeRate)),
        customer_type: customer_name ? 'registered' : 'merchant',
        customer_name,
        notes,
        created_at,
    };
}

export const MOCK_ORDERS: MockOrder[] = [
    order('1001', 'completed', 'dine-in', 'Meja 1', 'QRIS',
        [{ name: 'Eggplant Parmesan', qty: 1, price: 100000 }, { name: 'Caesar Salad', qty: 2, price: 65000 }],
        null, '2026-06-30T08:15:00'),
    order('1002', 'completed', 'takeaway', null, 'Cash',
        [{ name: 'Truffle Risotto', qty: 1, price: 180000 }, { name: 'Garlic Bread', qty: 1, price: 35000 }],
        'Budi Santoso', '2026-06-30T08:42:00'),
    order('1003', 'pending', 'dine-in', 'Meja 3', 'GoPay',
        [{ name: 'Beef Wellington', qty: 2, price: 220000 }, { name: 'Soup of the Day', qty: 2, price: 55000 }],
        null, '2026-06-30T09:05:00'),
    order('1004', 'completed', 'dine-in', 'VIP 1', 'OVO',
        [{ name: 'Grilled Salmon', qty: 3, price: 195000 }, { name: 'Caesar Salad', qty: 1, price: 65000 }, { name: 'Tiramisu', qty: 2, price: 75000 }],
        'Siti Rahayu', '2026-06-30T09:30:00'),
    order('1005', 'cancelled', 'takeaway', null, 'QRIS',
        [{ name: 'Mushroom Soup', qty: 1, price: 55000 }],
        null, '2026-06-30T09:48:00', 'Customer changed mind'),
    order('1006', 'completed', 'dine-in', 'Meja 4', 'Cash',
        [{ name: 'Lamb Chops', qty: 2, price: 210000 }, { name: 'Garlic Bread', qty: 2, price: 35000 }],
        null, '2026-06-30T10:15:00'),
    order('1007', 'pending', 'dine-in', 'Meja 2', 'QRIS',
        [{ name: 'Eggplant Parmesan', qty: 1, price: 100000 }, { name: 'Mushroom Soup', qty: 1, price: 55000 }],
        null, '2026-06-30T10:40:00'),
    order('1008', 'completed', 'takeaway', null, 'GoPay',
        [{ name: 'Beef Wellington', qty: 1, price: 220000 }],
        'Ahmad Fauzi', '2026-06-30T11:02:00'),
    order('1009', 'completed', 'dine-in', 'Meja 5', 'Cash',
        [{ name: 'Grilled Salmon', qty: 1, price: 195000 }, { name: 'Caesar Salad', qty: 1, price: 65000 }],
        null, '2026-06-30T11:25:00'),
    order('1010', 'cancelled', 'dine-in', 'Meja 1', 'QRIS',
        [{ name: 'Truffle Risotto', qty: 2, price: 180000 }],
        null, '2026-06-30T11:50:00', 'Table requested cancellation'),
    order('1011', 'completed', 'dine-in', 'VIP 1', 'OVO',
        [{ name: 'Lamb Chops', qty: 4, price: 210000 }, { name: 'Tiramisu', qty: 4, price: 75000 }, { name: 'Garlic Bread', qty: 2, price: 35000 }],
        'Dewi Kusuma', '2026-06-30T12:10:00'),
    order('1012', 'pending', 'takeaway', null, 'GoPay',
        [{ name: 'Grilled Salmon', qty: 2, price: 195000 }, { name: 'Mushroom Soup', qty: 1, price: 55000 }],
        'Rudi Hartono', '2026-06-30T12:35:00'),
];

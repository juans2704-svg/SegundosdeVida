-- Aportes por transferencia o consignación a la cuenta Bancolombia de la fundación.
-- Quedan "pendientes" hasta que el admin confirma que el dinero llegó.
alter type donation_source add value if not exists 'transfer';

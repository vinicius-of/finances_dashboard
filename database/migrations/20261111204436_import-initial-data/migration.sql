-- Dados importados dos arquivos import-*.md.
-- Taxas ausentes na origem foram gravadas como 0 e `fonte` como 'Não informado'.
-- `bought_at` das ações usa a data de registro (09/09/2026), única data disponível.

INSERT INTO `ventures` (`id`, `name`, `internal_code`, `category`, `type`, `initial_value`, `bought_at`, `expires_in`, `indexer`, `rate`, `source`, `quantity`, `unit_price`, `total_price`, `created_at`, `updated_at`, `deleted_at`) VALUES
('imp-ac-petr4', 'PETR4', 'PETR4', 'VARIABLE', 'STOCK', 136164, '2026-09-09', NULL, NULL, NULL, NULL, 28, 4863, 136164, '2026-11-11T00:00:00.000Z', '2026-11-11T00:00:00.000Z', NULL),
('imp-ac-bovv11', 'BOVV11', 'BOVV11', 'VARIABLE', 'STOCK', 38290, '2026-09-09', NULL, NULL, NULL, NULL, 2, 19145, 38290, '2026-11-11T00:00:00.000Z', '2026-11-11T00:00:00.000Z', NULL),
('imp-ac-nvdc34', 'NVDC34', 'NVDC34', 'VARIABLE', 'STOCK', 28524, '2026-09-09', NULL, NULL, NULL, NULL, 12, 2377, 28524, '2026-11-11T00:00:00.000Z', '2026-11-11T00:00:00.000Z', NULL),
('imp-ac-msft34', 'MSFT34', 'MSFT34', 'VARIABLE', 'STOCK', 31377, '2026-09-09', NULL, NULL, NULL, NULL, 3, 10459, 31377, '2026-11-11T00:00:00.000Z', '2026-11-11T00:00:00.000Z', NULL),
('imp-ac-aapl34', 'AAPL34', 'AAPL34', 'VARIABLE', 'STOCK', 31728, '2026-09-09', NULL, NULL, NULL, NULL, 4, 7932, 31728, '2026-11-11T00:00:00.000Z', '2026-11-11T00:00:00.000Z', NULL),
('imp-ac-gogl34', 'GOGL34', 'GOGL34', 'VARIABLE', 'STOCK', 42126, '2026-09-09', NULL, NULL, NULL, NULL, 3, 14042, 42126, '2026-11-11T00:00:00.000Z', '2026-11-11T00:00:00.000Z', NULL),
('imp-ac-mscd34', 'MSCD34', 'MSCD34', 'VARIABLE', 'STOCK', 18744, '2026-09-09', NULL, NULL, NULL, NULL, 2, 9372, 18744, '2026-11-11T00:00:00.000Z', '2026-11-11T00:00:00.000Z', NULL),
('imp-ac-tsmc34', 'TSMC34', 'TSMC34', 'VARIABLE', 'STOCK', 27658, '2026-09-09', NULL, NULL, NULL, NULL, 1, 27658, 27658, '2026-11-11T00:00:00.000Z', '2026-11-11T00:00:00.000Z', NULL),
('imp-ac-asml34', 'ASML34', 'ASML34', 'VARIABLE', 'STOCK', 32218, '2026-09-09', NULL, NULL, NULL, NULL, 2, 16109, 32218, '2026-11-11T00:00:00.000Z', '2026-11-11T00:00:00.000Z', NULL),
('imp-ac-amzo34', 'AMZO34', 'AMZO34', 'VARIABLE', 'STOCK', 12876, '2026-09-09', NULL, NULL, NULL, NULL, 2, 6438, 12876, '2026-11-11T00:00:00.000Z', '2026-11-11T00:00:00.000Z', NULL),
('imp-ac-itlc34', 'ITLC34', 'ITLC34', 'VARIABLE', 'STOCK', 26988, '2026-09-09', NULL, NULL, NULL, NULL, 3, 8996, 26988, '2026-11-11T00:00:00.000Z', '2026-11-11T00:00:00.000Z', NULL),
('imp-ac-abev3', 'ABEV3', 'ABEV3', 'VARIABLE', 'STOCK', 40482, '2026-09-09', NULL, NULL, NULL, NULL, 26, 1557, 40482, '2026-11-11T00:00:00.000Z', '2026-11-11T00:00:00.000Z', NULL),
('imp-ac-vale3', 'VALE3', 'VALE3', 'VARIABLE', 'STOCK', 39345, '2026-09-09', NULL, NULL, NULL, NULL, 5, 7869, 39345, '2026-11-11T00:00:00.000Z', '2026-11-11T00:00:00.000Z', NULL),
('imp-rf-lci-pre-180d-1', 'LCI Pre 180D 1', NULL, 'FIXED', 'LCI', 252400, '2026-03-11', '2026-09-14', 'FIXED', 0.12, 'Não informado', NULL, NULL, NULL, '2026-11-11T00:00:00.000Z', '2026-11-11T00:00:00.000Z', NULL),
('imp-rf-lci-pre-180d-2', 'LCI Pre 180D 2', NULL, 'FIXED', 'LCI', 206792, '2026-03-30', '2026-10-01', 'FIXED', 0.128, 'Não informado', NULL, NULL, NULL, '2026-11-11T00:00:00.000Z', '2026-11-11T00:00:00.000Z', NULL),
('imp-rf-cra-uisa', 'CRA UISA', NULL, 'FIXED', 'CRA', 509385, '2026-03-13', '2031-07-15', 'CDI', 0.1798, 'Não informado', NULL, NULL, NULL, '2026-11-11T00:00:00.000Z', '2026-11-11T00:00:00.000Z', NULL),
('imp-td-selic-2027', 'Tesouro Selic 2027', NULL, 'FIXED', 'TREASURY', 1005002, '2026-01-05', '2028-03-01', 'SELIC', 0, 'Tesouro Direto', NULL, NULL, NULL, '2026-11-11T00:00:00.000Z', '2026-11-11T00:00:00.000Z', NULL),
('imp-td-selic-2031', 'Tesouro Selic 2031', NULL, 'FIXED', 'TREASURY', 164209, '2026-02-05', '2031-03-01', 'SELIC', 0, 'Tesouro Direto', NULL, NULL, NULL, '2026-11-11T00:00:00.000Z', '2026-11-11T00:00:00.000Z', NULL);
--> statement-breakpoint

WITH data(venture_id, reference_date, unit_price, quantity, total_value, notes) AS (
  VALUES
    ('imp-ac-petr4', '2026-09-09', 4863, 28, 136164, NULL),
    ('imp-ac-bovv11', '2026-09-09', 19145, 2, 38290, NULL),
    ('imp-ac-nvdc34', '2026-09-09', 2377, 12, 28524, NULL),
    ('imp-ac-msft34', '2026-09-09', 10459, 3, 31377, NULL),
    ('imp-ac-aapl34', '2026-09-09', 7932, 4, 31728, NULL),
    ('imp-ac-gogl34', '2026-09-09', 14042, 3, 42126, NULL),
    ('imp-ac-mscd34', '2026-09-09', 9372, 2, 18744, NULL),
    ('imp-ac-tsmc34', '2026-09-09', 27658, 1, 27658, NULL),
    ('imp-ac-asml34', '2026-09-09', 16109, 2, 32218, NULL),
    ('imp-ac-amzo34', '2026-09-09', 6438, 2, 12876, NULL),
    ('imp-ac-itlc34', '2026-09-09', 8996, 3, 26988, NULL),
    ('imp-ac-abev3', '2026-09-09', 1557, 26, 40482, NULL),
    ('imp-ac-vale3', '2026-09-09', 7869, 5, 39345, NULL),
    ('imp-rf-lci-pre-180d-1', '2026-07-09', NULL, NULL, 261897, NULL),
    ('imp-rf-lci-pre-180d-1', '2026-09-09', NULL, NULL, 266944, NULL),
    ('imp-rf-lci-pre-180d-2', '2026-07-09', NULL, NULL, 206792, NULL),
    ('imp-rf-lci-pre-180d-2', '2026-09-09', NULL, NULL, 211076, NULL),
    ('imp-rf-cra-uisa', '2026-07-09', NULL, NULL, 515554, NULL),
    ('imp-rf-cra-uisa', '2026-09-09', NULL, NULL, 508990, NULL),
    ('imp-td-selic-2027', '2026-01-08', NULL, NULL, 2158189, NULL),
    ('imp-td-selic-2027', '2026-03-02', NULL, NULL, 2194821, NULL),
    ('imp-td-selic-2027', '2026-07-09', NULL, NULL, 2286506, NULL),
    ('imp-td-selic-2027', '2026-09-09', NULL, NULL, 2341157, NULL),
    ('imp-td-selic-2031', '2026-03-02', NULL, NULL, 165109, NULL),
    ('imp-td-selic-2031', '2026-07-09', NULL, NULL, 1723641, 'revisar: valor fora da série histórica'),
    ('imp-td-selic-2031', '2026-09-09', NULL, NULL, 761265, NULL)
)
INSERT INTO `venture_snapshots` (`id`, `venture_id`, `reference_date`, `current_unit_price`, `current_quantity_held`, `current_total_value`, `total_contributed`, `gross_profit`, `profit_percentage`, `type`, `movement_value`, `notes`, `created_at`, `updated_at`, `deleted_at`)
SELECT
  data.venture_id || '-snap-' || data.reference_date,
  data.venture_id,
  data.reference_date,
  data.unit_price,
  data.quantity,
  data.total_value,
  v.initial_value,
  data.total_value - v.initial_value,
  ROUND((data.total_value - v.initial_value) * 100.0 / v.initial_value, 4),
  'MONTHLY_RECORD',
  NULL,
  data.notes,
  '2026-11-11T00:00:00.000Z',
  '2026-11-11T00:00:00.000Z',
  NULL
FROM data
JOIN `ventures` v ON v.id = data.venture_id;

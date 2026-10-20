# Architecture Session: Expense Tracking App Database Design

This file contains the complete architectural history, feature requirements mapping, and final production-ready database schema developed for a local-first, synchronized mobile and web expense tracking application.

---

## 1. Technical Stack Summary

* **Mobile Frontend:** React Native (Expo)
* **Local Storage:** SQLite via **PowerSync Client SDK**
* **Synchronization Pipeline:** **PowerSync Service** (Docker Orchestrated)
* **Cloud Master Database:** **PostgreSQL** (Docker / Self-Hosted Compatible)

---

## 2. Core Feature Requirements Mapping

### Multi-Account & Internal Transfers
* **Requirement:** Allow distinct liquid asset accounts (Checking, Savings, Cash) alongside credit cards and investment vectors. Track direct money transfers internally without triggering faulty expense or income logs.
* **Database Fix:** Implement an explicit source/destination mapping strategy on the core transaction block using a mandatory `account_id` alongside a nullable `to_account_id`.

### Credit Card Performance Modeling
* **Requirement:** Accurately emulate credit behaviors including credit limits and revolving available balances.
* **Database Fix:** Add a nullable `credit_limit` column directly onto the unified `accounts` table structure.

### Hierarchical Account Classification
* **Requirement:** Group accounts under standard double-entry accounting classes (Assets/Actives vs. Liabilities/Passives) while allowing the user to seamlessly create custom visual sub-groups with custom icons.
* **Database Fix:** Extract categories out to an isolated `accounts_group` table utilizing an active SQLite check constraint (`CHECK (class IN ('ASSET', 'LIABILITY'))`).

### Many-to-Many Transaction Tagging
* **Requirement:** Allow users to bind multiple custom organizational tag elements to an individual transaction row.
* **Database Fix:** Deploy a normalized join table named `transaction_tags` reinforced with a composite primary key consisting of `(transaction_id, tag_id)` to explicitly prevent duplicate data leaks at the database hardware layer.

### Receipts & Multi-File Documentation Cache
* **Requirement:** Enable multiple physical attachment files (PDFs, JPEGs, PNGs) per transaction without slowing down local SQLite query operations or inflating background sync footprints.
* **Database Fix:** Store the binary files directly within the device file-system and log reference anchors inside a decoupled child table named `attachments`.

### Timeline Auditing & Soft Deletes (Trash Bin)
* **Requirement:** Provide a full system chronology stream while securing offline updates against silent synchronization drops during data sync intervals.
* **Database Fix:** Deploy twin chronological tracking timestamps (`transaction_date`, `created_at`). For deletes, drop hard truncation triggers entirely and run logical soft deletions using boolean flags (`is_deleted`, `deleted_at`).

### Future Installment Posting Automation
* **Requirement:** Enable seamless Buy Now, Pay Later tracking that automatically logs future recurring monthly expense chunks.
* **Database Fix:** Map structural parameters inside an `installment_plans` table equipped with a `day_of_month` integer constraint. When the app initializes, a runtime loop checks for missing periods and inserts them programmatically on-demand.

---

## 3. Final Production Schema Blueprint (SQLite Script)

```sql
-- 1. GRUPOS DE CUENTAS (Activos y Pasivos)
CREATE TABLE accounts_group (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    class TEXT NOT NULL CHECK (class IN ('ASSET', 'LIABILITY'))
);

-- 2. CUENTAS (Efectivo, Débito, Crédito, Inversiones)
CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    credit_limit INTEGER, -- Nullable para cuentas corrientes
    initial_balance INTEGER NOT NULL, -- Almacenado en centavos
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    interest_rate REAL, -- Nullable
    interest_period TEXT CHECK (interest_period IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')),
    account_group_id TEXT NOT NULL,
    icon TEXT, -- Nullable (Si es NULL, hereda el del grupo)
    FOREIGN KEY (account_group_id) REFERENCES accounts_group(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 3. CATEGORÍAS (Alimentos, Transporte, Salario)
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('EXPENSE', 'INCOME')),
    color TEXT, -- Código Hexadecimal para la UI
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. PRESUPUESTOS POR CATEGORÍA
CREATE TABLE budgets (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    amount INTEGER NOT NULL, -- Límite en centavos
    period TEXT NOT NULL CHECK (period IN ('WEEKLY', 'MONTHLY', 'YEARLY')),
    start_date TIMESTAMP NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- 5. PLANES DE PLAZOS / CUOTAS (BNPL / Tarjetas de Crédito)
CREATE TABLE installment_plans (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    name TEXT NOT NULL,
    total_amount INTEGER NOT NULL,
    total_months INTEGER NOT NULL,
    day_of_month INTEGER NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 6. TRANSACCIONES (El motor principal)
CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    amount INTEGER NOT NULL, -- Siempre positivo, en centavos
    type TEXT NOT NULL CHECK (type IN ('EXPENSE', 'INCOME', 'TRANSFER')),
    title TEXT NOT NULL,
    notes TEXT,
    account_id TEXT NOT NULL,
    to_account_id TEXT, -- Solo se usa si type = 'TRANSFER'
    category_id TEXT, -- Nullable para transferencias internas
    installment_plan_id TEXT, -- Nullable si no es a plazos
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0, -- 0 = Activo, 1 = Papelera
    deleted_at TIMESTAMP, -- Nullable, usado para purgar tras 30 días
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (installment_plan_id) REFERENCES installment_plans(id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- 7. ETIQUETAS (Tags)
CREATE TABLE tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT
);

-- 8. TABLA PIVOTE: RELACIÓN MUCHOS A MUCHOS (Transacciones <-> Etiquetas)
CREATE TABLE transaction_tags (
    transaction_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (transaction_id, tag_id), -- Clave compuesta para evitar duplicados
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- 9. ARCHIVOS ADJUNTOS (Recibos múltiples por transacción)
CREATE TABLE attachments (
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    local_file_path TEXT NOT NULL, -- Ruta en el almacenamiento del celular
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL, -- Ejemplo: 'application/pdf', 'image/jpeg'
    file_size INTEGER NOT NULL, -- En bytes
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON UPDATE CASCADE ON DELETE CASCADE
);
```

---

## 4. Architectural Rules Summary for Implementation

1. **Client-Side UUID Enforcement:** Ensure standard auto-increment integers (`1, 2, 3`) are stripped completely from local runtime models. Primary key fields across all tables require client-side generated Universally Unique Identifiers (UUID strings) to assure completely clash-free background logical replication loops.
2. **Immutable Baselines:** Retain the `initial_balance` state completely untouched following row initiation. Real-time balance positions are computed dynamically via mathematical aggregation queries. 
3. **Soft-Delete Protocols:** Active user views filter items out utilizing a `WHERE is_deleted = 0` condition. Deleting files or clearing records completely occurs on a delayed queue engine safely tracking the `deleted_at` threshold.
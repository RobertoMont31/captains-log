import { Schema, Table, column } from '@powersync/react-native'; 

export const AppSchema = new Schema({
  users: new Table({
    username: column.text(),
    email: column.text(),
    created_at: column.text()
  }),
  accounts_group: new Table({
    icon: column.text(),
    class: column.text(),
    user_id: column.text()
  }),
  accounts: new Table({
    name: column.text(),
    credit_limit: column.integer(),
    initial_balance: column.integer(),
    created_at: column.text(),
    interest_rate: column.real(),
    interest_period: column.text(),
    account_group_id: column.text(),
    icon: column.text(),
    user_id: column.text()
  }),
  categories: new Table({
    name: column.text(),
    type: column.text(),
    color: column.text(),
    created_at: column.text(),
    user_id: column.text()
  }),
  transactions: new Table({
    amount: column.integer(),
    type: column.text(),
    title: column.text(),
    notes: column.text(),
    account_id: column.text(),
    to_account_id: column.text(),
    category_id: column.text(),
    installment_plan_id: column.text(),
    created_at: column.text(),
    is_deleted: column.integer(), // SQLite uses integers (0/1) for booleans
    deleted_at: column.text(),
    user_id: column.text()
  }),
  attachments: new Table({
    transaction_id: column.text(),
    local_file_path: column.text(),
    file_name: column.text(),
    file_type: column.text(),
    file_size: column.integer(),
    user_id: column.text()
  }),
  tags: new Table({
    name: column.text(),
    color: column.text(),
    user_id: column.text()
  }),
  budgets: new Table({
    category_id: column.text(),
    amount: column.integer(),
    period: column.text(),
    start_date: column.text(),
    user_id: column.text()
  }),
  installment_plans: new Table({
    account_id: column.text(),
    name: column.text(),
    total_amount: column.integer(),
    total_months: column.integer(),
    created_at: column.text(),
    day_of_month: column.integer(),
    user_id: column.text()
  }),
  transaction_tags: new Table({
    transaction_id: column.text(),
    tag_id: column.text()
  })
});

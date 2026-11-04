import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAccounts } from '@/addons/accounting/hooks/useJournal'
import { useMutation } from '@/core/app/data'
import { notify } from '@/core/app/notify'
import { ActionBar } from '@/core/components/ui/ActionBar'
import { Button } from '@/core/components/ui/Button'
import { Field } from '@/core/components/ui/Field'
import { PageHeader } from '@/core/components/ui/PageHeader'
import { Select, type SelectOption } from '@/core/components/ui/Select'
import { cn } from '@/core/lib/cn'
import { useFirstVisit } from '@/core/lib/useFirstVisit'
import type { ProductResponse } from '../fixtures/catalog'
import { useCategories } from '../hooks/useCatalog'
import {
  createProduct,
  fieldErrorsFrom,
  type ProductCreateBody,
  type ProductField,
  type ProductFormErrors,
} from '../hooks/useCreateProduct'

interface Draft {
  name: string
  sku: string
  category_id: string
  asset_account_id: string
  revenue_account_id: string
  unit_cost: string
  unit_price: string
  safety_stock_threshold: string
}

const EMPTY: Draft = {
  name: '',
  sku: '',
  category_id: '',
  asset_account_id: '',
  revenue_account_id: '',
  unit_cost: '',
  unit_price: '',
  safety_stock_threshold: '0',
}

const DECIMAL = /^\d+(\.\d{1,4})?$/
const WHOLE = /^\d+$/

function validate(draft: Draft): ProductFormErrors['fields'] {
  const fields: ProductFormErrors['fields'] = {}
  if (!draft.name.trim()) fields.name = 'Enter a product name'
  if (!draft.sku.trim()) fields.sku = 'Enter a SKU'
  if (!draft.category_id) fields.category_id = 'Choose a category'
  if (!draft.asset_account_id) fields.asset_account_id = 'Choose the inventory asset account'
  if (!draft.revenue_account_id) fields.revenue_account_id = 'Choose the sales revenue account'
  if (!DECIMAL.test(draft.unit_cost)) fields.unit_cost = 'Enter a cost with up to four decimals'
  if (!DECIMAL.test(draft.unit_price)) fields.unit_price = 'Enter a price with up to four decimals'
  if (!WHOLE.test(draft.safety_stock_threshold)) {
    fields.safety_stock_threshold = 'Enter a whole number of units'
  }
  return fields
}

function toBody(draft: Draft): ProductCreateBody {
  return {
    name: draft.name.trim(),
    sku: draft.sku.trim(),
    category_id: draft.category_id,
    asset_account_id: draft.asset_account_id,
    revenue_account_id: draft.revenue_account_id,
    unit_cost: draft.unit_cost,
    unit_price: draft.unit_price,
    safety_stock_threshold: Number(draft.safety_stock_threshold),
  }
}

function withPlaceholder(placeholder: string, options: SelectOption[]): SelectOption[] {
  return [{ value: '', label: placeholder }, ...options]
}

export function ProductNewScreen() {
  const navigate = useNavigate()
  const fresh = useFirstVisit('inventory/products/new')
  const categories = useCategories()
  const accounts = useAccounts()
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [errors, setErrors] = useState<ProductFormErrors>({ fields: {} })
  const creation = useMutation<ProductCreateBody, ProductResponse>(createProduct)

  const set = (field: ProductField) => (value: string) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setErrors((current) =>
      current.fields[field] ? { ...current, fields: { ...current.fields, [field]: undefined } } : current,
    )
  }

  const categoryOptions = withPlaceholder(
    'Select a category',
    categories.items.map((category) => ({ value: category.category_id, label: category.name })),
  )
  const accountOptions = (type: string) =>
    withPlaceholder(
      'Select an account',
      accounts.items
        .filter((account) => account.account_type === type)
        .map((account) => ({
          value: account.account_id,
          label: `${account.account_code} · ${account.account_name}`,
        })),
    )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (creation.pending) return

    const fields = validate(draft)
    setErrors({ fields })
    if (Object.keys(fields).length > 0) return

    try {
      const product = await creation.run(toBody(draft))
      notify.success(`${product.sku} created`)
      navigate('/inventory/products')
    } catch (cause) {
      setErrors(fieldErrorsFrom(cause))
    }
  }

  const loadError = categories.error ?? accounts.error

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn(fresh && 'rise', 'mx-auto max-w-3xl')}
    >
      <PageHeader title="New product" />

      {(errors.form ?? loadError) && (
        <p role="alert" className="mt-4 text-base text-negative">
          {errors.form ?? loadError}
        </p>
      )}

      <section className="mt-7">
        <h2 className="section-label">Identity</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
          <Field
            label="Name"
            name="name"
            value={draft.name}
            error={errors.fields.name}
            onChange={(event) => set('name')(event.target.value)}
            placeholder="Business Laptop"
          />
          <Field
            label="SKU"
            name="sku"
            value={draft.sku}
            error={errors.fields.sku}
            onChange={(event) => set('sku')(event.target.value)}
            placeholder="LAP-01"
            className="figure"
          />
        </div>
        <div className="mt-4 max-w-sm">
          <Select
            label="Category"
            name="category_id"
            value={draft.category_id}
            error={errors.fields.category_id}
            onChange={(event) => set('category_id')(event.target.value)}
            options={categoryOptions}
          />
        </div>
      </section>

      <section className="mt-9">
        <h2 className="section-label">Accounts</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Receipts post to the asset account; fulfilled sales post to the revenue account.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Inventory asset account"
            name="asset_account_id"
            value={draft.asset_account_id}
            error={errors.fields.asset_account_id}
            onChange={(event) => set('asset_account_id')(event.target.value)}
            options={accountOptions('asset')}
          />
          <Select
            label="Sales revenue account"
            name="revenue_account_id"
            value={draft.revenue_account_id}
            error={errors.fields.revenue_account_id}
            onChange={(event) => set('revenue_account_id')(event.target.value)}
            options={accountOptions('revenue')}
          />
        </div>
      </section>

      <section className="mt-9">
        <h2 className="section-label">Pricing and stock</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field
            label="Unit cost"
            name="unit_cost"
            inputMode="decimal"
            value={draft.unit_cost}
            error={errors.fields.unit_cost}
            onChange={(event) => set('unit_cost')(event.target.value)}
            placeholder="0.0000"
            className="figure text-right"
          />
          <Field
            label="Unit price"
            name="unit_price"
            inputMode="decimal"
            value={draft.unit_price}
            error={errors.fields.unit_price}
            onChange={(event) => set('unit_price')(event.target.value)}
            placeholder="0.0000"
            className="figure text-right"
          />
          <Field
            label="Safety stock"
            name="safety_stock_threshold"
            inputMode="numeric"
            value={draft.safety_stock_threshold}
            error={errors.fields.safety_stock_threshold}
            onChange={(event) => set('safety_stock_threshold')(event.target.value)}
            hint="Units on hand before a reorder alert."
            className="figure text-right"
          />
        </div>
      </section>

      <ActionBar>
        <Button type="button" onClick={() => navigate('/inventory/products')}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" shortcut="⌘↵" loading={creation.pending}>
          Create product
        </Button>
      </ActionBar>
    </form>
  )
}

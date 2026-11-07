import { authorized } from '@/core/app/session'
import { ApiError } from '@/core/lib/api'
import type { ProductResponse } from '../fixtures/catalog'

export interface ProductCreateBody {
  name: string
  sku: string
  category_id: string
  asset_account_id: string
  revenue_account_id: string
  unit_cost: string
  unit_price: string
  safety_stock_threshold: number
}

export type ProductField = keyof ProductCreateBody

export interface ProductFormErrors {
  form?: string
  fields: Partial<Record<ProductField, string>>
}

const FIELDS: ProductField[] = [
  'name',
  'sku',
  'category_id',
  'asset_account_id',
  'revenue_account_id',
  'unit_cost',
  'unit_price',
  'safety_stock_threshold',
]

function isField(value: unknown): value is ProductField {
  return typeof value === 'string' && (FIELDS as string[]).includes(value)
}

export function createProduct(body: ProductCreateBody, signal: AbortSignal): Promise<ProductResponse> {
  return authorized<ProductResponse>('/api/inventory/products', { method: 'POST', body, signal })
}

export function fieldErrorsFrom(error: unknown): ProductFormErrors {
  if (!(error instanceof ApiError)) return { form: 'Could not create the product', fields: {} }
  if (error.status === 409) return { fields: { sku: error.message } }
  if (error.status === 422) {
    const detail = error.details.detail
    const fields: ProductFormErrors['fields'] = {}
    if (Array.isArray(detail)) {
      for (const item of detail) {
        const { loc, msg } = item as { loc?: unknown[]; msg?: string }
        const field = loc?.[1]
        if (isField(field) && !fields[field]) fields[field] = msg ?? 'Check this value'
      }
    }
    return Object.keys(fields).length > 0 ? { fields } : { form: error.message, fields: {} }
  }
  return { form: error.message, fields: {} }
}

import { useList } from '@/core/app/data'
import type { CategoryResponse, ProductResponse } from '../fixtures/catalog'

export const useProducts = () =>
  useList<ProductResponse>('/api/inventory/products', { limit: 100 })

export const useCategories = () => useList<CategoryResponse>('/api/inventory/categories')

export function categoryNames(categories: CategoryResponse[]): Map<string, string> {
  return new Map(categories.map((category) => [category.category_id, category.name]))
}

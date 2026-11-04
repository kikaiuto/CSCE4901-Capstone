export interface ProductResponse {
  product_id: string
  category_id: string
  name: string
  sku: string
  unit_cost: string
  average_cost: string
  unit_price: string
  safety_stock_threshold: number
}

export interface CategoryResponse {
  category_id: string
  name: string
}

export const demoCategories: CategoryResponse[] = [
  { category_id: 'cat-laptops', name: 'Laptops' },
  { category_id: 'cat-accessories', name: 'Accessories' },
]

export const demoProducts: ProductResponse[] = [
  {
    product_id: 'prod-lap-01',
    category_id: 'cat-laptops',
    name: 'Business Laptop',
    sku: 'LAP-01',
    unit_cost: '550.0000',
    average_cost: '550.0000',
    unit_price: '899.0000',
    safety_stock_threshold: 5,
  },
  {
    product_id: 'prod-acc-01',
    category_id: 'cat-accessories',
    name: 'Wireless Mouse',
    sku: 'ACC-01',
    unit_cost: '12.0000',
    average_cost: '12.4000',
    unit_price: '29.0000',
    safety_stock_threshold: 5,
  },
  {
    product_id: 'prod-acc-02',
    category_id: 'cat-accessories',
    name: 'USB-C Dock',
    sku: 'ACC-02',
    unit_cost: '65.0000',
    average_cost: '65.0000',
    unit_price: '119.0000',
    safety_stock_threshold: 5,
  },
]

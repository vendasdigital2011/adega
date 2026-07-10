"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Textarea } from "@/components/ui/Textarea"
import { Button } from "@/components/ui/Button"
import { productSchema, ProductFormInputs } from "../schemas/product.schema"
import { useProductOptions } from "../hooks/useProductOptions"
import { Product } from "@/types"

interface ProductFormProps {
  product?: Product
  onSubmit: (data: ProductFormInputs) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function ProductForm({ product, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const { categories, brands, suppliers, isLoading: loadingOptions } = useProductOptions()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormInputs>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      sku: product?.sku || "",
      category_id: product?.category_id || "",
      brand_id: product?.brand_id || "",
      supplier_id: product?.supplier_id || "",
      barcode: product?.barcode || "",
      unit: product?.unit || "",
      sale_price: product?.sale_price ?? ("" as unknown as number),
      purchase_price: product?.purchase_price ?? ("" as unknown as number),
      wholesale_price: product?.wholesale_price ?? ("" as unknown as number),
      promotion_price: product?.promotion_price ?? ("" as unknown as number),
      minimum_stock: product?.minimum_stock ?? ("" as unknown as number),
      description: product?.description || "",
      image_url: product?.image_url || "",
    },
  })

  const categoryOptions = [
    { value: "", label: "Selecione uma categoria..." },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ]
  const brandOptions = [
    { value: "", label: "— Nenhuma —" },
    ...brands.map((b) => ({ value: b.id, label: b.name })),
  ]
  const supplierOptions = [
    { value: "", label: "— Nenhum —" },
    ...suppliers.map((s) => ({ value: s.id, label: s.name })),
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Nome do produto" error={errors.name?.message} {...register("name")} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="SKU (código interno)" error={errors.sku?.message} {...register("sku")} />
        <Input label="Código de barras (opcional)" error={errors.barcode?.message} {...register("barcode")} />
      </div>

      <Select
        label="Categoria"
        options={categoryOptions}
        error={errors.category_id?.message}
        disabled={loadingOptions}
        {...register("category_id")}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Marca (opcional)"
          options={brandOptions}
          error={errors.brand_id?.message}
          disabled={loadingOptions}
          {...register("brand_id")}
        />
        <Select
          label="Fornecedor (opcional)"
          options={supplierOptions}
          error={errors.supplier_id?.message}
          disabled={loadingOptions}
          {...register("supplier_id")}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Preço de venda"
          type="number"
          step="0.01"
          error={errors.sale_price?.message}
          {...register("sale_price")}
        />
        <Input
          label="Preço de compra (opcional)"
          type="number"
          step="0.01"
          error={errors.purchase_price?.message}
          {...register("purchase_price")}
        />
        <Input
          label="Estoque mínimo"
          type="number"
          step="1"
          error={errors.minimum_stock?.message}
          {...register("minimum_stock")}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Preço atacado (opcional)"
          type="number"
          step="0.01"
          error={errors.wholesale_price?.message}
          {...register("wholesale_price")}
        />
        <Input
          label="Preço promoção (opcional)"
          type="number"
          step="0.01"
          error={errors.promotion_price?.message}
          {...register("promotion_price")}
        />
        <Input label="Unidade (opcional)" placeholder="un, kg, L..." error={errors.unit?.message} {...register("unit")} />
      </div>

      <Input label="URL da imagem (opcional)" error={errors.image_url?.message} {...register("image_url")} />
      <Textarea label="Descrição (opcional)" error={errors.description?.message} {...register("description")} />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" loading={isLoading}>
          {product ? "Salvar" : "Criar Produto"}
        </Button>
      </div>
    </form>
  )
}

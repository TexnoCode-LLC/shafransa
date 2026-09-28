// Endirim faizi: yalnız köhnə qiymət yeni qiymətdən böyükdürsə
export const discountPercent = (product) =>
  product?.originalPrice > product?.price ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : null

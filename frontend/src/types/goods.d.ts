interface MedicineInfo {
  barcode?: string;
  brand?: string;
  goods_name: string;
  company?: string;
  keyword?: string;
  goods_type?: string;
  category_code?: string;
  category_name?: string;
  image?: string;
  spec?: string;
  width?: string;
  height?: string;
  depth?: string;
  gross_weight?: string;
  net_weight?: string;
  price: string;
  origin_country?: string;
  first_ship_date?: string;
  packaging_type?: string;
  shelf_life?: string;
  min_sales_unit?: string;
  certification_standard?: string;
  certificate_license?: string;
  remark?: string;
}

interface MedicineInfoFromBackend extends MedicineInfo{
  id: number;
  description?: string;
  purchase_price: string;
  sale_price: string;
}

interface RecordEntity {
  id: number;
  patientName: string; // 病人姓名
  patientAge: number; // 病人年龄
  patientGender: 'male' | 'female';
  prescriptionImageUrls: string[]; // 处方照片地址
  startDate: string; // 看病开始日期
  endDate: string; // 看病结束日期
  totalPrice?: number; // 一次性总价（如果是整体收费，使用此字段）
  medications?: {medicine: MedicineInfoFromBackend, amount: string}[]; // 使用的药品，存储为 JSON 数组
}

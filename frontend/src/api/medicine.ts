import { local } from '@/const/env';
import { GetBarcodeInfoType } from '@/const/medicine';
import useAxios from 'axios-hooks';

// 创建药品接口
export const useCreateMedicine = () => {
  const [{ data, loading, error }, createMedicine] = useAxios(
    {
      url: `${local}:3000/medicine/add-medicine`, // 创建药品接口
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // 允许跨域携带 Cookie
    },
    { manual: true }
  );

  return { data, loading, error, createMedicine };
};

// 编辑药品接口
export const useEditMedicine = () => {
  const [{ data, loading, error }, editMedicine] = useAxios(
    {
      url: `${local}:3000/medicine/edit-medicine`, // 创建药品接口
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // 允许跨域携带 Cookie
    },
    { manual: true }
  );

  return { data, loading, error, editMedicine };
};

export const useGetMedicineDetails = () => {
  const [{ data, loading, error }, getMedicineDetails] = useAxios(
    {
      method: 'GET',
      withCredentials: true, // 允许跨域携带 Cookie
    },
    { manual: true } // 需要手动触发请求
  );

  const fetchMedicineDetails = (Id: string) => {
    return getMedicineDetails({
      url: `${local}:3000/medicine/list/${Id}`,
    });
  };

  return { data, loading, error, fetchMedicineDetails };
};

export const useGetGoodInfo = () => {
  const [{ data, loading, error }, getGoodInfo] = useAxios(
    {
      method: 'GET',
      withCredentials: true, // 允许跨域携带 Cookie
    },
    { manual: true } // 需要手动触发请求
  );

  const fetchGoodInfo = (barcode: string, type: GetBarcodeInfoType) => {
    return getGoodInfo({
      url: `${local}:3000/medicine/barcode?barcode=${barcode}&type=${type}`,
    });
  };

  return { data, loading, error, fetchGoodInfo };
};

// 获取药品列表接口
export const useGetMedicineList = () => {
  const [{ data, loading, error }, getMedicineList] = useAxios(
    {
      url: `${local}:3000/medicine/list`, // 获取药品列表接口
      method: 'GET',
      withCredentials: true, // 允许跨域携带 Cookie
    },
    { manual: true }
  );

  return { data, loading, error, getMedicineList };
};

import { local } from '@/const/env';
import useAxios from 'axios-hooks';

// 创建病历接口
export const useCreateRecord = () => {
  const [{ data, loading, error }, createRecord] = useAxios(
    {
      url: `${local}:3000/record/add-record`, // 创建药品接口
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // 允许跨域携带 Cookie
    },
    { manual: true }
  );

  return { data, loading, error, createRecord };
};

// 编辑病历接口
export const useEditRecord = () => {
  const [{ data, loading, error }, editRecord] = useAxios(
    {
      url: `${local}:3000/record/edit-record`, // 创建药品接口
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // 允许跨域携带 Cookie
    },
    { manual: true }
  );

  return { data, loading, error, editRecord };
};

// 删除病历接口
export const useDeleteRecord = () => {
  const [{ data, loading, error }, deleteRecord] = useAxios(
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // 允许跨域携带 Cookie
    },
    { manual: true }
  );

  // 由于 useAxios 不能动态更改 URL，我们需要在调用时传入 ID
  const handleDeleteRecord = (id: string | number) => {
    return deleteRecord({ url: `${local}:3000/record/delete/${id}` });
  };

  return { data, loading, error, deleteRecord: handleDeleteRecord };
};



// 获取病历列表接口
export const useGetRecordList = () => {
  const [{ data, loading, error }, getRecordList] = useAxios(
    {
      url: `${local}:3000/record/list`, // 获取药品列表接口
      method: 'GET',
      withCredentials: true, // 允许跨域携带 Cookie
    },
    { manual: true }
  );

  return { data, loading, error, getRecordList };
};

export const useGetRecordDetails = () => {
  const [{ data, loading, error }, getRecordDetails] = useAxios(
    {
      method: 'GET',
      withCredentials: true, // 允许跨域携带 Cookie
    },
    { manual: true } // 需要手动触发请求
  );

  const fetchRecordDetails = (Id: string) => {
    return getRecordDetails({
      url: `${local}:3000/record/list/${Id}`,
    });
  };

  return { data, loading, error, fetchRecordDetails };
};

import React, { useMemo, useState } from 'react'
import { Button, Card, CheckList, Input, Popup, SearchBar } from 'antd-mobile'
import styles from './index.module.less'

interface IProps {
  value: Array<{ medicine: MedicineInfoFromBackend, amount: string }>;
  onChange: (item: Array<{ medicine: MedicineInfoFromBackend, amount: string }>) => void;
  filterFunc?: (searchText: string) => Record<string, any>[];
  defaultData?: Record<string, any>[];
  label: string;
}
const SearchList: React.FC<IProps> = (props) => {
  const { value, onChange, filterFunc, label, defaultData } = props;
  const [visible, setVisible] = useState(false)
  const [searchText, setSearchText] = useState('')
  const filteredItems = useMemo(() => {
    if (searchText) {
      return filterFunc?.(searchText);
    } else {
      return defaultData;
    }
  }, [defaultData, searchText])

  return (
    <div className={styles.container}>
      <Button
        className={styles.button}
        block
        color='primary'
        onClick={() => {
          setVisible(true)
        }}
      >
        选择药品
      </Button>
      <Card
        style={{
          padding: '12px',
          borderRadius: '12px',
          backgroundColor: '#f8f8f8',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          marginBottom: '16px',
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>已选择的药品:</div>
        <div>
          {(value?.length ?? 0) > 0 ? (
            value?.map((item) => (
              <Card
                key={item.medicine.id}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  backgroundColor: '#f8f8f8',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  marginBottom: '16px',
                }}
              >
                <div className={styles.name}><span className={styles.label}>名称：</span><span className={styles.text}>{item.medicine.goods_name}</span></div>
                <div className={styles.company}><span className={styles.label}>品牌：</span><span className={styles.text}>{item.medicine.company}</span></div>
                <div className={styles.amount} style={{ display: 'flex', width: '100%' }}>
                  <span className={styles.label}>数量：</span>
                  <Input placeholder='请输入数量' type='number'
                    min={1}
                    clearable
                    value={item.amount}
                    onChange={(val: string) => {
                      // 更新对应的 medicine 的 amount
                      const updatedValue = value.map((entry) => {
                        if (entry.medicine.id === item.medicine.id) {
                          return {
                            ...entry,
                            amount: val,  // 更新对应 medicine 的 amount
                          };
                        }
                        return entry;  // 保持其他项不变
                      });

                      onChange(updatedValue);  // 调用 onChange 更新值
                    }}
                  /></div>

              </Card>
              // <Tag
              //   key={item.id}
              //   color='success'
              //   style={{
              //     marginBottom: '8px',
              //     marginRight: '8px',
              //     borderRadius: '8px',
              //     padding: '6px 12px',
              //   }}
              // >
              //   {item.goods_name} / {item.company}
              // </Tag>
            ))
          ) : (
            <div style={{ color: '#888' }}>暂无选择</div>
          )}
        </div>
      </Card>
      <Popup
        visible={visible}
        onMaskClick={() => {
          setVisible(false)
        }}
        destroyOnClose
      >
        <div className={styles.searchBarContainer}>
          <SearchBar
            placeholder='输入文字过滤选项'
            value={searchText}
            onChange={v => {
              setSearchText(v)
            }}
          />
        </div>
        <div className={styles.checkListContainer}>
          <CheckList
            className={styles.myCheckList}
            defaultValue={value ? value.map(item => JSON.stringify(item)) : []}
            multiple
            onChange={val => {
              // 解析选中的药品列表
              const selectedItems = val.map(item => JSON.parse(item as string));

              // 更新药品的 amount
              const updatedValue = selectedItems.map(item => {
                // 检查当前 item 是否在已有的 value 中
                const existingMedicine = value?.find(v => v.medicine.id === item.id);

                if (existingMedicine) {
                  // 如果药品已存在，更新 amount
                  return {
                    ...existingMedicine,
                    amount: existingMedicine.amount || '',  // 保证 amount 不为空
                  };
                } else {
                  // 如果是新药品，设置 amount 为空字符串
                  return {
                    medicine: item,
                    amount: '1',
                  };
                }
              });

              // 更新整体的值
              onChange(updatedValue);
            }}
          >
            {filteredItems?.map(item => (
              <CheckList.Item key={item.id} value={JSON.stringify(item)}>
                {(item as Record<string, any>)[label]}
              </CheckList.Item>
            ))}
          </CheckList>
        </div>
      </Popup>
    </div>
  )
}

export default SearchList;

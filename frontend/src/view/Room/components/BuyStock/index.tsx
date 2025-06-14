import { CompanyKey, WsRoomSyncData } from '@/types/room';
import { Modal, Card, Row, Col, Button, message } from 'antd';
import { useState, useMemo, useEffect } from 'react';
import CustomInputNumber from '../CustomInputer';
import { CompanyColor } from '@/const/color';

const BuyStock = ({
  visible,
  setBuyStockModalVisible,
  onSubmit,
  data,
}: {
  visible: boolean,
  setBuyStockModalVisible: React.Dispatch<React.SetStateAction<boolean>>,
  onSubmit: (modalData: Record<CompanyKey, number>) => void,
  data?: WsRoomSyncData
}) => {
  if (!data) return null;
  const initialSelectedCount = Object.keys(data.roomData.companyInfo).reduce((acc, key) => {
    acc[key as CompanyKey] = 0;
    return acc;
  }, {} as Record<CompanyKey, number>);

  const [selectedCompany, setSelectedCompany] = useState<Record<CompanyKey, number>>(initialSelectedCount);
  const money =data?.playerData.info.money ?? 0;

  useEffect(() => {
    if (!visible) {
      setSelectedCompany(initialSelectedCount);
    }
  }, [visible]);

  const totalCost = useMemo(() => {
    return Object.entries(selectedCompany).reduce((sum, [k, count]) => {
      const key = k as CompanyKey; // 添加类型断言
      const price = Number(data.roomData.companyInfo[key]?.stockPrice ?? 0);
      return sum + price * count;
    }, 0);
  }, [selectedCompany]);

  const handleChange = (key: CompanyKey, value: number | null) => {
    if (!value || value < 0) value = 0;

    // 先更新一个临时的 map 判断总花费是否超限
    const temp: Record<CompanyKey, number> = { ...selectedCompany, [key]: value };
    const tempNumber = Object.entries(temp).reduce((sum, [_, v]) => {
      const value = v as number; // 添加类型断言
      return sum + value;
    }, 0);
    if (tempNumber > 3) {
      message.error("不能超过 3 个");
      return;
    }
    const tempCost = Object.entries(temp).reduce((sum, [k, v]) => {
      const key = k as CompanyKey; // 添加类型断言
      const value = v as number; // 添加类型断言
      const price = Number(data.roomData.companyInfo[key]?.stockPrice ?? 0);
      return sum + price * value;
    }, 0);

    if (tempCost > money) {
      message.error("超出余额，无法购买");
      return;
    }
    setSelectedCompany(temp);
  };

  const handleOk = () => {
    if (selectedCompany) {
      onSubmit(selectedCompany);
    } else {
      message.warning("⚠️ 请至少选择一个股票");
    }
  };

  return (
    <Modal
      title="请选择要购买的股票"
      open={visible}
      closable={false}
      footer={
        <Button type="primary" onClick={handleOk} disabled={totalCost > money}>
          确定购买
        </Button>
      }
      onCancel={() => {
        setBuyStockModalVisible(false);
      }}
      centered
      maskClosable={true}
    >
      <Row gutter={[16, 16]}>
        {Object.entries(data.roomData.companyInfo).map(([k, value]) => {
          const key = k as CompanyKey; // 添加类型断言
          const disabled = Number(value.tiles ?? 0) === 0;

          return (
            <Col span={8} key={key}>
              <Card title={key} variant="outlined" hoverable={!disabled} style={{ opacity: disabled ? 0.2 : 1, background: CompanyColor[key] }}>
                <p>股价：{value.stockPrice}</p>
                <p>地块：{value.tiles}</p>
                <p>剩余股票：{value.stockTotal}</p>
                <CustomInputNumber
                  min={0}
                  max={Math.min(value.stockTotal , 3)}
                  value={selectedCompany[key] || 0}
                  onChange={(val) => handleChange(key, val)}
                  disabled={disabled}
                />
              </Card>
            </Col>
          );
        })}
      </Row>
      <div style={{ marginTop: 16 }}>
        当前总价：<b>{totalCost}</b> / 可用资金：<b>{money}</b>
      </div>
    </Modal>
  );
};

export default BuyStock;

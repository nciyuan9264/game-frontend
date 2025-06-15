import { useEffect, useState } from "react";
import { Modal, Card, Radio, Row, Col, Button } from "antd";
import { CompanyInfoItem, CompanyKey } from "@/types/room";
import { CompanyColor } from "@/const/color";
import { useThrottleFn } from "ahooks";

const CreateCompanyModal = ({ visible, company, onSelect, onCancel }:
  {
    visible: boolean,
    company?: Record<CompanyKey, CompanyInfoItem>,
    onSelect: (company: string) => void,
    onCancel: () => void,
  }) => {
  if (!company) return null;

  const [selected, setSelected] = useState<string | undefined>(undefined);

  useEffect(() => {
    setSelected(undefined);
  }, [visible])

  const { run: debouncedHandleOk } = useThrottleFn(() => {
    if (selected) {
      onSelect(selected);
    } else {
      Modal.error({
        title: "请选择要创建的公司",
      });
    }
  }, { wait: 1000 });


  return (
    <Modal
      title="请选择要创建的公司"
      open={visible}
      closable={true}
      footer={null}
      centered
      maskClosable={true}
      onCancel={onCancel}
    >
      <Radio.Group onChange={(e) => setSelected(e.target.value)} value={selected}>
        <Row gutter={[16, 16]}>
          {Object.entries(company).map(([key, value]) => {
            const isDisabled = value.tiles !== "0";
            return (
              <Col span={12} key={key}>
                <Card
                  size="small"
                  hoverable={!isDisabled}
                  style={{
                    opacity: isDisabled ? 0.4 : 1,
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    backgroundColor: CompanyColor[value.name as CompanyKey]
                  }}
                  onClick={() => !isDisabled && setSelected(key)}
                >
                  <Radio value={key} disabled={isDisabled}>
                    <b>{value.name}</b>
                  </Radio>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Radio.Group>

      <div style={{ marginTop: 24, textAlign: "right" }}>
        <Button
          type="primary"
          disabled={!selected}
          onClick={debouncedHandleOk}
        >
          确认创建
        </Button>
      </div>
    </Modal>
  );
};

export default CreateCompanyModal;

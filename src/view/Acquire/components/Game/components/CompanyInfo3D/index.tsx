import React, { useEffect, useRef, useState } from 'react';
import { CompanyKey, WsRoomSyncData } from '@/types/AcquireRoom';
import styles from './index.module.less';
import { CompanyColor } from '@/const/color';

interface CompanyInfoProps {
  setBuyStockModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setMergeCompanyModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  data?: WsRoomSyncData;
  userID: string;
}

interface CompanyDelta {
  [key: string]: {
    stockPrice: number;
    stockTotal: number;
    tiles: number;
  };
}

const CompanyInfo3D: React.FC<CompanyInfoProps> = ({
  data,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevDataRef = useRef<WsRoomSyncData>();
  const [deltas, setDeltas] = useState<CompanyDelta>({});
  const [animationFrame, setAnimationFrame] = useState<number>(0);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);

  useEffect(() => {
    if (!data) return;
    const prev = prevDataRef.current;
    const delta: CompanyDelta = {};

    if (prev) {
      const companies = data.roomData.companyInfo;
      for (const name in companies) {
        const prevCompany = prev.roomData.companyInfo[name as CompanyKey];
        const currCompany = companies[name as CompanyKey];
        if (!prevCompany) continue;

        delta[name] = {
          stockPrice: currCompany.stockPrice - prevCompany.stockPrice,
          stockTotal: currCompany.stockTotal - prevCompany.stockTotal,
          tiles: currCompany.tiles - prevCompany.tiles,
        };
      }
      if (!Object.entries(delta).map(([_, v]) => v).every(v => v.stockPrice === 0 && v.stockTotal === 0 && v.tiles === 0)) {
        setDeltas(delta);
        setAnimationFrame(Date.now());
      }
    }

    prevDataRef.current = data;
  }, [data?.roomData.currentPlayer]);

  // 切换收起/展开状态
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // // 绘制游戏风格背景
  // const drawGameBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  //   // 深色科技风背景
  //   const gradient = ctx.createLinearGradient(0, 0, 0, height);
  //   gradient.addColorStop(0, '#1a1a2e');
  //   gradient.addColorStop(0.5, '#16213e');
  //   gradient.addColorStop(1, '#0f3460');
  //   ctx.fillStyle = gradient;
  //   ctx.fillRect(0, 0, width, height);

  //   // 添加网格纹理
  //   ctx.strokeStyle = 'rgba(100, 200, 255, 0.1)';
  //   ctx.lineWidth = 1;
  //   for (let i = 0; i < width; i += 20) {
  //     ctx.beginPath();
  //     ctx.moveTo(i, 0);
  //     ctx.lineTo(i, height);
  //     ctx.stroke();
  //   }
  //   for (let i = 0; i < height; i += 20) {
  //     ctx.beginPath();
  //     ctx.moveTo(0, i);
  //     ctx.lineTo(width, i);
  //     ctx.stroke();
  //   }

  //   // 添加发光边框
  //   ctx.strokeStyle = '#00d4ff';
  //   ctx.lineWidth = 3;
  //   ctx.shadowColor = '#00d4ff';
  //   ctx.shadowBlur = 10;
  //   ctx.strokeRect(0, 0, width, height);
  //   ctx.shadowBlur = 0;
  // };

  // 绘制游戏风格按钮/面板
  const drawGamePanel = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, isHeader = false) => {
    ctx.save();

    // 主背景
    if (isHeader) {
      const gradient = ctx.createLinearGradient(x, y, x, y + height);
      gradient.addColorStop(0, '#4a90e2');
      gradient.addColorStop(0.5, '#357abd');
      gradient.addColorStop(1, '#1e5f99');
      ctx.fillStyle = gradient;
    } else {
      const gradient = ctx.createLinearGradient(x, y, x, y + height);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
      ctx.fillStyle = gradient;
    }

    // 圆角矩形 - 使用精确的尺寸
    const radius = 6; // 稍微减小圆角半径
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();

    // 发光边框 - 精确贴合内容
    ctx.strokeStyle = isHeader ? '#00d4ff' : 'rgba(0, 212, 255, 0.3)';
    ctx.lineWidth = 1.5; // 稍微减小边框宽度
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = isHeader ? 6 : 3; // 减小发光效果
    ctx.stroke();

    ctx.restore();
  };

  // 绘制游戏风格文字
  const drawGameText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, options: {
    size?: number;
    color?: string;
    bold?: boolean;
    glow?: boolean;
    align?: CanvasTextAlign;
  } = {}) => {
    const { size = 14, color = '#ffffff', bold = false, glow = false, align = 'center' } = options;

    ctx.save();
    ctx.font = `${bold ? 'bold ' : ''}${size}px 'Orbitron', 'Arial', sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';

    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeText(text, x, y);
    }

    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  const drawTable = () => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 表格配置（提前计算）
    const padding = 6;
    const headerHeight = 50;
    const rowHeight = 60;
    const colWidths = [140, 90, 110, 90];
    const totalWidth = colWidths.reduce((sum, width) => sum + width, 0);
    const companies = Object.values(data.roomData.companyInfo);
    const totalHeight = headerHeight + companies.length * rowHeight + padding * 2;

    // 设置canvas尺寸为表格尺寸
    const dpr = window.devicePixelRatio || 1;
    const scale = 0.87;

    // canvas实际尺寸 = 表格尺寸 * 缩放比例
    const canvasDisplayWidth = totalWidth * scale;
    const canvasDisplayHeight = totalHeight * scale;

    canvas.width = canvasDisplayWidth * dpr;
    canvas.height = canvasDisplayHeight * dpr;
    canvas.style.width = `${canvasDisplayWidth}px`;
    canvas.style.height = `${canvasDisplayHeight}px`;

    ctx.scale(dpr, dpr);

    // 清空画布
    ctx.clearRect(0, 0, canvasDisplayWidth, canvasDisplayHeight);

    ctx.save();
    ctx.scale(scale, scale);

    // const canvasWidth = totalWidth;
    // const canvasHeight = totalHeight;

    // 表格居中（现在不需要居中，因为canvas就是表格大小）
    const tableX = 0;
    const tableY = padding;

    // 绘制表头
    const headers = ['🏢 公司', '💰 股价', '📊 剩余股票', '🏗️ 土地数'];
    let x = tableX;

    // 表头背景面板
    drawGamePanel(ctx, tableX, tableY, totalWidth, headerHeight, true);

    headers.forEach((header, index) => {
      const colWidth = colWidths[index];

      // 表头文字
      drawGameText(ctx, header, x + colWidth / 2, tableY + headerHeight / 2, {
        size: 16,
        color: 'rgba(255, 255, 255, 1)', // 将不透明度从1.0降到0.8
        // bold: true,
        // glow: true
      });

      // 列分隔线
      if (index < headers.length - 1) {
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + colWidth, tableY + 10);
        ctx.lineTo(x + colWidth, tableY + headerHeight - 10);
        ctx.stroke();
      }

      x += colWidth;
    });

    // 绘制数据行
    const currentTime = Date.now();
    const flashDuration = 3000;

    companies.forEach((company, rowIndex) => {
      const y = tableY + headerHeight + rowIndex * rowHeight;
      const companyDelta = deltas[company.name] || { stockPrice: 0, stockTotal: 0, tiles: 0 };

      // 行背景面板
      drawGamePanel(ctx, tableX, y, totalWidth, rowHeight, false);

      let cellX = tableX;

      // 公司名称列
      const companyColor = CompanyColor[company.name as CompanyKey];

      // 为第一列添加背景
      drawCellBackground(ctx, cellX, y, colWidths[0], rowHeight);

      // 公司颜色指示器
      ctx.fillStyle = companyColor;
      ctx.shadowColor = companyColor;
      ctx.shadowBlur = 10;
      ctx.fillRect(cellX + 10, y + 15, 20, rowHeight - 30);
      ctx.shadowBlur = 0;

      // 公司名称
      drawGameText(ctx, company.name, cellX + colWidths[0] / 2 + 15, y + rowHeight / 2, {
        size: 14,
        color: '#ffffff',
        bold: true
      });

      cellX += colWidths[0];

      // 绘制数值列
      const values = [
        { value: company.stockPrice, delta: companyDelta.stockPrice, prefix: '$' },
        { value: company.stockTotal, delta: companyDelta.stockTotal, prefix: '' },
        { value: company.tiles, delta: companyDelta.tiles, prefix: '' }
      ];

      values.forEach((item, colIndex) => {
        const colWidth = colWidths[colIndex + 1];
        drawCellBackground(ctx, cellX, y, colWidth, rowHeight);
        // 列分隔线
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cellX, y + 10);
        ctx.lineTo(cellX, y + rowHeight - 10);
        ctx.stroke();

        // 主数值 - 完全居中
        drawGameText(ctx, `${item.prefix}${item.value}`, cellX + colWidth / 2, y + rowHeight / 2, {
          size: 22,
          color: '#00ff88',
          bold: true
        });

        // 变化值（带闪烁效果）
        if (item.delta !== 0) {
          const timeSinceChange = currentTime - animationFrame;
          let alpha = 1;

          if (timeSinceChange < flashDuration) {
            const flashCycle = (timeSinceChange % 500) / 500;
            alpha = 0.5 + 0.5 * Math.abs(Math.sin(flashCycle * Math.PI * 2));
          }

          ctx.save();
          ctx.globalAlpha = alpha;

          const deltaColor = item.delta > 0 ? '#00ff00' : '#ff4444';
          const deltaText = item.delta > 0 ? `+${item.delta}` : item.delta.toString();

          // 变化值 - 显示在主数值下方，但仍在行内居中
          drawGameText(ctx, deltaText, cellX + colWidth / 2, y + rowHeight / 2 + 18, {
            size: 14,
            color: deltaColor,
            // bold: true,
            glow: true
          });

          ctx.restore();
        }

        cellX += colWidth;
      });
    });

    ctx.restore();
  };

  useEffect(() => {
    drawTable();

    let animationId: number;
    const animate = () => {
      drawTable();
      animationId = requestAnimationFrame(animate);
    };

    if (Object.values(deltas).some(delta => delta.stockPrice !== 0 || delta.stockTotal !== 0 || delta.tiles !== 0)) {
      animationId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [data, deltas, animationFrame]);

  if (!data) return null;

  return (
    <div className={`${styles.companyInfo3D} ${isCollapsed ? styles.collapsed : ''}`}>
      {/* 独立的收起/展开按钮 */}
      <button
        className={styles.toggleButton}
        onClick={toggleCollapse}
        aria-label={isCollapsed ? '展开表格' : '收起表格'}
      >
        <span className={`${styles.arrow} ${isCollapsed ? styles.arrowRight : styles.arrowLeft}`}>
          {isCollapsed ? '▶' : '◀'}
        </span>
      </button>

      {/* Canvas表格 */}
      <canvas
        ref={canvasRef}
        className={styles.marketCanvas}
        style={{
          width: '100%',
          height: `${Object.values(data.roomData.companyInfo).length * 60}px`,
        }}
      />
    </div>
  );
};

export default CompanyInfo3D;


// 绘制单元格背景（可选）
const drawCellBackground = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
  ctx.save();

  // 轻微的渐变背景
  const gradient = ctx.createLinearGradient(x, y, x, y + height);
  gradient.addColorStop(0, 'rgba(26, 26, 46, 0.3)');
  gradient.addColorStop(1, 'rgba(15, 52, 96, 0.3)');
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);

  // 可选：添加细微的网格纹理
  ctx.strokeStyle = 'rgba(100, 200, 255, 0.05)';
  ctx.lineWidth = 0.5;
  for (let i = x; i < x + width; i += 10) {
    ctx.beginPath();
    ctx.moveTo(i, y);
    ctx.lineTo(i, y + height);
    ctx.stroke();
  }

  ctx.restore();
};

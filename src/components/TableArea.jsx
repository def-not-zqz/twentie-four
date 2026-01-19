import React from 'react';
import PokerCard from './PokerCards'; // 导入我们刚才拆分出的组件
import '../styles/TableArea.css';

const TableArea = ({ field = [], revealed = false }) => {
  // 核心逻辑：确保无论后端传回几张牌，页面始终渲染 4 个坑位
  // 如果 field 长度不足 4，剩下的用 null 填充
  const slots = [...field, ...Array(Math.max(0, 4 - field.length)).fill(null)];

  return (
    <div className="table-area">
      <div className="table-area__container">
        {slots.slice(0, 4).map((card, index) => (
          <div key={index} className="table-area__slot">
            <PokerCard
              card={card}
              revealed={revealed}
              // 你可以根据索引给不同的牌加一点点入场延迟
              className={`card-index-${index}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableArea;
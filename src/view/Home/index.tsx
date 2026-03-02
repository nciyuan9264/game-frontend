import styles from './index.module.less';
import { motion } from "motion/react";
import { TrendingUp, Users, Cpu, Smartphone, Monitor, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className={styles.posterContainer}>
      {/* Background Decorative Elements */}
      <div className={styles.backgroundDecor}>
        <div className={styles.glowTop} />
        <div className={styles.glowBottom} />
        <div className={styles.gridOverlay} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.posterCard}
      >
        {/* Left Content Area */}
        <div className={styles.contentArea}>
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={styles.badge}
          >
            <TrendingUp size={14} />
            经典桌游 · 线上完美还原
          </motion.div>

          <motion.h1
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={styles.title}
          >
            ACQUIRE <br />
            <span className={styles.gradientText}>
              并购风云
            </span>
          </motion.h1>

          <motion.p
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={styles.description}
          >
            在指尖开启一场价值千万的商业博弈。选址、注资、合并、清算，谁才是最后的商业巨头？
          </motion.p>

          <div className={styles.featuresGrid}>
            {[
              { icon: <Smartphone size={20} />, title: "全平台适配", desc: "手机/平板/PC 随时开局" },
              { icon: <Cpu size={20} />, title: "智能 AI 陪练", desc: "新手友好，老手过招" },
              { icon: <Users size={20} />, title: "多人联机", desc: "好友约战，实时竞技" },
              { icon: <Monitor size={20} />, title: "无需下载", desc: "网页即开即玩，极速体验" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className={styles.featureItem}
              >
                <div className={styles.iconWrapper}>
                  {item.icon}
                </div>
                <div>
                  <h3 className={styles.featureTitle}>{item.title}</h3>
                  <p className={styles.featureDesc}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
            className={styles.actions}
          >
            <button className={styles.primaryBtn} onClick={() => navigate('/game/acquire')}>
              立即开局
              <ArrowRight size={18} />
            </button>
          </motion.div>
        </div>

        {/* Right Visual Area */}
        <div className={styles.visualArea}>
          {/* Mockup Elements */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, rotate: 5 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ delay: 0.6, type: "spring" }}
            className={styles.mockup}
          >
            {/* Game UI Mockup */}
            <div className={styles.gameUI}>
              <div className={styles.header}>
                <div className={styles.avatar} />
                <div className={styles.turnBadge}>你的回合</div>
                <div className={styles.menuIcon} />
              </div>

              <div className={styles.stockList}>
                {[1, 2, 3].map(i => (
                  <div key={i} className={styles.stockItem}>
                    <div className={styles.stockInfo}>
                      <div className={styles.dot} style={{ backgroundColor: i === 1 ? '#60a5fa' : i === 2 ? '#34d399' : '#fbbf24' }} />
                      <div className={styles.bar} />
                    </div>
                    <div className={styles.priceBar} />
                  </div>
                ))}
              </div>

              <div className={styles.grid}>
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className={`${styles.cell} ${[12, 13, 19, 20, 21].includes(i) ? styles.active : ''}`} />
                ))}
              </div>

              <div className={styles.footer}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={styles.tile} />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Floating Cards */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className={`${styles.floatingCard} ${styles.blue}`}
          >
            <div className={styles.cardIcon} />
            <div className={styles.cardLine} />
            <div className={`${styles.cardLine} ${styles.short}`} />
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className={`${styles.floatingCard} ${styles.emerald}`}
          >
            <div className={styles.cardIcon} />
            <div className={styles.cardLine} />
            <div className={`${styles.cardLine} ${styles.short}`} />
          </motion.div>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <div className={styles.footerBranding}>
        Designed for Strategists · Powered by Acquire Online
      </div>
    </div>
  );
}

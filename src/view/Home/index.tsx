import { useNavigate } from "react-router-dom";
import styles from './index.module.less';

const games = [
  {
    name: "Splendor",
    description: "璀璨宝石：策略与资源管理的经典桌游",
    path: "/game/splendor",
    image: "/cover/splendor.jpg",
  },
  {
    name: "Acquire",
    description: "并购风云：并购与股市对战的烧脑游戏",
    path: "/game/acquire",
    image: "/cover/acquire.jpg",
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🎮 选择游戏开始</h1>
      <div className={styles.grid}>
        {games.map((game) => (
          <div
            key={game.name}
            className={styles.card}
            onClick={() => navigate(game.path)}
          >
            <img
              src={game.image}
              alt={game.name}
              className={styles.image}
            />
            <div className={styles.cardContent}>
              <h2 className={styles.cardTitle}>{game.name}</h2>
              <p className={styles.cardDesc}>{game.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import styles from './page.module.css';
import CrudClient from './components/CrudClient';
import HourglassServer from './components/hourglass/HourglassServer';

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.todoPane} aria-label="Todo list">
        <CrudClient />
      </section>

      <aside className={styles.hourglassPane} aria-label="Hourglass">
        <HourglassServer />
      </aside>
    </main>
  );
}

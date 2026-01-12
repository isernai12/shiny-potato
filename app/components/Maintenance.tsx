import styles from "./maintenance.module.css";

export default function Maintenance() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Server maintenance</h1>
        <p className={styles.text}>We are performing maintenance. Please try again later.</p>
      </div>
    </main>
  );
}

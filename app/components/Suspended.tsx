import styles from "./suspended.module.css";

export default function Suspended() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>You are suspended</h1>
        <p className={styles.text}>Your account is suspended. Please contact support.</p>
      </div>
    </main>
  );
}

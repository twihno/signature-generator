import { AccountButton } from "@/app/components/accountButton";
import { getServerSession } from "@/util/session";

import styles from "./pageHeader.module.css";

export async function PageHeader() {
  const session = await getServerSession();

  let button = <AccountButton logged_in={false} email={""} name={""} />;
  if (session && session.user) {
    button = (
      <AccountButton
        logged_in={true}
        email={session.user.email ? session.user.email : "mail"}
        name={session.user.name ? session.user.name : "name"}
      />
    );
  }

  return (
    <div className={styles["wrapper-header"]}>
      <header className={styles["header"]}>
        <h1 className={styles["page-title"]}>Signaturtool</h1>
        {button}
      </header>
    </div>
  );
}

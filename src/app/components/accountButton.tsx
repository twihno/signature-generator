"use client";

import { Login_24p } from "@/app/components/icons/material/login_24dp";
import { Logout_24dp } from "@/app/components/icons/material/logout_24dp";
import { signIn, signOut } from "next-auth/react";

import styles from "./accountButton.module.css";

export function AccountButton(props: {
  logged_in: boolean;
  name: string;
  email: string;
}) {
  if (props.logged_in) {
    return (
      <div className={styles["wrapper"]}>
        <span>{props.name}</span>
        <button
          title="Logout"
          className={styles["button"]}
          onClick={() => signOut()}
        >
          <Logout_24dp className={styles["icon"]} />
        </button>
      </div>
    );
  }
  return (
    <div className={styles["wrapper"]}>
      <button
        title="Sign in"
        className={styles["button"]}
        onClick={() => signIn()}
      >
        <Login_24p className={styles["icon"]} />
        <span>Sign in</span>
      </button>
    </div>
  );
}

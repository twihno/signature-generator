import { getServerSession } from "@/util/session";

export default async function Home() {
  let session = await getServerSession();

  if (session) {
    return <p>Hallo {session.user?.name}</p>;
  } else {
  }
}

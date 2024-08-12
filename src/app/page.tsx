import { getServerSession } from "@/util/session";
import { Configurator } from "./components/configurator";

export default async function Home() {
  let session = await getServerSession();

  if (session !== null) {
    return <Configurator />;
  } else {
    return <div>EINLOGGEN!!!!</div>;
  }
}
